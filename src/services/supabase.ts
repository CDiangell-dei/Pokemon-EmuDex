/**
 * MoeDex GBA Cloud - Supabase BaaS Layer
 * Conectado ao projeto MoeDex-GBA-Cloud (ratouvlodvjujpqaafet)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db, StoredSave } from './db';

export const SUPABASE_CONFIG = {
    URL: 'https://ratouvlodvjujpqaafet.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdG91dmxvZHZqdWpwcWFhZmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Mjc1MjIsImV4cCI6MjEwMjUwMzUyMn0.dDd8YxaLbQBXQmJY7_FDsCxHh5rRDqx077rElOkptjc'
};

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!supabaseClient) {
        const url = localStorage.getItem('moedex_supabase_url') || SUPABASE_CONFIG.URL;
        const key = localStorage.getItem('moedex_supabase_anon_key') || SUPABASE_CONFIG.ANON_KEY;
        supabaseClient = createClient(url, key);
    }
    return supabaseClient;
}

export function configureSupabase(url: string, key: string): boolean {
    try {
        localStorage.setItem('moedex_supabase_url', url);
        localStorage.setItem('moedex_supabase_anon_key', key);
        supabaseClient = createClient(url, key);
        return true;
    } catch (e) {
        console.error('Erro ao configurar Supabase:', e);
        return false;
    }
}

export async function syncRunToDatabase(runData: any): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = getSupabase();
        const payload = {
            id: String(runData.id),
            trainer_name: runData.trainer || 'Treinador',
            trainer_id: runData.trainer_id || 0,
            secret_id: runData.secret_id || 0,
            game_code: runData.game_code || 'BPEE',
            game_title: runData.game || 'POKEMON EMER',
            is_nuzlocke: Boolean(runData.nuzlocke),
            living_dex: runData.living_dex || [],
            team: runData.team || [],
            graveyard: runData.graveyard || [],
            routes: runData.routes || {},
            play_time: runData.play_time || {},
            total_caught: (runData.living_dex || []).length,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('runs').upsert(payload);
        if (error) throw error;

        return { success: true, message: 'Run sincronizada com o Supabase!' };
    } catch (err: any) {
        console.warn('[Supabase Sync Error]', err);
        return { success: false, message: `Erro ao sincronizar run: ${err.message}` };
    }
}

export async function syncSaveFileWithCloud(gameCode: string, localSave: StoredSave): Promise<{ status: string; message: string }> {
    const supabase = getSupabase();
    try {
        const fileName = `${gameCode}.sav`;
        const bucket = 'saves';

        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, localSave.sramData, {
            upsert: true,
            contentType: 'application/octet-stream'
        });

        if (uploadError) throw uploadError;
        return { status: 'synced_push', message: 'Save enviado para a nuvem com sucesso!' };
    } catch (err: any) {
        console.error('Erro na sincronização de save:', err);
        return { status: 'error', message: `Erro: ${err.message || err}` };
    }
}
