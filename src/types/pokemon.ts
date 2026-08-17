/**
 * MoeDex GBA Cloud - Tipagens de Pokémon
 */

export interface PokemonIvStats {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    spAttack: number;
    spDefense: number;
    total: number;
    percent: number;
}

export interface PokemonEvStats {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    spAttack: number;
    spDefense: number;
}

export interface PokemonCombatStats {
    attack: number;
    defense: number;
    speed: number;
    spAttack: number;
    spDefense: number;
}

export interface CaughtPokemonData {
    dex_id: number;
    nickname?: string;
    level?: number;
    nature?: string;
    is_shiny?: boolean;
    is_fainted?: boolean;
    gender?: 'male' | 'female' | 'genderless';
    current_hp?: number;
    max_hp?: number;
    moves?: number[];
    held_item?: number;
    ivs?: PokemonIvStats;
    evs?: PokemonEvStats;
    stats?: PokemonCombatStats;
    location?: 'party' | 'box';
    box_number?: number;
    route_met?: string;
    caught_at?: number;
}

export interface BasicPokemon {
    id: number;
    name: string;
    url: string;
}

export interface PokemonApiDetails {
    id: number;
    name: string;
    types: string[];
    sprites: {
        front_default: string;
        front_shiny: string;
        official_artwork?: string;
        showdown?: string;
    };
    stats: {
        hp: number;
        attack: number;
        defense: number;
        special_attack: number;
        special_defense: number;
        speed: number;
        total: number;
    };
    height: number;
    weight: number;
    abilities: string[];
}
