import React from 'react';
import { Gamepad2, BookOpen, Sparkles, HardDrive, Palette, User, Cloud } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { UserProfile } from '../../services/auth';

interface HeaderProps {
    viewMode: 'welcome' | 'emulator' | 'tracker' | 'split';
    onSetViewMode: (mode: 'welcome' | 'emulator' | 'tracker' | 'split') => void;
    spriteStyle: 'moemon' | 'classic';
    onSetSpriteStyle: (style: 'moemon' | 'classic') => void;
    onOpenGbaModal: () => void;
    onOpenThemeModal: () => void;
    onOpenAuthModal: () => void;
    currentUser: UserProfile | null;
    currentRunTitle: string;
    totalCaught: number;
    theme: ThemeConfig;
}

export const Header: React.FC<HeaderProps> = ({
    viewMode,
    onSetViewMode,
    spriteStyle,
    onSetSpriteStyle,
    onOpenGbaModal,
    onOpenThemeModal,
    onOpenAuthModal,
    currentUser,
    currentRunTitle,
    totalCaught,
    theme
}) => {
    return (
        <header className="sticky top-0 z-40 bg-gray-950/85 backdrop-blur-xl border-b border-white/10 px-4 py-3">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                
                {/* Logo e Título */}
                <div
                    onClick={() => onSetViewMode('welcome')}
                    className="flex items-center gap-3 cursor-pointer group select-none"
                >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                        <Gamepad2 size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-base text-gray-100 tracking-tight">MoeDex</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-600/20 border border-red-500/30 text-red-400">GBA CLOUD</span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono">{currentRunTitle} • {totalCaught} Capturados</p>
                    </div>
                </div>

                {/* Seletor Central de Modo de Visualização */}
                <div className="flex items-center bg-gray-900 border border-white/10 p-1 rounded-2xl text-xs font-bold shadow-inner">
                    <button
                        onClick={() => onSetViewMode('emulator')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                            viewMode === 'emulator' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <Gamepad2 size={14} />
                        <span>Emulador</span>
                    </button>
                    <button
                        onClick={() => onSetViewMode('tracker')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                            viewMode === 'tracker' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <BookOpen size={14} />
                        <span>Pokédex</span>
                    </button>
                    <button
                        onClick={() => onSetViewMode('split')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                            viewMode === 'split' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <Sparkles size={14} />
                        <span className="hidden sm:inline">Dividido</span>
                    </button>
                </div>

                {/* Controles da Direita */}
                <div className="flex items-center gap-2">
                    
                    {/* Botão de Usuário / Login */}
                    <button
                        onClick={onOpenAuthModal}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                            currentUser && !currentUser.isGuest
                                ? 'bg-green-600/20 border-green-500/40 text-green-400 hover:bg-green-600/30'
                                : 'bg-gray-900 hover:bg-gray-800 border-white/10 text-gray-300'
                        }`}
                        title={currentUser ? `Conectado como ${currentUser.displayName}` : 'Entrar na Conta para Salvar na Nuvem'}
                    >
                        <User size={14} className={currentUser && !currentUser.isGuest ? 'text-green-400' : 'text-gray-400'} />
                        <span className="hidden md:inline">{currentUser ? currentUser.displayName : 'Entrar / Conta'}</span>
                    </button>

                    {/* Seletor de Estilo Moemon / Clássico */}
                    <div className="flex items-center bg-gray-900 border border-white/10 p-1 rounded-xl text-xs font-bold">
                        <button
                            onClick={() => onSetSpriteStyle('moemon')}
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                                spriteStyle === 'moemon' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                            }`}
                            title="Visual Moemon (Pixel Art)"
                        >
                            <span>🎀</span>
                            <span className="hidden lg:inline">Moemon</span>
                        </button>
                        <button
                            onClick={() => onSetSpriteStyle('classic')}
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                                spriteStyle === 'classic' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                            }`}
                            title="Visual Pokémon Tradicional (PokeAPI)"
                        >
                            <span>⚡</span>
                            <span className="hidden lg:inline">Clássico</span>
                        </button>
                    </div>

                    {/* Botão GBA & Saves */}
                    <button
                        onClick={onOpenGbaModal}
                        className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2 transition-all"
                        title="Gerenciador de Saves e ROMs"
                    >
                        <HardDrive size={14} />
                        <span className="hidden sm:inline">Saves</span>
                    </button>

                    {/* Botão de Temas */}
                    <button
                        onClick={onOpenThemeModal}
                        className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/10 text-gray-400 hover:text-white transition-all"
                        title="Temas de Cores"
                    >
                        <Palette size={16} />
                    </button>

                </div>

            </div>
        </header>
    );
};
