import React from 'react';
import { Gamepad2, BookOpen, Sparkles, HardDrive, Play, ArrowRight, Save } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface WelcomeHubProps {
    onSelectMode: (mode: 'emulator' | 'tracker' | 'split') => void;
    onOpenSaveManager: () => void;
    theme: ThemeConfig;
    loadedRoms: Array<{ gameCode: string; title: string }>;
    onStartStoredRom: (code: string) => void;
    currentRunTitle: string;
    totalCaught: number;
}

export const WelcomeHub: React.FC<WelcomeHubProps> = ({
    onSelectMode,
    onOpenSaveManager,
    theme,
    loadedRoms,
    onStartStoredRom,
    currentRunTitle,
    totalCaught
}) => {
    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-8 animate-fade-in text-center">
                
                {/* Badge e Título */}
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={14} /> MoeDex GBA Cloud
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-100">
                        O que você deseja fazer agora?
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
                        Escolha uma das opções abaixo para iniciar sua jornada:
                    </p>
                </div>

                {/* Duas Opções Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                    
                    {/* Opção 1: Ir Direto para o Emulador */}
                    <div
                        onClick={() => onSelectMode('emulator')}
                        className="group relative p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-red-950/40 border border-white/10 hover:border-red-500/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl hover:shadow-red-600/10"
                    >
                        <div className="p-4 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 w-fit mb-6 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-lg">
                            <Gamepad2 size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-100 mb-2 group-hover:text-red-400 transition-colors">
                            Jogar no Emulador GBA
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">
                            Abra sua ROM e jogue direto no navegador com áudio, controles e sincronização automática da sua Living Dex.
                        </p>
                        <div className="flex items-center text-sm font-bold text-red-400 gap-2 group-hover:translate-x-1 transition-transform">
                            <span>Abrir Emulador</span>
                            <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* Opção 2: Ver Pokédex por Save */}
                    <div
                        onClick={() => onSelectMode('tracker')}
                        className="group relative p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-blue-950/40 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl hover:shadow-blue-600/10"
                    >
                        <div className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-lg">
                            <BookOpen size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-100 mb-2 group-hover:text-blue-400 transition-colors">
                            Ver Pokédex por Save
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">
                            Analise seus Pokémon capturados, equipe, IVs/EVs reais, caixas do PC e progresso de Living Dex do seu arquivo <code>.sav</code>.
                        </p>
                        <div className="flex items-center text-sm font-bold text-blue-400 gap-2 group-hover:translate-x-1 transition-transform">
                            <span>Explorar Pokédex</span>
                            <ArrowRight size={16} />
                        </div>
                    </div>

                </div>

                {/* Se houver ROMs salvas no IndexedDB, mostrar atalho rápido */}
                {loadedRoms.length > 0 && (
                    <div className="pt-2 max-w-xl mx-auto space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Continuar Jogo Salvo:</p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {loadedRoms.map(r => (
                                <button
                                    key={r.gameCode}
                                    onClick={() => onStartStoredRom(r.gameCode)}
                                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-white/10 rounded-2xl text-xs font-bold flex items-center gap-2 text-gray-200 transition-all hover:border-red-500/40 shadow"
                                >
                                    <Play size={14} className="text-red-500" />
                                    <span>{r.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rodapé de Ações */}
                <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
                    <button
                        onClick={onOpenSaveManager}
                        className="px-4 py-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/10 flex items-center gap-2 transition-all hover:text-white"
                    >
                        <Save size={14} className="text-red-400" />
                        <span>Carregar Arquivo .sav / ROM</span>
                    </button>
                    <button
                        onClick={() => onSelectMode('split')}
                        className="px-4 py-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/10 flex items-center gap-2 transition-all hover:text-white"
                    >
                        <Sparkles size={14} className="text-purple-400" />
                        <span>Modo Tela Dividida (Jogo + Dex)</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
