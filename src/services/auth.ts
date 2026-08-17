/**
 * MoeDex GBA Cloud - Authentication & Profile Service
 * Conectado ao Supabase Auth
 */

import { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export interface UserProfile {
    id: string;
    email?: string;
    displayName: string;
    isGuest: boolean;
    avatarUrl?: string;
}

const GUEST_STORAGE_KEY = 'moedex_guest_profile';

export async function getCurrentUser(): Promise<UserProfile | null> {
    try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            return {
                id: user.id,
                email: user.email,
                displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Treinador',
                isGuest: false
            };
        }

        const guestJson = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestJson) {
            return JSON.parse(guestJson);
        }

        return null;
    } catch (e) {
        console.warn('Erro ao obter usuário:', e);
        return null;
    }
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<{ user: User | null; error: string | null }> {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName
                }
            }
        });

        if (error) return { user: null, error: error.message };
        return { user: data.user, error: null };
    } catch (e: any) {
        return { user: null, error: e.message || 'Erro ao cadastrar' };
    }
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) return { user: null, error: error.message };
        return { user: data.user, error: null };
    } catch (e: any) {
        return { user: null, error: e.message || 'Erro ao entrar' };
    }
}

export async function signOutUser(): Promise<void> {
    try {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (e) {
        console.warn('Erro ao sair:', e);
    }
}

export function createGuestProfile(nickname: string): UserProfile {
    const profile: UserProfile = {
        id: 'guest_' + Math.random().toString(36).substring(2, 9),
        displayName: nickname.trim() || 'Treinador Local',
        isGuest: true
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
    return profile;
}
