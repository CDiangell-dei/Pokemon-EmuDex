import React, { useState } from 'react';
import { User, Lock, Mail, Sparkles, X, LogIn, UserPlus, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, createGuestProfile, signOutUser, UserProfile } from '../../services/auth';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserProfile | null;
    onUserChanged: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    onUserChanged
}) => {
    const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMsg(null);

        const { user, error } = await signInWithEmail(email, password);
        setIsLoading(false);

        if (error) {
            setStatusMsg({ type: 'error', text: error });
        } else if (user) {
            const profile: UserProfile = {
                id: user.id,
                email: user.email,
                displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Treinador',
                isGuest: false
            };
            onUserChanged(profile);
            setStatusMsg({ type: 'success', text: `Bem-vindo de volta, ${profile.displayName}!` });
            setTimeout(() => {
                onClose();
            }, 1000);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMsg(null);

        const { user, error } = await signUpWithEmail(email, password, displayName);
        setIsLoading(false);

        if (error) {
            setStatusMsg({ type: 'error', text: error });
        } else if (user) {
            const profile: UserProfile = {
                id: user.id,
                email: user.email,
                displayName: displayName || user.email?.split('@')[0] || 'Treinador',
                isGuest: false
            };
            onUserChanged(profile);
            setStatusMsg({ type: 'success', text: 'Conta criada com sucesso! Sincronização em nuvem ativa.' });
            setTimeout(() => {
                onClose();
            }, 1200);
        }
    };

    const handleGuest = (e: React.FormEvent) => {
        e.preventDefault();
        const profile = createGuestProfile(displayName || 'Treinador Local');
        onUserChanged(profile);
        setStatusMsg({ type: 'success', text: `Perfil local "${profile.displayName}" ativado!` });
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const handleLogout = async () => {
        await signOutUser();
        onUserChanged(null);
        setStatusMsg({ type: 'success', text: 'Você saiu da sua conta.' });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-gray-100">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
                            <User size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-base">Conta & Nuvem MoeDex</h3>
                            <p className="text-xs text-gray-400">Sincronize seus saves e Pokédex entre PC e celular</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                {/* Status Message */}
                {statusMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        statusMsg.type === 'error' ? 'bg-red-600/20 border border-red-500/30 text-red-400' : 'bg-green-600/20 border border-green-500/30 text-green-400'
                    }`}>
                        {statusMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                        <span>{statusMsg.text}</span>
                    </div>
                )}

                {/* Usuário já conectado */}
                {currentUser ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-950/60 border border-white/5 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Nome:</span>
                                <span className="text-sm font-black text-red-400">{currentUser.displayName}</span>
                            </div>
                            {currentUser.email && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Email:</span>
                                    <span className="text-xs font-mono text-gray-300">{currentUser.email}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Status da Nuvem:</span>
                                <span className="px-2 py-0.5 bg-green-950 text-green-400 border border-green-800 text-[10px] font-bold rounded-md">
                                    {currentUser.isGuest ? 'Local (Convidado)' : '🟢 Conectado (Supabase)'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full py-3 bg-gray-800 hover:bg-red-600 text-gray-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <LogOut size={16} />
                            <span>Sair da Conta</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        
                        {/* Seletor de Modo */}
                        <div className="flex border border-white/10 p-1 bg-gray-950 rounded-2xl text-xs font-bold">
                            <button
                                onClick={() => setMode('login')}
                                className={`flex-1 py-2 rounded-xl transition-all ${mode === 'login' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => setMode('register')}
                                className={`flex-1 py-2 rounded-xl transition-all ${mode === 'register' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Criar Conta
                            </button>
                            <button
                                onClick={() => setMode('guest')}
                                className={`flex-1 py-2 rounded-xl transition-all ${mode === 'guest' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Convidado
                            </button>
                        </div>

                        {/* Formulário de Login */}
                        {mode === 'login' && (
                            <form onSubmit={handleLogin} className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seuemail@exemplo.com"
                                            className="w-full pl-10 pr-3 py-2 bg-gray-950 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Senha</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-3 py-2 bg-gray-950 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
                                >
                                    <LogIn size={16} />
                                    <span>{isLoading ? 'Entrando...' : 'Entrar com Email'}</span>
                                </button>
                            </form>
                        )}

                        {/* Formulário de Registro */}
                        {mode === 'register' && (
                            <form onSubmit={handleRegister} className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Seu Nome / Apelido de Treinador</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Ex: Diangell, Red, May"
                                            className="w-full pl-10 pr-3 py-2 bg-gray-950 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seuemail@exemplo.com"
                                            className="w-full pl-10 pr-3 py-2 bg-gray-950 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Senha (Mínimo 6 caracteres)</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-3 py-2 bg-gray-950 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
                                >
                                    <UserPlus size={16} />
                                    <span>{isLoading ? 'Criando Conta...' : 'Cadastrar e Ativar Nuvem'}</span>
                                </button>
                            </form>
                        )}

                        {/* Modo Convidado */}
                        {mode === 'guest' && (
                            <form onSubmit={handleGuest} className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Nome do Treinador Local</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Ex: Treinador"
                                            className="w-full pl-10 pr-3 py-2 bg-gray-950 border border-white/10 rounded-xl text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    No modo convidado, seus dados e saves ficam guardados apenas no seu navegador atual (IndexedDB). Você pode criar uma conta depois para sincronizar na nuvem.
                                </p>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-xs transition-all"
                                >
                                    Continuar como Convidado
                                </button>
                            </form>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
};
