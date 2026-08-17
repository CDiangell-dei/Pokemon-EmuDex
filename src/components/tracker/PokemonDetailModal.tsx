import React from 'react';
import { X, Sparkles, Skull, Check, Users, Zap } from 'lucide-react';
import { BasicPokemon, PokemonApiDetails, CaughtPokemonData } from '../../types/pokemon';
import { ThemeConfig } from '../../types/theme';

interface PokemonDetailModalProps {
    pokemon: BasicPokemon;
    details?: PokemonApiDetails | null;
    caughtData?: CaughtPokemonData | null;
    isCaught: boolean;
    isDead: boolean;
    isInTeam: boolean;
    localSpriteUrl?: string | null;
    localShinyUrl?: string | null;
    spriteStyle: 'moemon' | 'classic';
    theme: ThemeConfig;
    onToggleCaught: () => void;
    onToggleDead: () => void;
    onToggleTeam: () => void;
    onClose: () => void;
}

export const PokemonDetailModal: React.FC<PokemonDetailModalProps> = ({
    pokemon,
    details,
    caughtData,
    isCaught,
    isDead,
    isInTeam,
    localSpriteUrl,
    localShinyUrl,
    spriteStyle,
    theme,
    onToggleCaught,
    onToggleDead,
    onToggleTeam,
    onClose
}) => {
    const isShiny = caughtData?.is_shiny || false;

    let displaySprite = '';
    if (spriteStyle === 'moemon' && localSpriteUrl) {
        displaySprite = isShiny && localShinyUrl ? localShinyUrl : localSpriteUrl;
    } else {
        displaySprite = isShiny
            ? (details?.sprites.front_shiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`)
            : (details?.sprites.official_artwork || details?.sprites.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`);
    }

    const ivs = caughtData?.ivs;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-gray-100">
                
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gray-950/60">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-gray-400">#{String(pokemon.id).padStart(4, '0')}</span>
                        <h2 className="text-xl font-black capitalize">{caughtData?.nickname || pokemon.name.replace(/-/g, ' ')}</h2>
                        {isShiny && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold rounded-lg flex items-center gap-1"><Sparkles size={12} /> Shiny</span>}
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    
                    {/* Top Hero Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-gray-950 to-gray-900 border border-white/5">
                        <div className="relative w-32 h-32 flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 p-2">
                            <img src={displaySprite} alt={pokemon.name} className="w-full h-full object-contain image-pixelated" />
                        </div>
                        <div className="space-y-3 flex-1 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                {(details?.types || []).map(t => (
                                    <span key={t} className="text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-800 border border-white/10 text-gray-200">
                                        {t}
                                    </span>
                                ))}
                                {caughtData?.nature && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
                                        Nature: {caughtData.nature}
                                    </span>
                                )}
                                {caughtData?.level && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400">
                                        Lv. {caughtData.level}
                                    </span>
                                )}
                            </div>

                            {/* HP Bar */}
                            {caughtData?.max_hp !== undefined && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-400">HP em Batalha:</span>
                                        <span className={caughtData.current_hp === 0 ? 'text-red-500' : 'text-green-400'}>
                                            {caughtData.current_hp} / {caughtData.max_hp}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${caughtData.current_hp === 0 ? 'bg-red-600' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(100, ((caughtData.current_hp || 0) / caughtData.max_hp) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* IVs Reais do Save */}
                    {ivs ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-400" />
                                    <span>Valores Individuais Reais (IVs do Save: {ivs.percent}%)</span>
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { label: 'HP', val: ivs.hp, max: 31, color: 'bg-red-500' },
                                    { label: 'Ataque', val: ivs.attack, max: 31, color: 'bg-orange-500' },
                                    { label: 'Defesa', val: ivs.defense, max: 31, color: 'bg-yellow-500' },
                                    { label: 'Sp. Atk', val: ivs.spAttack, max: 31, color: 'bg-blue-500' },
                                    { label: 'Sp. Def', val: ivs.spDefense, max: 31, color: 'bg-green-500' },
                                    { label: 'Velocidade', val: ivs.speed, max: 31, color: 'bg-pink-500' }
                                ].map((stat) => (
                                    <div key={stat.label} className="p-3 bg-gray-950/60 border border-white/5 rounded-xl space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-400">{stat.label}</span>
                                            <span className="text-gray-100">{stat.val} / {stat.max}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${stat.color}`} style={{ width: `${(stat.val / stat.max) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-950/40 border border-white/5 rounded-2xl text-center text-xs text-gray-500">
                            Carregue um arquivo .sav pelo Hub GBA para visualizar os IVs (0-31), EVs, Golpes e HP exatos deste Pokémon.
                        </div>
                    )}

                    {/* Ações de Controle */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <button
                            onClick={onToggleCaught}
                            className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                isCaught ? 'bg-green-600/20 border border-green-500 text-green-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                            }`}
                        >
                            <Check size={16} />
                            <span>{isCaught ? 'Capturado' : 'Marcar Capturado'}</span>
                        </button>

                        <button
                            onClick={onToggleTeam}
                            className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                isInTeam ? 'bg-blue-600/20 border border-blue-500 text-blue-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                            }`}
                        >
                            <Users size={16} />
                            <span>{isInTeam ? 'Na Equipe' : 'Colocar na Equipe'}</span>
                        </button>

                        <button
                            onClick={onToggleDead}
                            className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                isDead ? 'bg-red-600 text-white' : 'bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 text-red-400'
                            }`}
                        >
                            <Skull size={16} />
                            <span>{isDead ? 'Morto (Graveyard)' : 'Mover pro Cemitério'}</span>
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};
