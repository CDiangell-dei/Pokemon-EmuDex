import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, Gamepad2, Heart, MapPin, ChevronDown, Loader2, X, Upload, Download, 
  RefreshCw, FolderOpen, AlertCircle, CheckCircle, ArrowUpCircle, Layers, Palette, 
  Edit3, Copy, ClipboardCheck, Skull, Shield, BarChart2, Map, Star, PlusCircle, 
  MinusCircle, Users, ListFilter, Trash2, CheckSquare, LogIn, LogOut, User 
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/auth/AuthModal';
import { TypeBadge } from './components/common/TypeBadge';
import { ALL_TYPES, GEN_RANGES, REGION_ROUTES, STAT_BAR_COLORS, THEMES, PAGE_SIZE } from './constants/pokemon';
import { padId, getIdFromUrl, formatName, calculateWeaknesses } from './utils/helpers';

// Template para nova run
const NEW_RUN_TEMPLATE = (gameName = `Nova Run - ${new Date().toLocaleDateString()}`, isNuzlocke = false, trainerName = "Waifu Dex Master", region = "Kanto") => ({
  id: Date.now().toString(),
  trainer: trainerName,
  game: gameName,
  region: region,
  nuzlocke: isNuzlocke,
  dexComplete: false,
  total_caught: 0,
  team: [],
  routes: {},
  living_dex: [],
  total_deaths: 0
});

const DEFAULT_SAVE_DATA = {
  trainer: "Waifu Dex Master",
  game: "Moemon Dex",
  region: "Kanto",
  nuzlocke: false,
  dexComplete: false,
  total_caught: 0,
  team: [],
  routes: {},
  living_dex: [],
  total_deaths: 0
};

const INITIAL_GLOBAL_STATE = {
  activeRunId: "1",
  runs: [{ ...DEFAULT_SAVE_DATA, id: "1" }]
};

// --- COMPONENTES MODAIS & AUXILIARES ---

// 1. Setup Modal
const RunSetupModal = ({ isOpen, onCreate, onImportSave, theme, defaultTrainer }) => {
  const [trainerName, setTrainerName] = useState(defaultTrainer || "Waifu Dex Master");
  const [gameName, setGameName] = useState("");
  const [regionName, setRegionName] = useState("Kanto");
  const [isNuzlocke, setIsNuzlocke] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (defaultTrainer) setTrainerName(defaultTrainer);
  }, [defaultTrainer]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!gameName.trim()) {
      alert("Por favor, insira o nome da sua Run/Jogo.");
      return;
    }
    const newRun = NEW_RUN_TEMPLATE(gameName, isNuzlocke, trainerName, regionName);
    onCreate(newRun);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.living_dex && parsed.game) {
          onImportSave(parsed);
        } else {
          alert("Erro: Arquivo JSON não é um save do Moedex válido.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON. Verifique o formato.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className={`${theme.modalBg} border ${theme.borderColor} w-full max-w-md rounded-2xl overflow-hidden shadow-2xl`}>
        <div className={`p-6 border-b ${theme.borderColor} ${theme.bgSoft}`}>
          <h2 className={`text-2xl font-black ${theme.bodyText} flex items-center gap-2`}>
            <Gamepad2 className={theme.text} /> Configurar Jornada
          </h2>
          <p className={`${theme.mutedText} text-sm mt-1`}>Crie uma nova Run ou carregue um save existente.</p>
        </div>
        <div className="p-6 space-y-4">
          <h3 className={`text-lg font-bold ${theme.bodyText}`}>1. Criar Nova Run</h3>

          <div>
            <label className={`${theme.mutedText} text-xs font-bold uppercase mb-1 flex items-center gap-1`}>Nome do Jogador</label>
            <input type="text" value={trainerName} onChange={(e) => setTrainerName(e.target.value)} className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2 rounded-lg border ${theme.borderColor}`} />
          </div>

          <div>
            <label className={`${theme.mutedText} text-xs font-bold uppercase mb-1 flex items-center gap-1`}>Nome da Run/Jogo</label>
            <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="Ex: Fire Red Nuzlocke" className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2 rounded-lg border ${theme.borderColor}`} />
          </div>

          <div>
            <label className={`${theme.mutedText} text-xs font-bold uppercase mb-1 flex items-center gap-1`}>Região Inicial</label>
            <select value={regionName} onChange={(e) => setRegionName(e.target.value)} className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2 rounded-lg border ${theme.borderColor}`}>
              {Object.keys(REGION_ROUTES).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border bg-red-900/10 border-red-500/20 cursor-pointer">
            <input type="checkbox" checked={isNuzlocke} onChange={(e) => setIsNuzlocke(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
            <span className={`${theme.bodyText} text-sm font-bold`}>Desafio Nuzlocke (Morte Permanente)</span>
          </label>

          <button onClick={handleSubmit} className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all ${theme.primary} ${theme.hover}`}>
            Começar Jornada
          </button>

          <div className={`border-t ${theme.borderColor} pt-4 mt-4`}>
            <h3 className={`text-lg font-bold ${theme.bodyText} mb-3`}>2. Restaurar Save (.json)</h3>
            <label className="w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all bg-gray-700 hover:bg-gray-600 flex items-center justify-center cursor-pointer">
              <Upload size={18} className="mr-2" /> Carregar Save JSON
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileSelect} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Sidebar Team
const TeamSidebar = ({ teamIds, allCaught, onRemove, theme, localFolderMap, localShinyMap }) => {
  if (!teamIds || teamIds.length === 0) return null;
  return (
    <div className={`fixed right-4 top-24 bottom-4 w-16 md:w-20 ${theme.cardBg} ${theme.borderColor} border rounded-2xl flex flex-col items-center py-4 gap-3 shadow-xl z-30 transition-all overflow-y-auto hide-scrollbar backdrop-blur-xl`}>
      <div className={`${theme.primary} p-2 rounded-full text-white mb-2 shadow-lg`}><Users size={20} /></div>
      {teamIds.map((id, index) => {
        const mon = allCaught.find(d => d.dex_id === id);
        if (!mon) return null;
        const isDead = mon.status === 'dead';
        const isShiny = mon.shiny;

        const apiSprite = isShiny
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
          : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        const localSprite = localFolderMap && localFolderMap[id] ? localFolderMap[id] : null;
        const localShiny = localShinyMap && localShinyMap[id] ? localShinyMap[id] : null;
        const finalSrc = mon.custom_sprite || (isShiny && localShiny ? localShiny : localSprite) || apiSprite;

        return (
          <div key={`${id}-${index}`} className="relative group cursor-pointer animate-in fade-in zoom-in duration-300" onClick={() => onRemove(id)}>
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 ${isDead ? 'border-gray-600 bg-gray-800 grayscale' : `${theme.borderColor} ${theme.bgSoft}`} flex items-center justify-center overflow-hidden shadow-md group-hover:scale-110 transition-transform bg-white/10`}>
              <img src={finalSrc} alt={mon.nickname} className="w-full h-full object-contain p-1" onError={(e) => e.target.src = apiSprite} />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><MinusCircle size={12} /></div>
          </div>
        );
      })}
      {[...Array(Math.max(0, 6 - teamIds.length))].map((_, i) => (
        <div key={`empty-${i}`} className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-dashed ${theme.borderColor} flex items-center justify-center opacity-30`}><span className={`text-xs ${theme.mutedText} font-bold`}>{i + teamIds.length + 1}</span></div>
      ))}
    </div>
  );
};

// 3. Stats Modal
const StatsModal = ({ isOpen, onClose, dex, theme, totalDeaths }) => {
  if (!isOpen) return null;
  const total = dex.length;
  const dead = dex.filter(d => d.status === 'dead').length;
  const alive = total - dead;
  const female = dex.filter(d => d.gender === 'Female').length;
  const shiny = dex.filter(d => d.shiny).length;

  const safeDivide = (num, den) => den === 0 ? 0 : (num / den) * 100;
  const aliveWidth = safeDivide(alive, total);
  const deadWidth = safeDivide(dead, total);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className={`${theme.modalBg} w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border ${theme.borderColor}`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${theme.borderColor} flex justify-between`}>
          <h2 className={`text-xl font-bold ${theme.bodyText} flex items-center gap-2`}><BarChart2 /> Estatísticas da Run</h2>
          <button onClick={onClose}><X className={theme.mutedText} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`${theme.bgSoft} p-4 rounded-xl border ${theme.borderSoft} text-center`}>
              <p className={`text-3xl font-black ${theme.text}`}>{total}</p>
              <p className={`text-xs uppercase ${theme.mutedText} font-bold`}>Capturados</p>
            </div>
            <div className={`${theme.bgSoft} p-4 rounded-xl border ${theme.borderSoft} text-center`}>
              <p className="text-3xl font-black text-red-500">{totalDeaths}</p>
              <p className={`text-xs uppercase ${theme.mutedText} font-bold`}>Baixas (Nuzlocke)</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1 font-bold">
              <span className="text-green-500">Vivos ({Math.round(aliveWidth)}%)</span>
              <span className="text-gray-500">Mortos ({Math.round(deadWidth)}%)</span>
            </div>
            {total > 0 ? (
              <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${aliveWidth}%` }} className="h-full bg-green-500" />
                <div style={{ width: `${deadWidth}%` }} className="h-full bg-gray-500" />
              </div>
            ) : (
              <div className={`text-xs ${theme.mutedText} italic text-center py-2 border border-dashed ${theme.borderColor} rounded-md`}>
                Nenhuma captura registrada nesta Run.
              </div>
            )}
          </div>
          <div className="flex gap-4 text-sm justify-center">
            <div className="flex items-center gap-2"><Star size={16} className="text-yellow-400 fill-yellow-400" /><span className={theme.bodyText}>Shinies: <strong>{shiny}</strong></span></div>
            <div className="flex items-center gap-2"><span className="text-pink-400 text-lg">♀</span><span className={theme.bodyText}>Fêmeas: <strong>{female}</strong></span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Route Modal (Com suporte a Múltiplas Regiões)
const RouteModal = ({ isOpen, onClose, routes, dex, onUpdateRoute, theme, currentRegion = "Kanto" }) => {
  const [activeRegion, setActiveRegion] = useState(currentRegion);

  if (!isOpen) return null;
  const routeList = REGION_ROUTES[activeRegion] || REGION_ROUTES.Kanto;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className={`${theme.modalBg} w-full max-w-2xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl border ${theme.borderColor} flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${theme.borderColor} flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-xl font-bold ${theme.bodyText} flex items-center gap-2`}><Map /> Tracker de Rotas</h2>
            <select value={activeRegion} onChange={(e) => setActiveRegion(e.target.value)} className={`text-xs ${theme.inputBg} ${theme.bodyText} border ${theme.borderColor} rounded-lg p-1.5 font-bold`}>
              {Object.keys(REGION_ROUTES).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={onClose}><X className={theme.mutedText} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-2">
          {routeList.map(route => {
            const key = `${activeRegion}-${route}`;
            const entry = routes[key] || routes[route];
            const capturedMon = entry?.dex_id ? dex.find(d => d.dex_id === entry.dex_id) : null;
            return (
              <div key={route} className={`flex items-center justify-between p-3 rounded-lg border ${entry?.status === 'failed' ? 'bg-red-900/20 border-red-900/50' : entry?.dex_id ? 'bg-green-900/20 border-green-900/50' : `${theme.inputBg} ${theme.borderColor}`}`}>
                <span className={`font-bold text-sm ${theme.bodyText}`}>{route}</span>
                <div className="flex items-center gap-2">
                  {capturedMon ? (
                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-md">
                      <span className="text-xs font-bold text-white">{capturedMon.nickname}</span>
                      <button onClick={() => onUpdateRoute(key, null)} className="text-red-400 hover:text-white"><X size={14}/></button>
                    </div>
                  ) : entry?.status === 'failed' ? (
                    <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1">❌ Falhou <button onClick={() => onUpdateRoute(key, null)}><X size={14}/></button></span>
                  ) : (
                    <select className={`text-xs ${theme.inputBg} ${theme.bodyText} border ${theme.borderColor} rounded p-1 max-w-[120px]`} onChange={(e) => { if (e.target.value === 'fail') onUpdateRoute(key, { status: 'failed' }); else if (e.target.value) onUpdateRoute(key, { dex_id: parseInt(e.target.value), status: 'caught' }); }} value="">
                      <option value="">Registrar...</option>
                      <option value="fail">❌ Falhou</option>
                      <optgroup label="Capturados">
                        {dex.map(d => <option key={d.dex_id} value={d.dex_id}>{d.nickname}</option>)}
                      </optgroup>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 5. Import Guide Modal
const ImportGuideModal = ({ isOpen, onClose, onSelectFolder, theme }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className={`${theme.modalBg} ${theme.borderColor} border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 border-b ${theme.borderColor} ${theme.bgSoft}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`${theme.primary} p-2 rounded-lg`}><FolderOpen className="text-white" size={24} /></div>
            <h2 className={`text-xl font-bold ${theme.bodyText}`}>Importação de Sprites Locais</h2>
          </div>
          <p className={`${theme.mutedText} text-sm`}>Carregue uma pasta inteira de sprites no seu navegador.</p>
        </div>
        <div className="p-6 space-y-4 text-xs">
          <p className={theme.bodyText}>Renomeie suas imagens começando com o número da Pokédex (ex: <strong>001.png</strong> para Bulbasaur, <strong>001s.png</strong> para Shiny).</p>
        </div>
        <div className={`p-4 border-t ${theme.borderColor} ${theme.bgSoft} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-bold ${theme.mutedText}`}>Cancelar</button>
          <label className={`cursor-pointer ${theme.primary} ${theme.hover} text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2`}>
            <FolderOpen size={16} /> Selecionar Pasta
            <input type="file" className="hidden" webkitdirectory="" directory="" multiple onChange={onSelectFolder} />
          </label>
        </div>
      </div>
    </div>
  );
};

// 6. Data Modal (Backup JSON)
const DataModal = ({ isOpen, onClose, data, onImport, theme, mode }) => {
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className={`${theme.modalBg} ${theme.borderColor} border w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${theme.borderColor} ${theme.bgSoft} flex justify-between items-center`}>
          <h2 className={`text-xl font-bold ${theme.bodyText}`}>{mode === 'export' ? 'Backup & Exportar' : 'Restaurar Dados'}</h2>
          <button onClick={onClose}><X className={theme.mutedText} /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {mode === 'export' ? (
            <div className="space-y-4">
              <textarea readOnly value={data} className={`w-full h-64 ${theme.inputBg} ${theme.bodyText} border ${theme.borderColor} rounded-lg p-4 font-mono text-xs outline-none resize-none`} />
              <button onClick={handleCopy} className={`w-full py-3 rounded-lg font-bold text-white shadow-lg ${copied ? 'bg-green-600' : theme.primary} flex items-center justify-center gap-2`}>
                {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />} {copied ? 'Copiado!' : 'Copiar JSON'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{"game": "...", "living_dex": [...]}' className={`w-full h-48 ${theme.inputBg} ${theme.bodyText} border ${theme.borderColor} rounded-lg p-4 font-mono text-xs outline-none resize-none`} />
              <button onClick={() => { try { onImport(JSON.parse(importText)); onClose(); } catch(e) { alert("JSON inválido"); } }} disabled={!importText} className={`w-full py-3 rounded-lg font-bold text-white shadow-lg ${theme.primary}`}>
                Restaurar via Texto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 7. PokemonCard
const PokemonCard = ({ pokemon, caughtData, onClick, loading, localSpriteUrl, localShinyUrl, theme }) => {
  const isCaught = !!caughtData;
  const isDead = caughtData?.status === 'dead';
  const isShiny = caughtData?.shiny;
  const displayName = caughtData?.nickname || formatName(pokemon.name);

  const apiSprite = isShiny
    ? (pokemon.sprites?.front_shiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`)
    : (pokemon.sprites?.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`);

  const customSprite = caughtData?.custom_sprite;
  const initialSrc = customSprite || (isShiny && localShinyUrl ? localShinyUrl : localSpriteUrl) || apiSprite;

  if (loading || !pokemon.types) return <div className={`aspect-[3/4] rounded-xl ${theme.cardBg} ${theme.borderColor} border animate-pulse`} />;

  return (
    <div onClick={() => onClick(pokemon, caughtData)} className={`relative group cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border ${isCaught ? isDead ? 'bg-gray-900 border-gray-700 shadow-md grayscale' : `bg-gradient-to-br from-gray-900/10 to-gray-900/30 ${isShiny ? 'border-yellow-400 shadow-yellow-500/20' : theme.border} shadow-lg hover:-translate-y-1` : `${theme.cardBg} ${theme.borderColor} opacity-70 hover:opacity-100 grayscale hover:grayscale-0 hover:shadow-md`}`}>
      <div className={`absolute top-2 left-3 z-10 text-[10px] font-mono font-bold ${isDead ? 'text-gray-500' : theme.mutedText} group-hover:${theme.bodyText} transition-colors`}>#{padId(pokemon.id)}</div>
      {isCaught && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {isShiny && <Star size={10} className="text-yellow-400 fill-yellow-400 animate-pulse" />}
          <div className={`p-1 rounded-full shadow-lg ${isDead ? 'bg-gray-700 text-gray-400' : `${theme.primary} text-white`}`}>
            {isDead ? <Skull size={10} /> : <Gamepad2 size={10} />}
          </div>
        </div>
      )}
      <div className="relative h-32 flex items-center justify-center p-4">
        {isCaught && <div className={`absolute w-16 h-16 blur-xl rounded-full transition-all ${isDead ? 'bg-gray-500/10' : isShiny ? 'bg-yellow-400/20' : `${theme.bgSoft} group-hover:bg-opacity-50`}`} />}
        <img src={initialSrc} alt={pokemon.name} loading="lazy" className={`w-24 h-24 object-contain z-10 transition-transform duration-500 ${isCaught ? isDead ? 'grayscale opacity-70 scale-90' : 'group-hover:scale-110 drop-shadow-md' : 'opacity-50 grayscale'}`} onError={(e) => { e.target.src = apiSprite; }} />
      </div>
      <div className="p-3 pt-0 text-center relative z-20">
        <h3 className={`text-sm font-bold truncate ${isCaught ? isDead ? 'text-gray-500 line-through' : isShiny ? 'text-yellow-500' : theme.text : theme.mutedText}`} title={displayName}>{displayName}</h3>
        {isCaught && caughtData.nickname && <p className={`text-[9px] ${theme.mutedText} uppercase tracking-wider -mt-0.5 mb-1`}>({formatName(pokemon.name)})</p>}
        <div className={`flex justify-center gap-1 mt-2 ${isDead ? 'opacity-50 grayscale' : ''}`}>{pokemon.types?.map((t) => <TypeBadge key={t.type.name} type={t.type.name} />)}</div>
      </div>
    </div>
  );
};

// 8. PokemonModal (Com Upload para Supabase Storage)
const PokemonModal = ({ pokemon, caughtData, onClose, onUploadSprite, localSpriteUrl, localShinyUrl, onRegister, userLivingDex, theme, team, toggleTeam, currentRun, updateCurrentRunData }) => {
  if (!pokemon) return null;
  const isCaught = !!caughtData;
  const isDead = caughtData?.status === 'dead';
  const isShiny = caughtData?.shiny;
  const displayName = caughtData?.nickname || formatName(pokemon.name);
  const isInTeam = team && team.includes(pokemon.id);

  const apiSprite = isShiny
    ? (pokemon.sprites?.other['official-artwork']?.front_shiny || pokemon.sprites?.front_shiny)
    : (pokemon.sprites?.other['official-artwork']?.front_default || pokemon.sprites?.front_default);
  const customSprite = caughtData?.custom_sprite;
  const initialSrc = customSprite || (isShiny && localShinyUrl ? localShinyUrl : localSpriteUrl) || apiSprite;

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [showWeakness, setShowWeakness] = useState(false);
  const weaknesses = useMemo(() => calculateWeaknesses(pokemon.types), [pokemon]);

  const [isRegistering, setIsRegistering] = useState(false);
  const [regNickname, setRegNickname] = useState('');
  const [regGender, setRegGender] = useState('Female');
  const [regRegion, setRegRegion] = useState(currentRun.region || 'Kanto');
  const [regStatus, setRegStatus] = useState(isDead ? 'dead' : 'alive');
  const [regShiny, setRegShiny] = useState(false);
  const [pokedexEntry, setPokedexEntry] = useState("Carregando...");

  useEffect(() => {
    setCurrentSrc(customSprite || (isShiny && localShinyUrl ? localShinyUrl : localSpriteUrl) || apiSprite);
    if (isCaught) {
      setRegNickname(caughtData.nickname || '');
      setRegGender(caughtData.gender || 'Female');
      setRegRegion(caughtData.region || currentRun.region || 'Kanto');
      setRegStatus(caughtData.status || 'alive');
      setRegShiny(caughtData.shiny || false);
    }

    const fetchFlavorText = async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}/`);
        const data = await res.json();
        const entry = data.flavor_text_entries.find(e => e.language.name === 'en');
        setPokedexEntry(entry ? entry.flavor_text.replace(/\n|\f/g, ' ') : "Descrição não encontrada.");
      } catch (e) {
        setPokedexEntry("Descrição da Pokédex indisponível.");
      }
    };
    fetchFlavorText();
  }, [pokemon.id, customSprite, localSpriteUrl, isCaught, caughtData, isShiny, apiSprite]);

  const handleSave = () => {
    const finalNickname = regNickname || formatName(pokemon.name);
    let newTeam = team;
    if (regStatus === 'dead' && team.includes(pokemon.id)) {
      newTeam = team.filter(id => id !== pokemon.id);
      updateCurrentRunData({ team: newTeam });
    }

    const newEntry = {
      dex_id: pokemon.id,
      species: formatName(pokemon.name),
      nickname: finalNickname,
      gender: regGender,
      origin: 'Captured',
      region: regRegion,
      status: regStatus,
      shiny: regShiny,
      custom_sprite: caughtData?.custom_sprite || null
    };

    if (isCaught && caughtData.status !== regStatus) {
      const deathChange = (regStatus === 'dead') ? 1 : -1;
      updateCurrentRunData({ total_deaths: Math.max(0, currentRun.total_deaths + deathChange) });
    } else if (!isCaught && regStatus === 'dead') {
      updateCurrentRunData({ total_deaths: currentRun.total_deaths + 1 });
    }

    onRegister(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className={`${theme.modalBg} border ${theme.borderColor} w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
        <div className={`relative h-64 shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${isDead ? 'from-gray-800 to-gray-950' : 'from-black/5 to-black/30'}`}>
          <img src={currentSrc} alt={pokemon.name} className="h-56 w-56 object-contain drop-shadow-2xl z-10" onError={() => setCurrentSrc(apiSprite)} />
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white">✕</button>
          {isCaught && (
            <label className="absolute bottom-4 left-4 cursor-pointer group z-20">
              <div className={`${theme.modalBg} p-2 rounded-full border ${theme.borderColor} flex items-center gap-2 pr-3 text-xs font-bold ${theme.bodyText}`}>
                <Upload size={14} /> Sprite Supabase
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files[0]) onUploadSprite(pokemon.id, e.target.files[0]); }} />
            </label>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`text-2xl font-bold ${theme.bodyText}`}>{isRegistering ? 'Registrar / Editar' : displayName}</h2>
              <p className={`${theme.mutedText} text-xs`}>Espécie: {formatName(pokemon.name)}</p>
            </div>
            <span className={`text-3xl font-black ${theme.mutedText} opacity-20`}>#{padId(pokemon.id)}</span>
          </div>

          <p className={`p-3 rounded-lg border ${theme.borderColor} ${theme.bgSoft} text-xs ${theme.bodyText}`}>
            {pokedexEntry}
          </p>

          {isRegistering || !isCaught ? (
            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-bold uppercase mb-1 ${theme.mutedText}`}>Apelido</label>
                <input type="text" value={regNickname} onChange={(e) => setRegNickname(e.target.value)} placeholder={formatName(pokemon.name)} className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2 rounded-lg border ${theme.borderColor}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${theme.mutedText}`}>Gênero</label>
                  <select value={regGender} onChange={(e) => setRegGender(e.target.value)} className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2 rounded-lg border ${theme.borderColor}`}>
                    <option value="Female">Fêmea ♀</option>
                    <option value="Male">Macho ♂</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${theme.mutedText}`}>Status</label>
                  <select value={regStatus} onChange={(e) => setRegStatus(e.target.value)} className={`w-full ${theme.inputBg} ${theme.bodyText} px-3 py-2 rounded-lg border ${theme.borderColor}`}>
                    <option value="alive">Vivo 💚</option>
                    <option value="dead">Morto 💀</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={regShiny} onChange={(e) => setRegShiny(e.target.checked)} className="w-4 h-4 text-yellow-500 rounded" />
                <span className={`text-xs font-bold ${regShiny ? 'text-yellow-400' : theme.bodyText}`}>Forma Shiny ✨</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsRegistering(false)} className={`flex-1 ${theme.inputBg} py-2 rounded-lg text-xs font-bold ${theme.mutedText}`}>Cancelar</button>
                <button onClick={handleSave} className={`flex-1 ${theme.primary} text-white py-2 rounded-lg text-xs font-bold shadow-lg`}>Salvar Registro</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={() => toggleTeam(pokemon.id)} className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border ${isInTeam ? 'bg-red-500/10 text-red-400 border-red-500/30' : `${theme.inputBg} ${theme.bodyText} ${theme.borderColor}`}`}>
                {isInTeam ? <><MinusCircle size={14}/> Remover do Time</> : <><PlusCircle size={14}/> Adicionar ao Time</>}
              </button>
              <button onClick={() => setIsRegistering(true)} className={`w-full ${theme.primary} text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2`}>
                <Edit3 size={14} /> Editar Registro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- APLICAÇÃO PRINCIPAL ---

export default function App() {
  const { user, profile, signOut } = useAuth();
  const [globalState, setGlobalState] = useState(() => {
    try {
      const saved = localStorage.getItem('moedex_global_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_GLOBAL_STATE;
  });

  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('moedex_theme') || 'red');
  const theme = THEMES[currentTheme];

  const currentRun = useMemo(() => {
    return globalState.runs.find(r => r.id === globalState.activeRunId) || globalState.runs[0] || NEW_RUN_TEMPLATE();
  }, [globalState]);

  // Carregar Runs do Supabase quando o usuário faz login
  useEffect(() => {
    if (!user) return;
    const loadSupabaseRuns = async () => {
      try {
        const { data: runsData, error: runsErr } = await supabase
          .from('moedex_runs')
          .select('*')
          .order('created_at', { ascending: true });

        if (runsErr) throw runsErr;

        if (runsData && runsData.length > 0) {
          // Busca todos os pokémon capturados das runs
          const { data: caughtData } = await supabase
            .from('moedex_caught_pokemon')
            .select('*');

          const formattedRuns = runsData.map(run => {
            const runCaught = (caughtData || []).filter(c => c.run_id === run.id);
            return {
              id: run.id,
              game: run.game_name,
              nuzlocke: run.is_nuzlocke,
              dexComplete: run.dex_complete,
              total_deaths: run.total_deaths,
              total_caught: run.total_caught,
              team: run.team || [],
              routes: run.routes || {},
              living_dex: runCaught
            };
          });

          setGlobalState({
            activeRunId: formattedRuns[0].id,
            runs: formattedRuns
          });
        }
      } catch (e) {
        console.error('Erro ao carregar dados do Supabase:', e);
      }
    };
    loadSupabaseRuns();
  }, [user]);

  // Atualizador central da Run ativa
  const updateCurrentRunData = useCallback(async (newData) => {
    setGlobalState(prev => {
      const updatedRuns = prev.runs.map(run => 
        run.id === prev.activeRunId ? { ...run, ...newData } : run
      );
      return { ...prev, runs: updatedRuns };
    });

    // Se estiver logado, sincroniza com o Supabase
    if (user && currentRun.id) {
      try {
        await supabase
          .from('moedex_runs')
          .update({
            game_name: newData.game ?? currentRun.game,
            is_nuzlocke: newData.nuzlocke ?? currentRun.nuzlocke,
            dex_complete: newData.dexComplete ?? currentRun.dexComplete,
            total_deaths: newData.total_deaths ?? currentRun.total_deaths,
            total_caught: newData.total_caught ?? currentRun.total_caught,
            team: newData.team ?? currentRun.team,
            routes: newData.routes ?? currentRun.routes,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentRun.id)
          .eq('user_id', user.id);
      } catch (e) {
        console.error('Erro ao sincronizar run no Supabase:', e);
      }
    }
  }, [user, currentRun]);

  const toggleTeam = (id) => {
    const currentTeam = currentRun.team || [];
    let newTeam;
    if (currentTeam.includes(id)) {
      newTeam = currentTeam.filter(tid => tid !== id);
    } else {
      if (currentTeam.length >= 6) {
        alert("O seu time já possui 6 Pokémon!");
        return;
      }
      newTeam = [...currentTeam, id];
    }
    updateCurrentRunData({ team: newTeam });
  };

  const handleRegisterPokemon = async (newEntry) => {
    const prevDex = currentRun.living_dex || [];
    const idx = prevDex.findIndex(d => d.dex_id === newEntry.dex_id);
    let updatedDex;
    if (idx >= 0) {
      updatedDex = [...prevDex];
      updatedDex[idx] = newEntry;
    } else {
      updatedDex = [...prevDex, newEntry];
    }

    updateCurrentRunData({
      living_dex: updatedDex,
      total_caught: updatedDex.length
    });

    if (selectedPokemon) {
      setSelectedPokemon(prev => ({ ...prev, caughtData: newEntry }));
    }

    // Salva no Supabase se logado
    if (user) {
      try {
        await supabase
          .from('moedex_caught_pokemon')
          .upsert({
            run_id: currentRun.id,
            user_id: user.id,
            dex_id: newEntry.dex_id,
            species: newEntry.species,
            nickname: newEntry.nickname,
            gender: newEntry.gender,
            origin: newEntry.origin,
            region: newEntry.region,
            status: newEntry.status,
            shiny: newEntry.shiny,
            custom_sprite_url: newEntry.custom_sprite,
            updated_at: new Date().toISOString()
          }, { onConflict: 'run_id,dex_id' });
      } catch (e) {
        console.error('Erro ao salvar Pokémon no Supabase:', e);
      }
    }
  };

  const handleUpdateRoute = (routeKey, data) => {
    const newRoutes = { ...(currentRun.routes || {}), [routeKey]: data };
    if (!data) delete newRoutes[routeKey];
    updateCurrentRunData({ routes: newRoutes });
  };

  const handleSpriteUpload = useCallback(async (pokemonId, file) => {
    if (user) {
      // Upload para Supabase Storage Bucket
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${currentRun.id}/${pokemonId}_${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('moedex-sprites')
          .upload(filePath, file, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage
          .from('moedex-sprites')
          .getPublicUrl(filePath);

        updateCurrentRunData({
          living_dex: currentRun.living_dex.map(mon => 
            mon.dex_id === pokemonId ? { ...mon, custom_sprite: publicUrl } : mon
          )
        });
        alert('Sprite enviado e salvo na nuvem!');
      } catch (e) {
        console.error('Erro no upload para Supabase Storage:', e);
        alert('Falha no upload para nuvem.');
      }
    } else {
      // Fallback local Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        updateCurrentRunData({
          living_dex: currentRun.living_dex.map(mon =>
            mon.dex_id === pokemonId ? { ...mon, custom_sprite: base64 } : mon
          )
        });
      };
      reader.readAsDataURL(file);
    }
  }, [user, currentRun, updateCurrentRunData]);

  // Estados dos Modais
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRunMenuOpen, setIsRunMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  // Filtros Pokédex
  const [globalList, setGlobalList] = useState([]);
  const [currentBaseList, setCurrentBaseList] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterGen, setFilterGen] = useState('all');
  const [type1, setType1] = useState('');
  const [type2, setType2] = useState('');
  const [page, setPage] = useState(1);
  const [detailedData, setDetailedData] = useState({});

  // Sprites Locais
  const [localFolderMap, setLocalFolderMap] = useState({});
  const [localShinyMap, setLocalShinyMap] = useState({});
  const [folderStatus, setFolderStatus] = useState(null);

  // Salvamento Local
  useEffect(() => {
    try {
      localStorage.setItem('moedex_global_state', JSON.stringify(globalState));
    } catch (e) {}
    localStorage.setItem('moedex_theme', currentTheme);
  }, [globalState, currentTheme]);

  // Fetch Master List PokéAPI
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
        const data = await res.json();
        const clean = data.results.map(p => ({ name: p.name, url: p.url, id: getIdFromUrl(p.url) }));
        setGlobalList(clean);
        setCurrentBaseList(clean);
      } catch (e) {
      } finally {
        setLoadingGlobal(false);
      }
    };
    fetchMaster();
  }, []);

  const finalDisplayList = useMemo(() => {
    return currentBaseList.filter(p => {
      const nameMatch = formatName(p.name).toLowerCase().includes(searchTerm.toLowerCase()) || String(p.id).includes(searchTerm);
      const caught = currentRun.living_dex?.find(d => d.dex_id === p.id);
      const statusMatch = filterType === 'all' ? true : filterType === 'caught' ? !!caught : !caught;
      let genMatch = true;
      if (filterGen !== 'all') {
        const [min, max] = GEN_RANGES[parseInt(filterGen)] || [0, 0];
        genMatch = p.id >= min && p.id <= max;
      }
      return nameMatch && statusMatch && genMatch;
    });
  }, [currentBaseList, searchTerm, filterType, filterGen, currentRun.living_dex]);

  const visibleItems = useMemo(() => finalDisplayList.slice(0, page * PAGE_SIZE), [finalDisplayList, page]);

  useEffect(() => {
    const missingIds = visibleItems.filter(p => !detailedData[p.id]).map(p => p.id);
    if (missingIds.length === 0) return;
    const fetchBatch = async () => {
      const promises = missingIds.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()).catch(() => null));
      const results = await Promise.all(promises);
      setDetailedData(prev => {
        const next = { ...prev };
        results.forEach(d => { if (d) next[d.id] = d; });
        return next;
      });
    };
    fetchBatch();
  }, [visibleItems, detailedData]);

  const stats = useMemo(() => {
    const total = currentRun.dexComplete ? 1025 : 151;
    const caught = (currentRun.living_dex || []).filter(d => d.dex_id <= total).length;
    return { total, caught, percent: ((caught / total) * 100).toFixed(1) };
  }, [currentRun]);

  return (
    <div className={`min-h-screen font-sans ${theme.bgPage} ${theme.bodyText}`}>
      {/* HEADER */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${theme.borderColor} ${theme.modalBg} bg-opacity-80`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${theme.primary} p-2 rounded-xl shadow-lg`}>
              <Gamepad2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className={`font-black text-xl tracking-tight leading-none ${theme.bodyText}`}>
                MOE<span className={theme.text}>DEX</span>
              </h1>
              <div className="relative inline-block mt-0.5">
                <button
                  onClick={() => setIsRunMenuOpen(!isRunMenuOpen)}
                  className={`text-[10px] font-bold ${theme.mutedText} uppercase tracking-widest flex items-center gap-1 hover:${theme.text}`}
                >
                  <ListFilter size={10} /> RUN: {currentRun.game}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsStatsOpen(true)} className={`p-2 rounded-full hover:bg-white/10 ${theme.mutedText}`} title="Stats"><BarChart2 size={18} /></button>
            <button onClick={() => setIsRouteOpen(true)} className={`p-2 rounded-full hover:bg-white/10 ${theme.mutedText}`} title="Rotas"><Map size={18} /></button>
            <button onClick={() => setIsDataModalOpen(true)} className={`p-2 rounded-full hover:bg-white/10 ${theme.mutedText}`} title="Backup"><Download size={18} /></button>
            
            {user ? (
              <button onClick={signOut} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                <LogOut size={14} /> Sair ({profile?.trainer_name || user.email.split('@')[0]})
              </button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${theme.primary} text-white shadow-lg`}>
                <LogIn size={14} /> Login / Nuvem
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SIDEBAR DO TIME */}
      <TeamSidebar teamIds={currentRun.team} allCaught={currentRun.living_dex || []} onRemove={toggleTeam} theme={theme} localFolderMap={localFolderMap} localShinyMap={localShinyMap} />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* BUSCA E FILTROS */}
        <section className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search size={18} className={theme.mutedText} />
              <input
                type="text"
                placeholder="Buscar Pokémon por nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${theme.inputBg} ${theme.bodyText} px-4 py-2.5 rounded-xl border ${theme.borderColor} text-sm outline-none ${theme.focusRing} focus:ring-1`}
              />
            </div>
            <div className="flex gap-2">
              <select value={filterGen} onChange={(e) => setFilterGen(e.target.value)} className={`text-xs font-bold ${theme.inputBg} ${theme.bodyText} px-3 py-2 rounded-xl border ${theme.borderColor}`}>
                <option value="all">Todas as Gerações</option>
                <option value="1">Gen 1 (Kanto)</option>
                <option value="2">Gen 2 (Johto)</option>
                <option value="3">Gen 3 (Hoenn)</option>
                <option value="4">Gen 4 (Sinnoh)</option>
                <option value="5">Gen 5 (Unova)</option>
              </select>
              <div className={`flex ${theme.inputBg} p-1 rounded-xl border ${theme.borderColor}`}>
                {['all', 'caught', 'missing'].map(t => (
                  <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${filterType === t ? `${theme.primary} text-white` : theme.mutedText}`}>
                    {t === 'all' ? 'Todos' : t === 'caught' ? 'Capturados' : 'Faltam'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* GRID POKÉDEX */}
        {loadingGlobal ? (
          <div className="flex justify-center py-20"><Loader2 className={`animate-spin ${theme.text}`} size={32} /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visibleItems.map(p => {
              const caughtData = (currentRun.living_dex || []).find(d => d.dex_id === p.id);
              const fullData = detailedData[p.id] || p;
              return (
                <PokemonCard
                  key={p.id}
                  pokemon={fullData}
                  caughtData={caughtData}
                  loading={!detailedData[p.id]}
                  localSpriteUrl={localFolderMap[p.id]}
                  localShinyUrl={localShinyMap[p.id]}
                  theme={theme}
                  onClick={(mon, caught) => setSelectedPokemon({ pokemon: mon, caughtData: caught })}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* MODAIS */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} theme={theme} />
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} dex={currentRun.living_dex || []} theme={theme} totalDeaths={currentRun.total_deaths || 0} />
      <RouteModal isOpen={isRouteOpen} onClose={() => setIsRouteOpen(false)} routes={currentRun.routes || {}} dex={currentRun.living_dex || []} onUpdateRoute={handleUpdateRoute} theme={theme} currentRegion={currentRun.region} />
      <DataModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} mode="export" data={JSON.stringify(currentRun, null, 2)} theme={theme} />
      {selectedPokemon && (
        <PokemonModal
          pokemon={selectedPokemon.pokemon}
          caughtData={selectedPokemon.caughtData}
          onClose={() => setSelectedPokemon(null)}
          onUploadSprite={handleSpriteUpload}
          onRegister={handleRegisterPokemon}
          userLivingDex={currentRun.living_dex || []}
          theme={theme}
          team={currentRun.team || []}
          toggleTeam={toggleTeam}
          currentRun={currentRun}
          updateCurrentRunData={updateCurrentRunData}
        />
      )}
    </div>
  );
}
