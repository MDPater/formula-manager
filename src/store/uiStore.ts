import { create } from 'zustand';

type UiTheme = 'dark' | 'light';

type UiState = {
    theme: UiTheme;
    setTheme: (theme: UiTheme) => void;
    toggleTheme: () => void;
    hydrateTheme: () => void;
};

const STORAGE_KEY = 'apex-gp-theme';

function applyTheme(theme: UiTheme) {
    if (typeof document === 'undefined') return;

    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
}

function getStoredTheme(): UiTheme {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
}

export const useUiStore = create<UiState>((set, get) => ({
    theme: 'dark',

    setTheme: (theme) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, theme);
        }
        applyTheme(theme);
        set({ theme });
    },

    toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
    },

    hydrateTheme: () => {
        const theme = getStoredTheme();
        applyTheme(theme);
        set({ theme });
    },
}));