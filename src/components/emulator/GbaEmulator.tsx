import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Upload, Maximize2, FastForward, Save, Sparkles, Loader2, Gamepad2, Camera } from 'lucide-react';
import { Nostalgist } from 'nostalgist';
import { db } from '../../services/db';
import { processRomUpload } from '../../services/romHandler';
import { parseGen3Save, ParsedSaveData } from '../../services/saveParser';
import { syncSaveFileWithCloud } from '../../services/supabase';
import { UserProfile } from '../../services/auth';

interface GbaEmulatorProps {
    gameCode: string;
    onSaveAutoParsed: (parsedData: ParsedSaveData) => void;
    onRomLoaded?: (title: string, code: string) => void;
    autoStartCode?: string | null;
    currentUser?: UserProfile | null;
}

export const GbaEmulator: React.FC<GbaEmulatorProps> = ({
    gameCode,
    onSaveAutoParsed,
    onRomLoaded,
    autoStartCode,
    currentUser
}) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const nostalgistRef = useRef<any>(null);
    const intervalRef = useRef<any>(null);

    const [isEmulatorRunning, setIsEmulatorRunning] = useState(false);
    const [isLoadingCore, setIsLoadingCore] = useState(false);
    const [activeRomTitle, setActiveRomTitle] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [storedRoms, setStoredRoms] = useState<any[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isFastForward, setIsFastForward] = useState(false);
    const [showTouchControls, setShowTouchControls] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
    const [quickStateBlob, setQuickStateBlob] = useState<Blob | null>(null);

    useEffect(() => {
        db.listRoms().then(list => {
            setStoredRoms(list);
            if (autoStartCode) {
                const found = list.find(r => r.gameCode === autoStartCode);
                if (found) startRomFromDb(autoStartCode);
            }
        });
    }, [autoStartCode]);

    // Função de Salvamento Robusta (SRAM -> IndexedDB + Supabase + Living Dex)
    const saveAndSyncSram = useCallback(async (isManual: boolean = false) => {
        if (!nostalgistRef.current) return;
        try {
            const sramBlob = await nostalgistRef.current.saveSRAM();
            if (!sramBlob) return;

            const buffer = await sramBlob.arrayBuffer();
            if (buffer.byteLength >= 65536) {
                const sramBytes = new Uint8Array(buffer);
                
                // 1. Gravar no IndexedDB local
                await db.saveSram(gameCode, sramBytes);

                // 2. Gravar na nuvem do Supabase
                if (currentUser && !currentUser.isGuest) {
                    syncSaveFileWithCloud(gameCode, { gameCode, sramData: sramBytes, updatedAt: Date.now() }, currentUser.id);
                }

                // 3. Atualizar Living Dex e Equipe
                const parsed = parseGen3Save(buffer, gameCode);
                onSaveAutoParsed(parsed);

                const nowTime = new Date().toLocaleTimeString();
                setLastSavedTime(nowTime);

                if (isManual) {
                    setStatusMessage(`💾 Save de "${parsed.trainerName}" salvo com sucesso (${nowTime})!`);
                    setTimeout(() => setStatusMessage(null), 3500);
                }
            }
        } catch (e) {
            console.warn('[Save/Sync Warning]', e);
        }
    }, [gameCode, currentUser, onSaveAutoParsed]);

    // Salvar ao fechar a aba
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveAndSyncSram(false);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            saveAndSyncSram(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (nostalgistRef.current) {
                try {
                    nostalgistRef.current.exit();
                } catch (e) {}
                nostalgistRef.current = null;
            }
        };
    }, [saveAndSyncSram]);

    // Iniciar Nostalgist
    const launchNostalgistWithRom = async (romData: ArrayBuffer, title: string, code: string) => {
        try {
            setIsLoadingCore(true);
            setStatusMessage(`Iniciando mGBA WebAssembly...`);

            if (nostalgistRef.current) {
                try {
                    nostalgistRef.current.exit();
                } catch (e) {}
                nostalgistRef.current = null;
            }

            if (intervalRef.current) clearInterval(intervalRef.current);

            // Carregar save anterior do IndexedDB para continuar o jogo
            const existingSave = await db.getSram(code);

            const launchOptions: any = {
                core: 'mgba',
                rom: {
                    fileName: `${code}.gba`,
                    fileContent: new Uint8Array(romData)
                },
                element: canvasRef.current || undefined,
                retroarchConfig: {
                    // Controles: WASD para Direcionais, E para A, Shift para B
                    input_player1_up: 'w',
                    input_player1_down: 's',
                    input_player1_left: 'a',
                    input_player1_right: 'd',
                    input_player1_a: 'e',
                    input_player1_b: 'shift',
                    input_player1_l: 'q',
                    input_player1_r: 'r',
                    input_player1_start: 'enter',
                    input_player1_select: 'space',
                    fastforward_ratio: 3.0
                }
            };

            if (existingSave?.sramData && existingSave.sramData.length >= 65536) {
                launchOptions.sram = {
                    fileName: `${code}.sav`,
                    fileContent: existingSave.sramData
                };
                launchOptions.sramType = 'sav';
            }

            const instance = await Nostalgist.launch(launchOptions);

            nostalgistRef.current = instance;
            setActiveRomTitle(title);
            setIsEmulatorRunning(true);
            setIsLoadingCore(false);
            setIsFastForward(false);
            
            const saveNotice = existingSave ? ' (Save anterior restaurado)' : '';
            setStatusMessage(`🎮 "${title}" iniciado${saveNotice}!`);
            setTimeout(() => setStatusMessage(null), 4000);

            if (onRomLoaded) onRomLoaded(title, code);

            // Salvar automaticamente a cada 5 segundos
            intervalRef.current = setInterval(() => saveAndSyncSram(false), 5000);
        } catch (err: any) {
            console.error('Erro ao iniciar emulador:', err);
            setIsLoadingCore(false);
            alert(`Erro ao iniciar motor GBA: ${err.message || err}`);
            setStatusMessage(null);
        }
    };

    const startRomFromDb = async (code: string) => {
        try {
            setStatusMessage('Carregando ROM...');
            const stored = await db.getRom(code);
            if (!stored || !stored.romData) {
                alert('ROM não encontrada.');
                return;
            }
            await launchNostalgistWithRom(stored.romData, stored.title, stored.gameCode);
        } catch (e: any) {
            alert(`Erro: ${e.message}`);
            setStatusMessage(null);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage('Processando ROM...');
            const { header, storedRom } = await processRomUpload(file);
            await launchNostalgistWithRom(storedRom.romData, header.title, header.gameCode);
            db.listRoms().then(list => setStoredRoms(list));
        } catch (err: any) {
            alert(`Erro ao carregar ROM: ${err.message}`);
            setStatusMessage(null);
        }
    };

    // Alternar Fast-Forward (Aceleração)
    const handleToggleFastForward = () => {
        if (!nostalgistRef.current) return;
        try {
            nostalgistRef.current.sendCommand('FAST_FORWARD');
            setIsFastForward(prev => !prev);
            setStatusMessage(isFastForward ? 'Velocidade normal (1x)' : '⚡ Fast-Forward Ativo (3x)');
            setTimeout(() => setStatusMessage(null), 2500);
        } catch (e) {
            console.warn('Fast forward erro:', e);
        }
    };

    const handleTogglePause = () => {
        if (!nostalgistRef.current) return;
        if (isPaused) {
            nostalgistRef.current.resume();
            setIsPaused(false);
        } else {
            nostalgistRef.current.pause();
            setIsPaused(true);
        }
    };

    const handleRestart = () => {
        if (!nostalgistRef.current) return;
        nostalgistRef.current.restart();
    };

    // Quick Save State
    const handleQuickSaveState = async () => {
        if (!nostalgistRef.current) return;
        try {
            const { state } = await nostalgistRef.current.saveState();
            setQuickStateBlob(state);
            setStatusMessage('⚡ Save State gravado na memória!');
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (e: any) {
            alert(`Erro no Save State: ${e.message}`);
        }
    };

    // Quick Load State
    const handleQuickLoadState = async () => {
        if (!nostalgistRef.current || !quickStateBlob) {
            alert('Nenhum Save State gravado nesta sessão.');
            return;
        }
        try {
            await nostalgistRef.current.loadState(quickStateBlob);
            setStatusMessage('⚡ Save State restaurado!');
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (e: any) {
            alert(`Erro ao carregar Save State: ${e.message}`);
        }
    };

    const handleExportSave = async () => {
        if (!nostalgistRef.current) return;
        try {
            const sramBlob = await nostalgistRef.current.saveSRAM();
            const url = URL.createObjectURL(sramBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${gameCode || 'pokemon'}.sav`;
            a.click();
            URL.revokeObjectURL(url);
            setStatusMessage('Save (.sav) baixado com sucesso!');
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (e: any) {
            alert(`Erro ao exportar save: ${e.message}`);
        }
    };

    const handleScreenshot = async () => {
        if (!nostalgistRef.current) return;
        try {
            const blob = await nostalgistRef.current.screenshot();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeRomTitle || 'game'}_screenshot.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {}
    };

    const handleFullscreen = () => {
        if (canvasRef.current && canvasRef.current.requestFullscreen) {
            canvasRef.current.requestFullscreen();
        }
    };

    const sendButtonPress = (btn: string) => {
        if (nostalgistRef.current) {
            nostalgistRef.current.press(btn);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-4xl mx-auto space-y-4 animate-fade-in text-gray-100">
            
            {/* Header da Barra de Controle */}
            <div className="w-full flex flex-wrap items-center justify-between bg-gray-900 border border-white/10 p-4 rounded-3xl shadow-xl gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600/20 text-red-500 rounded-2xl border border-red-500/30">
                        <Gamepad2 size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-base text-gray-100">{activeRomTitle || 'Emulador GBA Integrado'}</h3>
                        <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
                            {isEmulatorRunning ? (
                                <>
                                    <span className="text-green-400">🟢 60 FPS</span>
                                    {lastSavedTime && <span className="text-gray-500">• Salvo às {lastSavedTime}</span>}
                                </>
                            ) : (
                                '⚪ Aguardando Seleção de ROM'
                            )}
                        </p>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".gba,.zip"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {isEmulatorRunning && (
                        <>
                            {/* Botão de Fast-Forward */}
                            <button
                                onClick={handleToggleFastForward}
                                className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all ${
                                    isFastForward
                                        ? 'bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/20'
                                        : 'bg-gray-800 hover:bg-gray-700 text-yellow-400 border-white/10'
                                }`}
                                title="Acelerar Velocidade do Jogo (3x)"
                            >
                                <FastForward size={16} />
                                <span>{isFastForward ? '3x' : '1x'}</span>
                            </button>

                            {/* Botão de Salvar Manual */}
                            <button
                                onClick={() => saveAndSyncSram(true)}
                                className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-green-600/20"
                                title="Gravar Save do Jogo e Sincronizar com a Nuvem"
                            >
                                <Save size={16} />
                                <span className="hidden sm:inline">Salvar</span>
                            </button>

                            <button
                                onClick={handleTogglePause}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 transition-all"
                                title={isPaused ? "Retomar" : "Pausar"}
                            >
                                {isPaused ? <Play size={16} className="text-green-400" /> : <Pause size={16} />}
                            </button>

                            <button
                                onClick={handleRestart}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 transition-all"
                                title="Reiniciar Jogo"
                            >
                                <RotateCcw size={16} />
                            </button>

                            <button
                                onClick={handleQuickSaveState}
                                className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl transition-all"
                                title="Quick Save State"
                            >
                                State +
                            </button>

                            {quickStateBlob && (
                                <button
                                    onClick={handleQuickLoadState}
                                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all"
                                    title="Quick Load State"
                                >
                                    State ⟳
                                </button>
                            )}

                            <button
                                onClick={handleExportSave}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 transition-all"
                                title="Baixar Save .sav"
                            >
                                <Download size={16} />
                            </button>

                            <button
                                onClick={handleScreenshot}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 transition-all"
                                title="Capturar Tela"
                            >
                                <Camera size={16} />
                            </button>

                            <button
                                onClick={handleFullscreen}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 transition-all"
                                title="Tela Cheia"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
                    >
                        <Upload size={16} />
                        <span>{isEmulatorRunning ? 'Trocar ROM' : 'Carregar ROM (.gba / .zip)'}</span>
                    </button>
                </div>
            </div>

            {/* Status Toast */}
            {statusMessage && (
                <div className="w-full p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-xs text-blue-300 font-bold flex items-center gap-2 animate-fade-in">
                    <Sparkles size={16} className="text-blue-400" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* Container do Jogo: Canvas SEMPRE presente no DOM para o WebGL funcionar */}
            <div className="relative w-full aspect-[3/2] max-w-[720px] bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl flex items-center justify-center">
                
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain image-pixelated block"
                />

                {/* Overlay quando o jogo não está ativo */}
                {!isEmulatorRunning && (
                    <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center gap-5 p-8 text-center z-10">
                        {isLoadingCore ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={48} className="animate-spin text-red-500" />
                                <p className="font-bold text-gray-200 text-sm">Carregando mGBA WebAssembly...</p>
                            </div>
                        ) : (
                            <>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-6 rounded-3xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 cursor-pointer transition-all duration-300 hover:scale-110 shadow-2xl"
                                >
                                    <Play size={48} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-lg text-gray-200">Pronto para Jogar</h4>
                                    <p className="text-xs text-gray-400 max-w-md">
                                        Clique no botão acima para selecionar a ROM. Seu save será lembrado automaticamente!
                                    </p>
                                </div>

                                {storedRoms.length > 0 && (
                                    <div className="pt-4 border-t border-white/10 w-full space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ROMs Salvas no seu Navegador:</p>
                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            {storedRoms.map(r => (
                                                <button
                                                    key={r.gameCode}
                                                    onClick={() => startRomFromDb(r.gameCode)}
                                                    className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-white/10 text-xs font-bold rounded-xl flex items-center gap-2 text-gray-200 transition-all hover:border-red-500/40 shadow"
                                                >
                                                    <Play size={14} className="text-red-400" />
                                                    <span>{r.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Mapeamento de Controles */}
            <div className="w-full max-w-[720px] bg-gray-900/60 border border-white/10 p-4 rounded-2xl flex flex-wrap items-center justify-between text-xs text-gray-400 gap-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-bold text-gray-200">⌨️ Controles:</span>
                    <span><strong className="text-red-400">WASD</strong> = Direcionais</span>
                    <span><strong className="text-yellow-400">E</strong> = Botão A</span>
                    <span><strong className="text-blue-400">Shift</strong> = Botão B</span>
                    <span><strong>Q / R</strong> = L / R</span>
                    <span><strong>Enter</strong> = Start</span>
                    <span><strong>Espaço</strong> = Select</span>
                </div>
                <button
                    onClick={() => setShowTouchControls(p => !p)}
                    className="text-red-400 hover:text-red-300 font-bold ml-auto"
                >
                    {showTouchControls ? 'Ocultar Controles Touch' : 'Exibir Controles Touch'}
                </button>
            </div>

            {/* Gamepad Virtual Touch para Celulares */}
            {showTouchControls && isEmulatorRunning && (
                <div className="w-full max-w-[720px] bg-gray-950/90 border border-white/10 p-6 rounded-3xl grid grid-cols-2 gap-8 select-none">
                    {/* D-Pad */}
                    <div className="flex flex-col items-center gap-2">
                        <button onPointerDown={() => sendButtonPress('up')} className="w-12 h-12 bg-gray-800 active:bg-red-600 rounded-xl font-bold text-lg">▲</button>
                        <div className="flex gap-4">
                            <button onPointerDown={() => sendButtonPress('left')} className="w-12 h-12 bg-gray-800 active:bg-red-600 rounded-xl font-bold text-lg">◀</button>
                            <button onPointerDown={() => sendButtonPress('right')} className="w-12 h-12 bg-gray-800 active:bg-red-600 rounded-xl font-bold text-lg">▶</button>
                        </div>
                        <button onPointerDown={() => sendButtonPress('down')} className="w-12 h-12 bg-gray-800 active:bg-red-600 rounded-xl font-bold text-lg">▼</button>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex gap-4">
                            <button onPointerDown={() => sendButtonPress('b')} className="w-14 h-14 bg-gray-800 active:bg-red-600 rounded-full font-bold text-base shadow-lg border border-white/10">B (Shift)</button>
                            <button onPointerDown={() => sendButtonPress('a')} className="w-14 h-14 bg-red-600 active:bg-red-500 text-white rounded-full font-bold text-base shadow-lg">A (E)</button>
                        </div>
                        <div className="flex gap-4">
                            <button onPointerDown={() => sendButtonPress('select')} className="px-3 py-1.5 bg-gray-800 active:bg-gray-700 rounded-lg text-xs font-bold">SELECT</button>
                            <button onPointerDown={() => sendButtonPress('start')} className="px-3 py-1.5 bg-gray-800 active:bg-gray-700 rounded-lg text-xs font-bold">START</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
