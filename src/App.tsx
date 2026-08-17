import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, X, Gamepad2, Sparkles, Save, Upload } from 'lucide-react';

import { db, StoredRom } from './services/db';
import { processRomUpload } from './services/romHandler';
import { parseGen3Save, ParsedSaveData } from './services/saveParser';
import { syncRunToDatabase, loadUserRunsFromCloud } from './services/supabase';
import { fetchMasterPokemonList, fetchPokemonDetails } from './services/pokeApi';
import { getCurrentUser, UserProfile } from './services/auth';

import { BasicPokemon, PokemonApiDetails, CaughtPokemonData } from './types/pokemon';
import { RunData, GlobalAppState } from './types/run';
import { THEMES, ThemeConfig } from './types/theme';

import { Header } from './components/layout/Header';
import { WelcomeHub } from './components/layout/WelcomeHub';
import { GbaEmulator } from './components/emulator/GbaEmulator';
import { PokemonCard } from './components/tracker/PokemonCard';
import { PokemonDetailModal } from './components/tracker/PokemonDetailModal';
import { TeamSidebar } from './components/tracker/TeamSidebar';
import { GbaCloudModal } from './components/modals/GbaCloudModal';
import { AuthModal } from './components/modals/AuthModal';

const PAGE_SIZE = 48;

const DEFAULT_RUN: RunData = {
  id: 1,
  trainer: 'Treinador',
  game: 'Pokémon Emerald',
  game_code: 'BPEE',
  nuzlocke: false,
  living_dex: [],
  caught_details: {},
  team: [],
  graveyard: [],
  routes: {},
  total_caught: 0
};

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'welcome' | 'emulator' | 'tracker' | 'split'>('welcome');
  const [spriteStyle, setSpriteStyle] = useState<'moemon' | 'classic'>(() => (localStorage.getItem('moedex_sprite_style') as any) || 'moemon');
  const [currentTheme, setCurrentTheme] = useState<string>(() => localStorage.getItem('moedex_theme') || 'red');
  const theme = THEMES[currentTheme] || THEMES.red;

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [globalState, setGlobalState] = useState<GlobalAppState>(() => {
    try {
      const saved = localStorage.getItem('moedex_global_state_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { activeRunId: 1, runs: [DEFAULT_RUN] };
  });

  const currentRun = useMemo(() => {
    return globalState.runs.find(r => r.id === globalState.activeRunId) || globalState.runs[0] || DEFAULT_RUN;
  }, [globalState]);

  const [globalList, setGlobalList] = useState<BasicPokemon[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterGen, setFilterGen] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'caught' | 'missing'>('all');
  const [page, setPage] = useState<number>(1);
  const [detailedData, setDetailedData] = useState<Record<number, PokemonApiDetails>>({});
  const [selectedPokemon, setSelectedPokemon] = useState<BasicPokemon | null>(null);

  const [localFolderMap, setLocalFolderMap] = useState<Record<number, string>>(() => (window as any).DEFAULT_SPRITES_MANIFEST?.regular || {});
  const [localShinyMap, setLocalShinyMap] = useState<Record<number, string>>(() => (window as any).DEFAULT_SPRITES_MANIFEST?.shiny || {});

  const [isGbaModalOpen, setIsGbaModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [loadedRoms, setLoadedRoms] = useState<any[]>([]);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [autoStartCode, setAutoStartCode] = useState<string | null>(null);

  // Inicializar usuário
  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  // Quando usuário logar, carregar suas Runs da nuvem
  useEffect(() => {
    if (currentUser && !currentUser.isGuest) {
      loadUserRunsFromCloud(currentUser.id).then(cloudRuns => {
        if (cloudRuns && cloudRuns.length > 0) {
          const mappedRuns: RunData[] = cloudRuns.map(r => ({
            id: r.id,
            trainer: r.trainer_name,
            trainer_id: r.trainer_id,
            secret_id: r.secret_id,
            game: r.game_title,
            game_code: r.game_code,
            nuzlocke: r.is_nuzlocke,
            living_dex: r.living_dex || [],
            team: r.team || [],
            graveyard: r.graveyard || [],
            routes: r.routes || {},
            play_time: r.play_time || {},
            total_caught: r.total_caught || (r.living_dex || []).length
          }));
          setGlobalState(prev => ({
            ...prev,
            runs: mappedRuns,
            activeRunId: mappedRuns[0].id
          }));
        }
      });
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('moedex_global_state_v2', JSON.stringify(globalState));
    localStorage.setItem('moedex_theme', currentTheme);
    localStorage.setItem('moedex_sprite_style', spriteStyle);
  }, [globalState, currentTheme, spriteStyle]);

  useEffect(() => {
    fetchMasterPokemonList().then(list => {
      setGlobalList(list);
      setLoadingList(false);
    });
  }, []);

  useEffect(() => {
    fetch('./sprites_manifest.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data && data.regular) {
          setLocalFolderMap(data.regular);
          if (data.shiny) setLocalShinyMap(data.shiny);
        }
      })
      .catch(() => {});
  }, []);

  const refreshRoms = useCallback(async () => {
    const roms = await db.listRoms();
    setLoadedRoms(roms);
  }, []);

  useEffect(() => {
    refreshRoms();
  }, [refreshRoms]);

  const updateCurrentRun = useCallback((updater: Partial<RunData>) => {
    setGlobalState(prev => {
      const updatedRuns = prev.runs.map(r => {
        if (r.id === prev.activeRunId) {
          const updated = { ...r, ...updater, updated_at: new Date().toISOString() };
          syncRunToDatabase(updated, currentUser?.id);
          return updated;
        }
        return r;
      });
      return { ...prev, runs: updatedRuns };
    });
  }, [currentUser]);

  const handleSaveAutoParsed = useCallback((parsed: ParsedSaveData) => {
    const caughtSet = new Set(currentRun.living_dex || []);
    parsed.allCaughtDexIds.forEach(id => caughtSet.add(id));

    const newCaughtDetails: Record<number, CaughtPokemonData> = { ...(currentRun.caught_details || {}) };
    parsed.party.forEach(p => {
      newCaughtDetails[p.speciesId] = {
        dex_id: p.speciesId,
        nickname: p.nickname,
        level: p.level,
        nature: p.nature,
        is_shiny: p.isShiny,
        is_fainted: p.isFainted,
        gender: p.gender,
        current_hp: p.currentHp,
        max_hp: p.maxHp,
        moves: p.moves,
        held_item: p.heldItem,
        ivs: p.ivs,
        evs: p.evs,
        stats: p.stats,
        location: 'party'
      };
    });

    parsed.boxes.forEach(p => {
      if (!newCaughtDetails[p.speciesId]) {
        newCaughtDetails[p.speciesId] = {
          dex_id: p.speciesId,
          nickname: p.nickname,
          level: p.level,
          nature: p.nature,
          is_shiny: p.isShiny,
          gender: p.gender,
          moves: p.moves,
          held_item: p.heldItem,
          ivs: p.ivs,
          evs: p.evs,
          location: 'box',
          box_number: p.boxNumber
        };
      }
    });

    const updatedTeam = parsed.party.map(p => p.speciesId);
    const updatedGraveyard = [...(currentRun.graveyard || [])];
    parsed.faintedNuzlockeIds.forEach(id => {
      if (!updatedGraveyard.includes(id)) updatedGraveyard.push(id);
    });

    updateCurrentRun({
      trainer: parsed.trainerName,
      trainer_id: parsed.trainerId,
      secret_id: parsed.secretId,
      living_dex: Array.from(caughtSet),
      total_caught: caughtSet.size,
      caught_details: newCaughtDetails,
      team: updatedTeam.slice(0, 6),
      graveyard: updatedGraveyard,
      play_time: parsed.playTime
    });

    setSaveStatusMessage(`Save de "${parsed.trainerName}" sincronizado!`);
    setTimeout(() => setSaveStatusMessage(null), 4000);
  }, [currentRun, updateCurrentRun]);

  const handleUploadSave = async (file: File) => {
    try {
      setSaveStatusMessage('Lendo e descriptografando save Gen 3...');
      const buffer = await file.arrayBuffer();
      const parsed = parseGen3Save(buffer, currentRun.game_code || 'BPEE');
      handleSaveAutoParsed(parsed);
    } catch (e: any) {
      alert(`Erro ao carregar save: ${e.message}`);
      setSaveStatusMessage(null);
    }
  };

  const handleUploadRom = async (file: File) => {
    try {
      setSaveStatusMessage('Extraindo e registrando ROM...');
      const { header } = await processRomUpload(file);
      await refreshRoms();
      updateCurrentRun({
        game: header.title,
        game_code: header.gameCode
      });
      setSaveStatusMessage(`ROM "${header.title}" pronta!`);
      setTimeout(() => setSaveStatusMessage(null), 4000);
    } catch (e: any) {
      alert(`Erro ao adicionar ROM: ${e.message}`);
      setSaveStatusMessage(null);
    }
  };

  const filteredPokemonList = useMemo(() => {
    return globalList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.id).includes(searchTerm);
      if (!matchesSearch) return false;

      if (filterGen !== 'all') {
        const id = p.id;
        if (filterGen === 'gen1' && (id < 1 || id > 151)) return false;
        if (filterGen === 'gen2' && (id < 152 || id > 251)) return false;
        if (filterGen === 'gen3' && (id < 252 || id > 386)) return false;
        if (filterGen === 'gen4' && (id < 387 || id > 493)) return false;
        if (filterGen === 'gen5' && (id < 494 || id > 649)) return false;
        if (filterGen === 'gen6' && (id < 650 || id > 721)) return false;
        if (filterGen === 'gen7' && (id < 722 || id > 809)) return false;
        if (filterGen === 'gen8' && (id < 810 || id > 905)) return false;
        if (filterGen === 'gen9' && (id < 906 || id > 1025)) return false;
        if (filterGen === 'forms' && id < 10000) return false;
      }

      const isCaught = (currentRun.living_dex || []).includes(p.id);
      if (filterStatus === 'caught' && !isCaught) return false;
      if (filterStatus === 'missing' && isCaught) return false;

      return true;
    });
  }, [globalList, searchTerm, filterGen, filterStatus, currentRun.living_dex]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPokemonList.slice(start, start + PAGE_SIZE);
  }, [filteredPokemonList, page]);

  const totalPages = Math.ceil(filteredPokemonList.length / PAGE_SIZE) || 1;

  useEffect(() => {
    paginatedList.forEach(p => {
      if (!detailedData[p.id]) {
        fetchPokemonDetails(p.id).then(d => {
          if (d) setDetailedData(prev => ({ ...prev, [p.id]: d }));
        });
      }
    });
  }, [paginatedList, detailedData]);

  return (
    <div className={`min-h-screen ${theme.bgPage} ${theme.bodyText} flex flex-col font-sans transition-colors duration-300`}>
      
      {/* Header Fixo */}
      <Header
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        spriteStyle={spriteStyle}
        onSetSpriteStyle={setSpriteStyle}
        onOpenGbaModal={() => setIsGbaModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        currentRunTitle={currentRun.game}
        totalCaught={currentRun.total_caught || 0}
        theme={theme}
      />

      {/* Área Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {/* TELA 1: WELCOME HUB INICIAL */}
        {viewMode === 'welcome' && (
          <WelcomeHub
            onSelectMode={setViewMode}
            onOpenSaveManager={() => setIsGbaModalOpen(true)}
            theme={theme}
            loadedRoms={loadedRoms}
            onStartStoredRom={(code) => {
              setAutoStartCode(code);
              setViewMode('emulator');
            }}
            currentRunTitle={currentRun.game}
            totalCaught={currentRun.total_caught || 0}
          />
        )}

        {/* TELA 2: EMULADOR GBA */}
        {viewMode === 'emulator' && (
          <div className="space-y-6">
            <GbaEmulator
              gameCode={currentRun.game_code || 'BPEE'}
              onSaveAutoParsed={handleSaveAutoParsed}
              autoStartCode={autoStartCode}
              currentUser={currentUser}
              onRomLoaded={(title, code) => {
                updateCurrentRun({ game: title, game_code: code });
              }}
            />
          </div>
        )}

        {/* TELA 3: POKÉDEX & LIVING DEX POR SAVE OU MODO SPLIT */}
        {(viewMode === 'tracker' || viewMode === 'split') && (
          <div className={`space-y-6 ${viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
            
            {viewMode === 'split' && (
              <div className="space-y-4">
                <GbaEmulator
                  gameCode={currentRun.game_code || 'BPEE'}
                  onSaveAutoParsed={handleSaveAutoParsed}
                  autoStartCode={autoStartCode}
                  currentUser={currentUser}
                  onRomLoaded={(title, code) => {
                    updateCurrentRun({ game: title, game_code: code });
                  }}
                />
              </div>
            )}

            <div className="space-y-6">
              
              {/* Filtros e Busca */}
              <div className="p-4 rounded-3xl bg-gray-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    placeholder="Buscar por nome ou número..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-950/60 border border-white/10 rounded-2xl text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <select
                  value={filterGen}
                  onChange={(e) => { setFilterGen(e.target.value); setPage(1); }}
                  className="bg-gray-950/60 border border-white/10 rounded-2xl px-3 py-2 text-xs font-bold text-gray-200 focus:outline-none"
                >
                  <option value="all">Todas as Gerações</option>
                  <option value="gen1">Gen 1 (Kanto)</option>
                  <option value="gen2">Gen 2 (Johto)</option>
                  <option value="gen3">Gen 3 (Hoenn)</option>
                  <option value="gen4">Gen 4 (Sinnoh)</option>
                  <option value="gen5">Gen 5 (Unova)</option>
                  <option value="gen6">Gen 6 (Kalos)</option>
                  <option value="gen7">Gen 7 (Alola)</option>
                  <option value="gen8">Gen 8 (Galar)</option>
                  <option value="gen9">Gen 9 (Paldea)</option>
                  <option value="forms">Megas & Formas</option>
                </select>

                <div className="flex items-center bg-gray-950/60 border border-white/10 p-1 rounded-2xl text-xs font-bold">
                  <button
                    onClick={() => { setFilterStatus('all'); setPage(1); }}
                    className={`px-3 py-1 rounded-xl transition-all ${filterStatus === 'all' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => { setFilterStatus('caught'); setPage(1); }}
                    className={`px-3 py-1 rounded-xl transition-all ${filterStatus === 'caught' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                  >
                    Capturados
                  </button>
                  <button
                    onClick={() => { setFilterStatus('missing'); setPage(1); }}
                    className={`px-3 py-1 rounded-xl transition-all ${filterStatus === 'missing' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
                  >
                    Faltam
                  </button>
                </div>
              </div>

              {/* Grid de Cards */}
              {loadingList ? (
                <div className="flex items-center justify-center p-16 text-gray-400 gap-3">
                  <Loader2 size={24} className="animate-spin text-red-500" />
                  <span className="text-sm font-bold">Carregando Pokédex...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {paginatedList.map(pokemon => {
                    const isCaught = (currentRun.living_dex || []).includes(pokemon.id);
                    const isDead = (currentRun.graveyard || []).includes(pokemon.id);
                    const caughtInfo = currentRun.caught_details?.[pokemon.id];

                    return (
                      <PokemonCard
                        key={pokemon.id}
                        pokemon={pokemon}
                        details={detailedData[pokemon.id]}
                        caughtData={caughtInfo}
                        isCaught={isCaught}
                        isDead={isDead}
                        localSpriteUrl={localFolderMap[pokemon.id]}
                        localShinyUrl={localShinyMap[pokemon.id]}
                        spriteStyle={spriteStyle}
                        theme={theme}
                        onClick={() => setSelectedPokemon(pokemon)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-4 text-xs font-bold text-gray-400">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-900 border border-white/10 rounded-xl disabled:opacity-30 hover:text-white"
                  >
                    Anterior
                  </button>
                  <span>Página {page} de {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-900 border border-white/10 rounded-xl disabled:opacity-30 hover:text-white"
                  >
                    Próxima
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Barra da Equipe Ativa */}
      <TeamSidebar
        teamIds={currentRun.team || []}
        caughtDetails={currentRun.caught_details || {}}
        allPokemon={globalList}
        localFolderMap={localFolderMap}
        localShinyMap={localShinyMap}
        spriteStyle={spriteStyle}
        theme={theme}
        onRemoveFromTeam={(id) => {
          updateCurrentRun({ team: (currentRun.team || []).filter(tId => tId !== id) });
        }}
        onSelectPokemon={(id) => {
          const mon = globalList.find(p => p.id === id);
          if (mon) setSelectedPokemon(mon);
        }}
      />

      {/* Modal de Detalhes do Pokémon */}
      {selectedPokemon && (
        <PokemonDetailModal
          pokemon={selectedPokemon}
          details={detailedData[selectedPokemon.id]}
          caughtData={currentRun.caught_details?.[selectedPokemon.id]}
          isCaught={(currentRun.living_dex || []).includes(selectedPokemon.id)}
          isDead={(currentRun.graveyard || []).includes(selectedPokemon.id)}
          isInTeam={(currentRun.team || []).includes(selectedPokemon.id)}
          localSpriteUrl={localFolderMap[selectedPokemon.id]}
          localShinyUrl={localShinyMap[selectedPokemon.id]}
          spriteStyle={spriteStyle}
          theme={theme}
          onToggleCaught={() => {
            const isCaught = (currentRun.living_dex || []).includes(selectedPokemon.id);
            const nextDex = isCaught
              ? (currentRun.living_dex || []).filter(id => id !== selectedPokemon.id)
              : [...(currentRun.living_dex || []), selectedPokemon.id];
            updateCurrentRun({ living_dex: nextDex, total_caught: nextDex.length });
          }}
          onToggleTeam={() => {
            const inTeam = (currentRun.team || []).includes(selectedPokemon.id);
            const nextTeam = inTeam
              ? (currentRun.team || []).filter(id => id !== selectedPokemon.id)
              : [...(currentRun.team || []), selectedPokemon.id].slice(0, 6);
            updateCurrentRun({ team: nextTeam });
          }}
          onToggleDead={() => {
            const isDead = (currentRun.graveyard || []).includes(selectedPokemon.id);
            const nextGrave = isDead
              ? (currentRun.graveyard || []).filter(id => id !== selectedPokemon.id)
              : [...(currentRun.graveyard || []), selectedPokemon.id];
            updateCurrentRun({ graveyard: nextGrave });
          }}
          onClose={() => setSelectedPokemon(null)}
        />
      )}

      {/* Modal do GBA Cloud Hub */}
      <GbaCloudModal
        isOpen={isGbaModalOpen}
        onClose={() => setIsGbaModalOpen(false)}
        loadedRoms={loadedRoms}
        onUploadRom={handleUploadRom}
        onUploadSave={handleUploadSave}
        statusMessage={saveStatusMessage}
      />

      {/* Modal de Autenticação & Perfil */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user) => setCurrentUser(user)}
      />

      {/* Modal de Temas */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-gray-100">
          <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base">Escolha um Tema</h3>
              <button onClick={() => setIsThemeModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(THEMES).map(([k, t]) => (
                <button
                  key={k}
                  onClick={() => { setCurrentTheme(k); setIsThemeModalOpen(false); }}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    currentTheme === k ? 'border-red-500 bg-red-500/20 text-white' : 'border-white/5 bg-gray-950/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${t.primary}`}></span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
