import { create } from 'zustand';
import { api, UserPreferences } from '../lib/api';

interface SettingsState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;

  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: UserPreferences['theme']) => void;
  setLanguage: (language: UserPreferences['language']) => void;
  clearError: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  editorFontSize: 16,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  preferences: defaultPreferences,
  isLoading: false,
  error: null,

  fetchPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const { preferences } = await api.getPreferences();
      set({ preferences, isLoading: false });

      // Apply theme
      get().setTheme(preferences.theme);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch preferences',
        isLoading: false,
      });
    }
  },

  updatePreferences: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { preferences } = await api.updatePreferences(data);
      set({ preferences, isLoading: false });

      // Apply theme if changed
      if (data.theme) {
        get().setTheme(data.theme);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update preferences',
        isLoading: false,
      });
      throw error;
    }
  },

  setTheme: (theme) => {
    // Update preferences state
    set((state) => ({
      preferences: { ...state.preferences, theme },
    }));

    // Apply theme to DOM
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  },

  setLanguage: (language) => {
    set((state) => ({
      preferences: { ...state.preferences, language },
    }));
  },

  clearError: () => set({ error: null }),
}));

// Initialize theme from system preference on load
if (typeof window !== 'undefined') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  document.documentElement.classList.toggle('dark', prefersDark.matches);

  prefersDark.addEventListener('change', (e) => {
    const { preferences } = useSettingsStore.getState();
    if (preferences.theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  });
}
