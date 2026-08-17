import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Upload, Sparkles, Gamepad2, Maximize2, RotateCcw } from 'lucide-react';
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
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const [isEmulatorRunning, setIsEmulatorRunning] = useState(false);
    const [runningGameCode, setRunningGameCode] = useState<string | null>(autoStartCode || null);
    const [activeRomTitle, setActiveRomTitle] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [storedRoms, setStoredRoms] = useState<any[]>([]);
    const [srcDocHtml, setSrcDocHtml] = useState<string | null>(null);

    useEffect(() => {
        db.listRoms().then(list => {
            setStoredRoms(list);
            if (autoStartCode) {
                const found = list.find(r => r.gameCode === autoStartCode);
                if (found) startRomFromDb(autoStartCode);
            }
        });
    }, [autoStartCode]);

    // Listener de mensagens do iframe para salvar SRAM e sincronizar Dex
    useEffect(() => {
        const handleIframeMessage = async (event: MessageEvent) => {
            if (!event.data) return;

            if (event.data.type === 'EJS_SRAM_SAVE' && event.data.sram) {
                try {
                    const rawSramArray = event.data.sram;
                    const sramBytes = new Uint8Array(rawSramArray);
                    const targetCode = runningGameCode || gameCode || 'BPEE';

                    if (sramBytes.byteLength >= 65536) {
                        // Gravar localmente no IndexedDB
                        await db.saveSram(targetCode, sramBytes);

                        // Gravar na nuvem do Supabase
                        if (currentUser && !currentUser.isGuest) {
                            syncSaveFileWithCloud(targetCode, { gameCode: targetCode, sramData: sramBytes, updatedAt: Date.now() }, currentUser.id);
                        }

                        // Descriptografar Pokémon e atualizar Dex
                        const parsed = parseGen3Save(sramBytes.buffer, targetCode);
                        onSaveAutoParsed(parsed);
                        setStatusMessage(`💾 Save de "${parsed.trainerName}" sincronizado com a Living Dex!`);
                        setTimeout(() => setStatusMessage(null), 3500);
                    }
                } catch (e) {
                    console.warn('[Auto-Parser Warning]', e);
                }
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, [runningGameCode, gameCode, currentUser, onSaveAutoParsed]);

    const buildAndLaunchSrcDoc = async (romData: ArrayBuffer, title: string, code: string) => {
        try {
            setStatusMessage(`Iniciando ${title}...`);
            const romBlob = new Blob([romData], { type: 'application/octet-stream' });
            const romUrl = URL.createObjectURL(romBlob);

            // Buscar save anterior
            const existingSave = await db.getSram(code);
            let sramUrl = '';
            if (existingSave?.sramData && existingSave.sramData.byteLength >= 65536) {
                const sramBlob = new Blob([existingSave.sramData], { type: 'application/octet-stream' });
                sramUrl = URL.createObjectURL(sramBlob);
            }

            const doc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { width: 100%; height: 100%; background: #000; overflow: hidden; }
        #game { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="game"></div>
    <script>
        window.EJS_player = '#game';
        window.EJS_core = 'gba';
        window.EJS_gameUrl = '${romUrl}';
        window.EJS_pathtodata = 'https://cdn.jsdelivr.net/gh/EmulatorJS/EmulatorJS@latest/data/';
        window.EJS_startOnLoaded = true;
        window.EJS_color = '#dc2626';
        ${sramUrl ? `window.EJS_loadStateURL = '${sramUrl}';` : ''}

        window.EJS_defaultControls = {
            0: {
                'UP': 'KeyW',
                'DOWN': 'KeyS',
                'LEFT': 'KeyA',
                'RIGHT': 'KeyD',
                'A': 'KeyE',
                'B': 'ShiftLeft',
                'L': 'KeyQ',
                'R': 'KeyR',
                'START': 'Enter',
                'SELECT': 'Space'
            }
        };

        window.EJS_onSave = function(e) {
            if (e && e.data) {
                window.parent.postMessage({
                    type: 'EJS_SRAM_SAVE',
                    sram: Array.from(new Uint8Array(e.data))
                }, '*');
            }
        };

        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/gh/EmulatorJS/EmulatorJS@latest/data/loader.js';
        s.async = true;
        document.body.appendChild(s);
    </script>
</body>
</html>`;

            setSrcDocHtml(doc);
            setRunningGameCode(code);
            setActiveRomTitle(title);
            setIsEmulatorRunning(true);

            if (onRomLoaded) onRomLoaded(title, code);
            setStatusMessage(`🎮 "${title}" carregado!`);
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (err: any) {
            console.error('Erro ao construir player:', err);
            alert(`Erro ao iniciar jogo: ${err.message || err}`);
            setStatusMessage(null);
        }
    };

    const startRomFromDb = async (code: string) => {
        try {
            setStatusMessage('Carregando ROM...');
            const stored = await db.getRom(code);
            if (!stored || !stored.romData) {
                alert('ROM não encontrada no armazenamento local.');
                return;
            }
            await buildAndLaunchSrcDoc(stored.romData, stored.title, stored.gameCode);
        } catch (e: any) {
            alert(`Erro: ${e.message}`);
            setStatusMessage(null);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage('Extraindo e registrando ROM...');
            const { header, storedRom } = await processRomUpload(file);
            await buildAndLaunchSrcDoc(storedRom.romData, header.title, header.gameCode);
            db.listRoms().then(list => setStoredRoms(list));
        } catch (err: any) {
            alert(`Erro ao carregar arquivo de ROM: ${err.message}`);
            setStatusMessage(null);
        }
    };

    const handleFullscreen = () => {
        if (iframeRef.current && iframeRef.current.requestFullscreen) {
            iframeRef.current.requestFullscreen();
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
                            {isEmulatorRunning ? '🟢 Motor GBA Ativo • 60 FPS' : '⚪ Selecione uma ROM para Iniciar'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".gba,.zip"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {isEmulatorRunning && (
                        <button
                            onClick={handleFullscreen}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 transition-all"
                            title="Tela Cheia"
                        >
                            <Maximize2 size={16} />
                        </button>
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

            {/* Container do Emulador */}
            <div className="relative w-full aspect-[3/2] max-w-[720px] bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl flex items-center justify-center">
                {isEmulatorRunning && srcDocHtml ? (
                    <iframe
                        ref={iframeRef}
                        srcDoc={srcDocHtml}
                        className="w-full h-full border-0"
                        allow="autoplay; gamepad; fullscreen"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-5 p-8 text-center">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-6 rounded-3xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 cursor-pointer transition-all duration-300 hover:scale-110 shadow-2xl"
                        >
                            <Play size={48} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-lg text-gray-200">Pronto para Jogar</h4>
                            <p className="text-xs text-gray-400 max-w-md">
                                Clique no botão acima para escolher sua ROM (<code>.gba</code> ou <code>.zip</code>).
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
                <span className="font-bold text-green-400 ml-auto">Ao salvar no jogo, a Living Dex atualiza na hora!</span>
            </div>

        </div>
    );
};
