import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Gamepad2, X, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, theme }) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trainerName, setTrainerName] = useState('Waifu Dex Master');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, trainerName);
        alert('Conta criada com sucesso! Você já pode navegar e salvar suas runs.');
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Erro de autenticação. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`${theme.modalBg} border ${theme.borderColor} w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative`}>
        <div className={`p-6 border-b ${theme.borderColor} ${theme.bgSoft} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`${theme.primary} p-2 rounded.xl text-white shadow-lg`}>
              <Gamepad2 size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-black ${theme.bodyText}`}>
                {isSignUp ? 'Criar Conta no Supabase' : 'Entrar no Moedex'}
              </h2>
              <p className={`${theme.mutedText} text-xs`}>
                {isSignUp ? 'Sincronize suas runs na nuvem' : 'Acesse suas runs de qualquer lugar'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`${theme.mutedText} hover:${theme.bodyText}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className={`block text-xs font-bold uppercase mb-1 ${theme.mutedText}`}>
                Nome de Treinador(a)
              </label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                required
                className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2.5 rounded-xl border ${theme.borderColor} text-sm outline-none ${theme.focusRing} focus:ring-1`}
              />
            </div>
          )}

          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${theme.mutedText}`}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2.5 rounded-xl border ${theme.borderColor} text-sm outline-none ${theme.focusRing} focus:ring-1`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${theme.mutedText}`}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2.5 rounded-xl border ${theme.borderColor} text-sm outline-none ${theme.focusRing} focus:ring-1`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${theme.primary} ${theme.hover} flex items-center justify-center gap-2`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus size={18} /> Cadastrar Conta
              </>
            ) : (
              <>
                <LogIn size={18} /> Entrar
              </>
            )}
          </button>

          <div className={`border-t ${theme.borderColor} pt-4 text-center`}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className={`text-xs font-bold ${theme.text} hover:underline`}
            >
              {isSignUp
                ? 'Já tem uma conta? Faça login aqui'
                : 'Não tem conta? Crie uma agora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
