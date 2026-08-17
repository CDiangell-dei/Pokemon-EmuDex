import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Upload, Sparkles, Gamepad2, Save, Download, Maximize2 } from 'lucide-react';
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
    const [activeRomTitle, setActiveRomTitle] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [storedRoms, setStoredRoms] = useState<any[]>([]);
    const [pendingRomBuffer, setPendingRomBuffer] = useState<{ buffer: ArrayBuffer; title: string; code: string } | null>(null);

    useEffect(() => {
        db.listRoms().then(list => {
            setStoredRoms(list);
            if (autoStartCode) {
                const found = list.find(r => r.gameCode === autoStartCode);
                if (found) startRomFromDb(autoStartCode);
            }
        });
    }, [autoStartCode]);

    // Enviar a ROM para o iframe assim que ele estiver pronto
    const sendRomToIframe = useCallback(async (romBuffer: ArrayBuffer, title: string, code: string) => {
        if (!iframeRef.current || !iframeRef.current.contentWindow) return;

        const existingSave = await db.getSram(code);

        iframeRef.current.contentWindow.postMessage({
            type: 'START_ROM',
            romBuffer: romBuffer,
            sramBuffer: existingSave?.sramData ? existingSave.sramData.buffer : null
        }, '*');

        setActiveRomTitle(title);
        setIsEmulatorRunning(true);
        setStatusMessage(`🎮 "${title}" iniciado com sucesso!`);
        setTimeout(() => setStatusMessage(null), 4000);

        if (onRomLoaded) onRomLoaded(title, code);
    }, [onRomLoaded]);

    // Listener de mensagens do iframe (Auto-save e sincronização da Living Dex)
    useEffect(() => {
        const handleIframeMessage = async (event: MessageEvent) => {
            if (!event.data) return;

            if (event.data.type === 'IFRAME_MOUNTED' && pendingRomBuffer) {
                await sendRomToIframe(pendingRomBuffer.buffer, pendingRomBuffer.title, pendingRomBuffer.code);
                setPendingRomBuffer(null);
            }

            if (event.data.type === 'SRAM_UPDATED' && event.data.sram) {
                try {
                    const rawSram = event.data.sram;
                    const buffer = rawSram instanceof ArrayBuffer ? rawSram : rawSram.buffer || new Uint8Array(rawSram).buffer;

                    if (buffer.byteLength >= 65536) {
                        const sramBytes = new Uint8Array(buffer);
                        await db.saveSram(gameCode, sramBytes);

                        if (currentUser && !currentUser.isGuest) {
                            syncSaveFileWithCloud(gameCode, { gameCode, sramData: sramBytes, updatedAt: Date.now() }, currentUser.id);
                        }

                        const parsed = parseGen3Save(buffer, gameCode);
                        onSaveAutoParsed(parsed);
                        setStatusMessage(`💾 Save sincronizado com a Living Dex! (${parsed.allCaughtDexIds.length} Pokémon)`);
                        setTimeout(() => setStatusMessage(null), 3000);
                    }
                } catch (e) {
                    console.warn('[Auto-Parser Iframe Warning]', e);
                }
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, [pendingRomBuffer, sendRomToIframe, gameCode, currentUser, onSaveAutoParsed]);

    const startRomFromDb = async (code: string) => {
        try {
            setStatusMessage('Carregando ROM do armazenamento...');
            const stored = await db.getRom(code);
            if (!stored || !stored.romData) {
                alert('ROM não encontrada.');
                return;
            }

            setPendingRomBuffer({
                buffer: stored.romData,
                title: stored.title,
                code: stored.gameCode
            });
            setIsEmulatorRunning(true);
        } catch (e: any) {
            alert(`Erro: ${e.message}`);
            setStatusMessage(null);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setStatusMessage('Processando e extraindo ROM...');
            const { header, storedRom } = await processRomUpload(file);
            
            setPendingRomBuffer({
                buffer: storedRom.romData,
                title: header.title,
                code: header.gameCode
            });
            setIsEmulatorRunning(true);
            db.listRoms().then(list => setStoredRoms(list));
        } catch (err: any) {
            alert(`Erro ao carregar ROM: ${err.message}`);
            setStatusMessage(null);
        }
    };

    const handleFullscreen = () => {
        if (iframeRef.current) {
            if (iframeRef.current.requestFullscreen) {
                iframeRef.current.requestFullscreen();
            }
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

            {/* Container do Emulador (Iframe Isolado de Alta Performance) */}
            <div className="relative w-full aspect-[3/2] max-w-[720px] bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl flex items-center justify-center">
                {isEmulatorRunning ? (
                    <iframe
                        ref={iframeRef}
                        src="./emulator.html"
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
                                Clique no botão para selecionar seu arquivo <code>.gba</code> ou <code>.zip</code>.
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
                <span className="font-bold text-green-400 ml-auto">Salve no jogo para atualizar a Living Dex!</span>
            </div>

        </div>
    );
};
