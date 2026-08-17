import { CaughtPokemonData } from './pokemon';

export interface RouteEncounter {
    pokemon_id?: number;
    status: 'caught' | 'fainted' | 'failed' | 'skipped';
    level?: number;
    notes?: string;
}

export interface RunData {
    id: number | string;
    trainer: string;
    trainer_id?: number;
    secret_id?: number;
    game: string;
    game_code?: string;
    nuzlocke: boolean;
    living_dex: number[];
    caught_details?: Record<number, CaughtPokemonData>;
    team: number[];
    graveyard: number[];
    routes: Record<string, RouteEncounter>;
    total_caught: number;
    play_time?: {
        hours: number;
        minutes: number;
        seconds: number;
        formatted: string;
    };
    created_at?: string;
    updated_at?: string;
}

export interface GlobalAppState {
    activeRunId: number | string;
    runs: RunData[];
    activeGameCode?: string;
}
