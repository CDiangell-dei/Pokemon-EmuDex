export const PAGE_SIZE = 48;

export const ALL_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

export const GEN_RANGES = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025]
};

export const TYPE_CHART = {
  normal:   { fighting: 2, ghost: 0 },
  fire:     { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
  water:    { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
  grass:    { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, electric: 0.5, grass: 0.5, ground: 0.5 },
  ice:      { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
  fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
  poison:   { ground: 2, psychic: 2, grass: 0.5, fighting: 0.5, poison: 0.5, bug: 0.5, fairy: 0.5 },
  ground:   { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
  flying:   { electric: 2, ice: 2, rock: 2, grass: 0.5, fighting: 0.5, bug: 0.5, ground: 0 },
  psychic:  { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
  bug:      { fire: 2, flying: 2, rock: 2, grass: 0.5, fighting: 0.5, ground: 0.5 },
  rock:     { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
  ghost:    { ghost: 2, dark: 2, poison: 0.5, bug: 0.5, normal: 0, fighting: 0 },
  dragon:   { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5 },
  dark:     { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
  steel:    { fire: 2, fighting: 2, ground: 2, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5, poison: 0 },
  fairy:    { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 }
};

export const REGION_ROUTES = {
  Kanto: [
    "Pallet Town", "Route 1", "Viridian City", "Route 22", "Route 2", "Viridian Forest",
    "Pewter City", "Route 3", "Mt. Moon", "Route 4", "Cerulean City", "Route 24", "Route 25",
    "Route 5", "Underground Path", "Route 6", "Vermilion City", "Diglett's Cave", "Route 11",
    "Route 9", "Route 10", "Rock Tunnel", "Lavender Town", "Route 8", "Route 7", "Celadon City",
    "Route 16", "Route 17", "Route 18", "Fuchsia City", "Safari Zone", "Route 15", "Route 14",
    "Route 13", "Route 12", "Saffron City", "Silph Co.", "Route 19", "Seafoam Islands", "Route 20",
    "Cinnabar Island", "Pokemon Mansion", "Route 21", "Route 23", "Victory Road", "Cerulean Cave",
    "Power Plant"
  ],
  Johto: [
    "New Bark Town", "Route 29", "Cherrygrove City", "Route 30", "Route 31", "Dark Cave",
    "Violet City", "Sprout Tower", "Route 32", "Union Cave", "Route 33", "Azalea Town",
    "Ilex Forest", "Route 34", "Goldenrod City", "Route 35", "National Park", "Route 36",
    "Route 37", "Ecruteak City", "Burned Tower", "Tin Tower", "Route 38", "Route 39",
    "Olivine City", "Route 40", "Whirl Islands", "Route 41", "Cianwood City", "Route 42",
    "Mt. Mortar", "Mahogany Town", "Rocket Hideout", "Route 43", "Lake of Rage", "Route 44",
    "Ice Path", "Blackthorn City", "Dragon's Den", "Route 45", "Route 46", "Mt. Silver"
  ],
  Hoenn: [
    "Littleroot Town", "Route 101", "Oldale Town", "Route 102", "Petalburg City", "Route 104",
    "Petalburg Woods", "Rustboro City", "Route 116", "Rusturf Tunnel", "Dewford Town", "Granite Cave",
    "Route 107", "Route 108", "Abandoned Ship / Sea Mauville", "Route 109", "Slateport City", "Route 110",
    "New Mauville", "Mauville City", "Route 117", "Verdanturf Town", "Route 111", "Mirage Tower",
    "Route 112", "Fiery Path", "Jagged Pass", "Lavaridge Town", "Route 113", "Fallarbor Town",
    "Route 114", "Meteor Falls", "Route 115", "Route 118", "Route 119", "Fortree City",
    "Route 120", "Route 121", "Safari Zone", "Lilycove City", "Mt. Pyre", "Route 122",
    "Route 123", "Team Magma/Aqua Hideout", "Route 124", "Mossdeep City", "Shoal Cave", "Route 125",
    "Route 126", "Sootopolis City", "Cave of Origin", "Route 127", "Route 128", "Seafloor Cavern",
    "Ever Grande City", "Victory Road", "Sky Pillar"
  ],
  Sinnoh: [
    "Twinleaf Town", "Route 201", "Verity Lakefront", "Lake Verity", "Sandgem Town", "Route 202",
    "Jubilife City", "Route 203", "Oreburgh Gate", "Oreburgh City", "Oreburgh Mine", "Route 204",
    "Ravaged Path", "Floaroma Town", "Floaroma Meadow", "Valley Windworks", "Route 205", "Eterna Forest",
    "Eterna City", "Route 206", "Wayward Cave", "Route 207", "Mt. Coronet", "Route 208",
    "Hearthome City", "Route 209", "Lost Tower", "Solaceon Town", "Solaceon Ruins", "Route 210",
    "Route 215", "Veilstone City", "Route 214", "Ruin Maniac Cave", "Valor Lakefront", "Route 213",
    "Pastoria City", "Great Marsh", "Route 212", "Trophy Garden", "Route 218", "Canalave City",
    "Iron Island", "Lake Valor", "Lake Acuity", "Route 216", "Route 217", "Acuity Lakefront",
    "Snowpoint City", "Snowpoint Temple", "Distortion World / Speer Pillar", "Route 222", "Sunyshore City",
    "Route 223", "Victory Road", "Pokémon League"
  ],
  Unova: [
    "Nuvema Town", "Route 1", "Accumula Town", "Route 2", "Striaton City", "Dreamyard",
    "Route 3", "Wellspring Cave", "Nacrene City", "Pinwheel Forest", "Castelia City", "Route 4",
    "Desert Resort", "Relic Castle", "Nimbasa City", "Route 5", "Driftveil Drawbridge", "Driftveil City",
    "Cold Storage", "Route 6", "Chargestone Cave", "Mistralton City", "Celestial Tower", "Route 7",
    "Twist Mountain", "Icirrus City", "Dragonspiral Tower", "Route 8", "Moor of Icirrus", "Route 9",
    "Shopping Mall Nine", "Opelucid City", "Route 10", "Victory Road", "Giant Chasm"
  ]
};

export const STAT_BAR_COLORS = {
  hp: 'bg-red-500',
  attack: 'bg-orange-500',
  defense: 'bg-yellow-500',
  'special-attack': 'bg-blue-500',
  'special-defense': 'bg-green-500',
  speed: 'bg-pink-500'
};

export const THEMES = {
  red: {
    id: 'red',
    name: 'Moemon Red',
    mode: 'dark',
    primary: 'bg-red-600',
    hover: 'hover:bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    focusRing: 'focus:ring-red-500',
    gradient: 'from-red-600 to-orange-500',
    shadow: 'shadow-red-600/20',
    bgSoft: 'bg-red-600/10',
    borderSoft: 'border-red-500/20',
    bgPage: 'bg-gradient-to-br from-gray-950 via-gray-900 to-red-950',
    bodyText: 'text-gray-100',
    mutedText: 'text-gray-400',
    cardBg: 'bg-gray-900/60',
    modalBg: 'bg-gray-900',
    inputBg: 'bg-gray-900',
    borderColor: 'border-white/10'
  },
  blue: {
    id: 'blue',
    name: 'Ocean Blue',
    mode: 'light',
    primary: 'bg-blue-500',
    hover: 'hover:bg-blue-400',
    text: 'text-blue-700',
    border: 'border-blue-400',
    focusRing: 'focus:ring-blue-400',
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/20',
    bgSoft: 'bg-blue-200/50',
    borderSoft: 'border-blue-300',
    bgPage: 'bg-gradient-to-br from-slate-100 via-blue-100 to-blue-200',
    bodyText: 'text-slate-800',
    mutedText: 'text-slate-500',
    cardBg: 'bg-white/60 backdrop-blur-md',
    modalBg: 'bg-slate-50',
    inputBg: 'bg-white/80',
    borderColor: 'border-blue-200'
  },
  green: {
    id: 'green',
    name: 'Leaf Green',
    mode: 'light',
    primary: 'bg-emerald-600',
    hover: 'hover:bg-emerald-500',
    text: 'text-emerald-800',
    border: 'border-emerald-500',
    focusRing: 'focus:ring-emerald-500',
    gradient: 'from-emerald-600 to-teal-500',
    shadow: 'shadow-emerald-600/20',
    bgSoft: 'bg-emerald-200/50',
    borderSoft: 'border-emerald-300',
    bgPage: 'bg-gradient-to-br from-stone-100 via-emerald-50 to-emerald-100',
    bodyText: 'text-stone-800',
    mutedText: 'text-stone-500',
    cardBg: 'bg-white/60 backdrop-blur-md',
    modalBg: 'bg-stone-50',
    inputBg: 'bg-white/80',
    borderColor: 'border-emerald-200'
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    mode: 'light',
    primary: 'bg-purple-600',
    hover: 'hover:bg-purple-500',
    text: 'text-purple-800',
    border: 'border-purple-500',
    focusRing: 'focus:ring-purple-500',
    gradient: 'from-purple-600 to-fuchsia-500',
    shadow: 'shadow-purple-500/20',
    bgSoft: 'bg-purple-200/50',
    borderSoft: 'border-purple-300',
    bgPage: 'bg-gradient-to-br from-slate-100 via-purple-100 to-fuchsia-100',
    bodyText: 'text-slate-900',
    mutedText: 'text-slate-500',
    cardBg: 'bg-white/60 backdrop-blur-md',
    modalBg: 'bg-slate-50',
    inputBg: 'bg-white/80',
    borderColor: 'border-purple-200'
  },
  pink: {
    id: 'pink',
    name: 'Fairy Pink',
    mode: 'light',
    primary: 'bg-pink-500',
    hover: 'hover:bg-pink-400',
    text: 'text-pink-700',
    border: 'border-pink-400',
    focusRing: 'focus:ring-pink-400',
    gradient: 'from-pink-500 to-rose-400',
    shadow: 'shadow-pink-500/20',
    bgSoft: 'bg-pink-200/50',
    borderSoft: 'border-pink-300',
    bgPage: 'bg-gradient-to-br from-rose-50 via-pink-50 to-pink-100',
    bodyText: 'text-gray-800',
    mutedText: 'text-gray-500',
    cardBg: 'bg-white/60 backdrop-blur-md',
    modalBg: 'bg-rose-50',
    inputBg: 'bg-white/80',
    borderColor: 'border-pink-200'
  },
  yellow: {
    id: 'yellow',
    name: 'Electric Yellow',
    mode: 'light',
    primary: 'bg-yellow-500',
    hover: 'hover:bg-yellow-400',
    text: 'text-yellow-700',
    border: 'border-yellow-500',
    focusRing: 'focus:ring-yellow-500',
    gradient: 'from-yellow-500 to-orange-400',
    shadow: 'shadow-yellow-500/20',
    bgSoft: 'bg-yellow-200/50',
    borderSoft: 'border-yellow-300',
    bgPage: 'bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-100',
    bodyText: 'text-amber-900',
    mutedText: 'text-amber-700/60',
    cardBg: 'bg-white/60 backdrop-blur-md',
    modalBg: 'bg-orange-50',
    inputBg: 'bg-white/80',
    borderColor: 'border-yellow-200'
  }
};
