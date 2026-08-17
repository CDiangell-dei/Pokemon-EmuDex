import React from 'react';
import { Users } from 'lucide-react';
import { BasicPokemon, CaughtPokemonData } from '../../types/pokemon';
import { ThemeConfig } from '../../types/theme';

interface TeamSidebarProps {
    teamIds: number[];
    caughtDetails: Record<number, CaughtPokemonData>;
    allPokemon: BasicPokemon[];
    localFolderMap: Record<number, string>;
    localShinyMap: Record<number, string>;
    spriteStyle: 'moemon' | 'classic';
    theme: ThemeConfig;
    onRemoveFromTeam: (id: number) => void;
    onSelectPokemon: (id: number) => void;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({
    teamIds,
    caughtDetails,
    allPokemon,
    localFolderMap,
    localShinyMap,
    spriteStyle,
    theme,
    onRemoveFromTeam,
    onSelectPokemon
}) => {
    if (!teamIds || teamIds.length === 0) return null;

    const pokemonMap = new Map(allPokemon.map(p => [p.id, p]));

    return (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-2xl space-y-3 animate-fade-in text-gray-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-red-400" />
                    <span className="font-black text-xs uppercase tracking-wider">Equipe Ativa ({teamIds.length}/6)</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">GBA Party</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
                {teamIds.map(id => {
                    const mon = pokemonMap.get(id);
                    const details = caughtDetails[id];
                    const isShiny = details?.is_shiny || false;

                    let sprite = '';
                    if (spriteStyle === 'moemon' && localFolderMap[id]) {
                        sprite = isShiny && localShinyMap[id] ? localShinyMap[id] : localFolderMap[id];
                    } else {
                        sprite = isShiny
                            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
                            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                    }

                    return (
                        <div
                            key={id}
                            onClick={() => onSelectPokemon(id)}
                            className="group relative aspect-square bg-gray-950/60 rounded-xl border border-white/5 hover:border-red-500/40 p-1 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                            title={details?.nickname || mon?.name || `Pokémon #${id}`}
                        >
                            <img src={sprite} alt="" className="w-full h-full object-contain image-pixelated" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveFromTeam(id);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
