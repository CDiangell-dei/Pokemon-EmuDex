export interface ThemeConfig {
    id: string;
    name: string;
    mode: 'dark' | 'light';
    primary: string;
    hover: string;
    text: string;
    border: string;
    focusRing: string;
    gradient: string;
    shadow: string;
    bgSoft: string;
    borderSoft: string;
    bgPage: string;
    bodyText: string;
    mutedText: string;
    cardBg: string;
    modalBg: string;
    inputBg: string;
    borderColor: string;
}

export const THEMES: Record<string, ThemeConfig> = {
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
