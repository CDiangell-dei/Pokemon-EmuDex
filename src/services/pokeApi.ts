/**
 * MoeDex GBA Cloud - PokeAPI Service
 */

import { BasicPokemon, PokemonApiDetails } from '../types/pokemon';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const MASTER_LIST_KEY = 'moedex_master_list_cache';

export async function fetchMasterPokemonList(): Promise<BasicPokemon[]> {
    try {
        const cached = localStorage.getItem(MASTER_LIST_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }

        const res = await fetch(`${POKEAPI_BASE}/pokemon?limit=10000`);
        const data = await res.json();
        const cleanList: BasicPokemon[] = data.results.map((p: any) => {
            const parts = p.url.split('/').filter(Boolean);
            const id = parseInt(parts[parts.length - 1], 10);
            return {
                id,
                name: p.name,
                url: p.url
            };
        });

        localStorage.setItem(MASTER_LIST_KEY, JSON.stringify(cleanList));
        return cleanList;
    } catch (e) {
        console.error('Erro ao carregar lista de Pokémon:', e);
        return [];
    }
}

export async function fetchPokemonDetails(idOrName: number | string): Promise<PokemonApiDetails | null> {
    try {
        const cacheKey = `moedex_pokedetail_${idOrName}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);

        const res = await fetch(`${POKEAPI_BASE}/pokemon/${idOrName}`);
        if (!res.ok) return null;
        const data = await res.json();

        const details: PokemonApiDetails = {
            id: data.id,
            name: data.name,
            types: data.types.map((t: any) => t.type.name),
            sprites: {
                front_default: data.sprites.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
                front_shiny: data.sprites.front_shiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${data.id}.png`,
                official_artwork: data.sprites.other?.['official-artwork']?.front_default,
                showdown: data.sprites.other?.showdown?.front_default
            },
            stats: {
                hp: data.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0,
                attack: data.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0,
                defense: data.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0,
                special_attack: data.stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat || 0,
                special_defense: data.stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat || 0,
                speed: data.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0,
                total: data.stats.reduce((acc: number, cur: any) => acc + cur.base_stat, 0)
            },
            height: data.height / 10,
            weight: data.weight / 10,
            abilities: data.abilities.map((a: any) => a.ability.name)
        };

        sessionStorage.setItem(cacheKey, JSON.stringify(details));
        return details;
    } catch (e) {
        return null;
    }
}
