import React, { memo } from 'react';
import { Sparkles, Skull, Check } from 'lucide-react';
import { BasicPokemon, PokemonApiDetails, CaughtPokemonData } from '../../types/pokemon';
import { ThemeConfig } from '../../types/theme';

interface PokemonCardProps {
    pokemon: BasicPokemon;
    details?: PokemonApiDetails | null;
    caughtData?: CaughtPokemonData | null;
    isCaught: boolean;
    isDead: boolean;
    localSpriteUrl?: string | null;
    localShinyUrl?: string | null;
    spriteStyle: 'moemon' | 'classic';
    theme: ThemeConfig;
    onClick: () => void;
}

const TYPE_COLORS: Record<string, string> = {
    normal: 'bg-stone-500 text-stone-100',
    fire: 'bg-orange-600 text-orange-100',
    water: 'bg-blue-600 text-blue-100',
    electric: 'bg-amber-500 text-amber-950',
    grass: 'bg-emerald-600 text-emerald-100',
    ice: 'bg-cyan-500 text-cyan-950',
    fighting: 'bg-rose-700 text-rose-100',
    poison: 'bg-purple-600 text-purple-100',
    ground: 'bg-yellow-700 text-yellow-100',
    flying: 'bg-indigo-400 text-indigo-950',
    psychic: 'bg-pink-600 text-pink-100',
    bug: 'bg-lime-600 text-lime-100',
    rock: 'bg-stone-600 text-stone-100',
    ghost: 'bg-violet-800 text-violet-100',
    dragon: 'bg-indigo-700 text-indigo-100',
    dark: 'bg-stone-900 text-stone-200 border border-stone-700',
    steel: 'bg-slate-500 text-slate-100',
    fairy: 'bg-rose-400 text-rose-950'
};

export const PokemonCard: React.FC<PokemonCardProps> = memo(({
    pokemon,
    details,
    caughtData,
    isCaught,
    isDead,
    localSpriteUrl,
    localShinyUrl,
    spriteStyle,
    theme,
    onClick
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

    const types = details?.types || [];

    return (
        <div
            onClick={onClick}
            className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-3 flex flex-col items-center justify-between text-center select-none ${
                isDead
                    ? 'border-red-900/60 bg-red-950/20 opacity-70 grayscale hover:grayscale-0'
                    : isCaught
                    ? `${theme.borderColor} ${theme.cardBg} shadow-lg hover:shadow-xl hover:scale-[1.03] hover:border-red-500/50`
                    : 'border-white/5 bg-gray-950/40 opacity-50 hover:opacity-100 hover:border-white/20'
            }`}
        >
            {/* Badges de Status no Topo */}
            <div className="w-full flex items-center justify-between text-[10px] font-bold font-mono">
                <span className="text-gray-400">#{String(pokemon.id).padStart(4, '0')}</span>
                <div className="flex items-center gap-1">
                    {isDead && (
                        <span className="p-1 bg-red-600 text-white rounded-md shadow" title="Cemitério Nuzlocke (Morto)">
                            <Skull size={10} />
                        </span>
                    )}
                    {isShiny && (
                        <span className="p-1 bg-yellow-500 text-black rounded-md shadow" title="Shiny">
                            <Sparkles size={10} />
                        </span>
                    )}
                    {isCaught && !isDead && (
                        <span className="p-1 bg-green-600 text-white rounded-md shadow" title="Capturado">
                            <Check size={10} />
                        </span>
                    )}
                </div>
            </div>

            {/* Imagem do Sprite */}
            <div className="relative w-16 h-16 my-2 flex items-center justify-center">
                <img
                    src={displaySprite}
                    alt={pokemon.name}
                    loading="lazy"
                    className={`w-full h-full object-contain image-pixelated transition-transform duration-200 group-hover:scale-110 ${
                        !isCaught ? 'brightness-50 group-hover:brightness-100' : ''
                    }`}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                    }}
                />
            </div>

            {/* Nome e Tipos */}
            <div className="w-full space-y-1.5">
                <p className="text-xs font-bold capitalize truncate text-gray-200">
                    {caughtData?.nickname || pokemon.name.replace(/-/g, ' ')}
                </p>

                {/* Tipos */}
                {types.length > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                        {types.map(t => (
                            <span
                                key={t}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${TYPE_COLORS[t] || 'bg-gray-700 text-gray-200'}`}
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="h-4"></div>
                )}
            </div>
        </div>
    );
});
