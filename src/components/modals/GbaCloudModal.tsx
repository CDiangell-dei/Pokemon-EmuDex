import React, { useRef, useState } from 'react';
import { Gamepad2, X, Upload, Save, HardDrive, Cloud, Sparkles, Loader2 } from 'lucide-react';
import { configureSupabase } from '../../services/supabase';

interface GbaCloudModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadedRoms: any[];
    onUploadRom: (file: File) => void;
    onUploadSave: (file: File) => void;
    statusMessage: string | null;
}

export const GbaCloudModal: React.FC<GbaCloudModalProps> = ({
    isOpen,
    onClose,
    loadedRoms,
    onUploadRom,
    onUploadSave,
    statusMessage
}) => {
    const romInputRef = useRef<HTMLInputElement | null>(null);
    const saveInputRef = useRef<HTMLInputElement | null>(null);
    const [activeTab, setActiveTab] = useState<'saves' | 'roms' | 'cloud'>('saves');
    const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('moedex_supabase_url') || 'https://ratouvlodvjujpqaafet.supabase.co');
    const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('moedex_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdG91dmxvZHZqdWpwcWFhZmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5Mjc1MjIsImV4cCI6MjEwMjUwMzUyMn0.dDd8YxaLbQBXQmJY7_FDsCxHh5rRDqx077rElOkptjc');

    if (!isOpen) return null;

    const handleSaveConfig = () => {
        configureSupabase(supabaseUrl, supabaseKey);
        alert('Configurações do Supabase salvas com sucesso!');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-gray-100">
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gray-950/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
                            <Gamepad2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">GBA Cloud & Saves Hub</h2>
                            <p className="text-xs text-gray-400">BYOR (Bring Your Own ROM) & Auto-Parser de Saves</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                {/* Status Toast */}
                {statusMessage && (
                    <div className="bg-blue-600/20 border-b border-blue-500/30 p-3 text-sm text-blue-300 flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                        <span>{statusMessage}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-gray-950/30 text-sm font-bold">
                    <button
                        onClick={() => setActiveTab('saves')}
                        className={`flex-1 py-3 border-b-2 flex items-center justify-center gap-2 ${activeTab === 'saves' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <Save size={16} /> Auto-Parser (.sav)
                    </button>
                    <button
                        onClick={() => setActiveTab('roms')}
                        className={`flex-1 py-3 border-b-2 flex items-center justify-center gap-2 ${activeTab === 'roms' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <HardDrive size={16} /> ROMs (IndexedDB)
                    </button>
                    <button
                        onClick={() => setActiveTab('cloud')}
                        className={`flex-1 py-3 border-b-2 flex items-center justify-center gap-2 ${activeTab === 'cloud' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        <Cloud size={16} /> Supabase Sync
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    
                    {activeTab === 'saves' && (
                        <div className="space-y-5">
                            <div className="p-4 bg-gradient-to-r from-red-950/40 to-gray-900 border border-red-500/20 rounded-2xl">
                                <h3 className="font-bold text-sm text-red-400 mb-1 flex items-center gap-2">
                                    <Sparkles size={16} /> Sincronização Automática com o Jogo
                                </h3>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    Carregue seu arquivo <code>.sav</code>. O parser lerá sua equipe, 14 caixas do PC, IVs/EVs, apelidos e atualizará a sua Living Dex e Nuzlocke instantaneamente!
                                </p>
                            </div>

                            <div
                                onClick={() => saveInputRef.current?.click()}
                                className="border-2 border-dashed border-red-500/30 hover:border-red-500 rounded-3xl p-8 text-center cursor-pointer bg-red-600/5 hover:bg-red-600/10 transition-all"
                            >
                                <input
                                    type="file"
                                    ref={saveInputRef}
                                    accept=".sav,.srm"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) onUploadSave(e.target.files[0]);
                                    }}
                                />
                                <Save size={36} className="mx-auto text-red-500 mb-3" />
                                <p className="font-bold text-sm text-gray-200">Clique para carregar ou arraste seu arquivo .sav</p>
                                <p className="text-xs text-gray-400 mt-1">Suporta Pokémon Emerald, FireRed, LeafGreen, Ruby, Sapphire e Moemon (64KB/128KB)</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'roms' && (
                        <div className="space-y-5">
                            <div
                                onClick={() => romInputRef.current?.click()}
                                className="border-2 border-dashed border-white/20 hover:border-white/40 rounded-3xl p-6 text-center cursor-pointer bg-gray-950/40 hover:bg-gray-950/70 transition-all"
                            >
                                <input
                                    type="file"
                                    ref={romInputRef}
                                    accept=".gba,.zip"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) onUploadRom(e.target.files[0]);
                                    }}
                                />
                                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="font-bold text-sm text-gray-200">Adicionar ROM (.gba ou .zip)</p>
                                <p className="text-xs text-gray-400 mt-1">Armazenada 100% no seu navegador (IndexedDB). NUNCA enviada para a nuvem.</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ROMs Armazenadas ({loadedRoms.length})</h4>
                                {loadedRoms.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic p-4 text-center bg-gray-950/30 rounded-xl">Nenhuma ROM adicionada no IndexedDB ainda.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {loadedRoms.map((r) => (
                                            <div key={r.gameCode} className="p-3 bg-gray-950/60 border border-white/5 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm text-gray-200">{r.title}</p>
                                                    <p className="text-xs text-gray-400 font-mono">Código: {r.gameCode} • {(r.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                </div>
                                                <span className="px-2.5 py-1 bg-green-950 text-green-400 border border-green-800 text-xs font-bold rounded-lg">Pronto</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'cloud' && (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-300 leading-relaxed">
                                Conectado ao projeto <strong>MoeDex-GBA-Cloud</strong> no Supabase para sincronizar suas Runs, Living Dex e backups de saves entre seus dispositivos.
                            </p>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">Supabase Project URL</label>
                                <input
                                    type="text"
                                    value={supabaseUrl}
                                    onChange={(e) => setSupabaseUrl(e.target.value)}
                                    className="w-full bg-gray-950 border border-white/10 rounded-xl p-2.5 text-sm text-gray-100 font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">Supabase Anon Key</label>
                                <input
                                    type="password"
                                    value={supabaseKey}
                                    onChange={(e) => setSupabaseKey(e.target.value)}
                                    className="w-full bg-gray-950 border border-white/10 rounded-xl p-2.5 text-sm text-gray-100 font-mono"
                                />
                            </div>
                            <button
                                onClick={handleSaveConfig}
                                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-red-600/20"
                            >
                                Salvar Configurações da Nuvem
                            </button>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};
