import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Upload, Maximize2, FastForward, Volume2, VolumeX, Save, Sparkles, Loader2, Gamepad2, Camera } from 'lucide-react';
import { Nostalgist } from 'nostalgist';
import { db, StoredRom } from '../../services/db';
import { processRomUpload } from '../../services/romHandler';
import { parseGen3Save, ParsedSaveData } from '../../services/saveParser';

interface GbaEmulatorProps {
    gameCode: string;
    onSaveAutoParsed: (parsedData: ParsedSaveData) => void;
    onRomLoaded?: (title: string, code: string) => void;
    autoStartCode?: string | null;
}

export const GbaEmulator: React.FC<GbaEmulatorProps> = ({
    gameCode,
    onSaveAutoParsed,
    onRomLoaded,
    autoStartCode
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
    const [isMuted, setIsMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showTouchControls, setShowTouchControls] = useState(false);

    // Carregar ROMs do IndexedDB
    useEffect(() => {
        db.listRoms().then(list => {
            setStoredRoms(list);
            if (autoStartCode) {
                const found = list.find(r => r.gameCode === autoStartCode);
                if (found) startRomFromDb(autoStartCode);
            }
        });
    }, [autoStartCode]);

    // Encerrar emulador ao desmontar
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (nostalgistRef.current) {
                try {
                    nostalgistRef.current.exit();
                } catch (e) {}
                nostalgistRef.current = null;
            }
        };
    }, []);

    // Sincronização e Leitura de Save periódica
    const syncSramWithDex = useCallback(async () => {
        if (!nostalgistRef.current) return;
        try {
            const { sram } = await nostalgistRef.current.saveSram();
            if (!sram) return;

            const buffer = await sram.arrayBuffer();
            if (buffer.byteLength >= 65536) {
                await db.saveSram(gameCode, new Uint8Array(buffer));
                const parsed = parseGen3Save(buffer, gameCode);
                onSaveAutoParsed(parsed);
                setStatusMessage(`Save de "${parsed.trainerName}" sincronizado! (${parsed.allCaughtDexIds.length} capturados)`);
                setTimeout(() => setStatusMessage(null), 3000);
            }
        } catch (e) {
            console.warn('[Auto-Parser Sync Warning]', e);
        }
    }, [gameCode, onSaveAutoParsed]);

    // Iniciar Nostalgist com os botões WASD + E (A) + Shift (B)
    const launchNostalgistWithRom = async (romData: ArrayBuffer, title: string, code: string) => {
        try {
            setIsLoadingCore(true);
            setStatusMessage(`Iniciando motor GBA (mGBA WebAssembly)...`);

            if (nostalgistRef.current) {
                try {
                    nostalgistRef.current.exit();
                } catch (e) {}
                nostalgistRef.current = null;
            }

            if (intervalRef.current) clearInterval(intervalRef.current);

            // Carregar save anterior do IndexedDB se existir
            const existingSave = await db.getSram(code);
            const initialSram = existingSave?.sramData ? new Blob([existingSave.sramData as any]) : undefined;

            const romBlob = new Blob([romData]);

            const instance = await Nostalgist.launch({
                core: 'mgba',
                rom: romBlob,
                element: canvasRef.current || undefined,
                initialSram: initialSram,
                retroarchConfig: {
                    // Configuração solicitada: WASD para Direcionais, E para A, Shift para B
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
                    
                    video_vsync: true,
                    audio_enable: true,
                    fastforward_ratio: 3.0
                }
            });

            nostalgistRef.current = instance;
            setActiveRomTitle(title);
            setIsEmulatorRunning(true);
            setIsLoadingCore(false);
            setStatusMessage(`🎮 "${title}" rodando a 60 FPS com controles WASD + E + Shift!`);
            setTimeout(() => setStatusMessage(null), 4000);

            if (onRomLoaded) onRomLoaded(title, code);

            // Iniciar timer de sincronização a cada 10 segundos
            intervalRef.current = setInterval(syncSramWithDex, 10000);
        } catch (err: any) {
            console.error('Erro ao iniciar emulador:', err);
            setIsLoadingCore(false);
            alert(`Erro ao iniciar motor GBA: ${err.message || err}`);
            setStatusMessage(null);
        }
    };

    // Iniciar ROM a partir do IndexedDB
    const startRomFromDb = async (code: string) => {
        try {
            setStatusMessage('Carregando ROM do armazenamento local...');
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

    // Upload de novo arquivo de ROM (.gba / .zip)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage('Extraindo e verificando ROM...');
            const { header, storedRom } = await processRomUpload(file);
            await launchNostalgistWithRom(storedRom.romData, header.title, header.gameCode);
            db.listRoms().then(list => setStoredRoms(list));
        } catch (err: any) {
            alert(`Erro ao carregar ROM: ${err.message}`);
            setStatusMessage(null);
        }
    };

    // Ações do Emulador
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

    const handleScreenshot = async () => {
        if (!nostalgistRef.current) return;
        try {
            const { screenshot } = await nostalgistRef.current.screenshot();
            const a = document.createElement('a');
            a.href = screenshot;
            a.download = `${activeRomTitle || 'game'}_screenshot.png`;
            a.click();
        } catch (e) {}
    };

    const handleExportSave = async () => {
        if (!nostalgistRef.current) return;
        try {
            const { sram } = await nostalgistRef.current.saveSram();
            const url = URL.createObjectURL(sram);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${gameCode || 'pokemon'}.sav`;
            a.click();
            URL.revokeObjectURL(url);
            setStatusMessage('Save (.sav) exportado com sucesso!');
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (e: any) {
            alert(`Erro ao exportar save: ${e.message}`);
        }
    };

    const handleFullscreen = () => {
        if (canvasRef.current && canvasRef.current.requestFullscreen) {
            canvasRef.current.requestFullscreen();
        }
    };

    // Enviar toque de botão virtual
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
                        <p className="text-xs text-gray-400 font-mono">
                            {isEmulatorRunning ? '🟢 mGBA WebAssembly • 60 FPS' : '⚪ Aguardando Seleção de ROM'}
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
                                onClick={syncSramWithDex}
                                className="p-2 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 transition-all"
                                title="Forçar Sincronização do Save com a Dex"
                            >
                                <Save size={16} />
                            </button>
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

            {/* Container da Tela do Jogo */}
            <div className="relative w-full aspect-[3/2] max-w-[720px] bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl flex items-center justify-center">
                
                {/* Canvas onde o Nostalgist renderiza o jogo nativamente */}
                <canvas
                    ref={canvasRef}
                    className={`w-full h-full object-contain image-pixelated ${!isEmulatorRunning ? 'hidden' : 'block'}`}
                />

                {/* Tela de Espera / Placeholder */}
                {!isEmulatorRunning && (
                    <div className="flex flex-col items-center justify-center gap-5 p-8 text-center">
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
                                        Clique no botão acima ou selecione seu arquivo <code>.gba</code> ou <code>.zip</code> para iniciar a emulação.
                                    </p>
                                </div>

                                {/* ROMs salvas no navegador */}
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

            {/* Mapeamento de Controles Atualizado */}
            <div className="w-full max-w-[720px] bg-gray-900/60 border border-white/10 p-4 rounded-2xl flex flex-wrap items-center justify-between text-xs text-gray-400 gap-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-bold text-gray-200">⌨️ Teclado:</span>
                    <span><strong className="text-red-400">W, A, S, D</strong> = Direcionais</span>
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

            {/* Gamepad Virtual Touch para Mobile */}
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
