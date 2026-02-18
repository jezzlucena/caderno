import { create } from 'zustand';
import { startAuthentication } from '@simplewebauthn/browser';
import { api, User } from '../lib/api';

interface AuthMethods {
  password: boolean;
  passkey: boolean;
  magicLink: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  getAuthMethods: (email: string) => Promise<AuthMethods>;
  requestMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  loginWithPasskey: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await api.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await api.register(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshAuth: async () => {
    set({ isLoading: true });
    try {
      const { user } = await api.refreshToken();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  getAuthMethods: async (email: string) => {
    return api.getAuthMethods(email);
  },

  requestMagicLink: async (email: string) => {
    await api.requestMagicLink(email);
  },

  verifyMagicLink: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await api.verifyMagicLink(token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Magic link verification failed',
        isLoading: false,
      });
      throw error;
    }
  },

  loginWithPasskey: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const options = await api.getPasskeyLoginOptions(email);
      const response = await startAuthentication({ optionsJSON: options });
      const { user } = await api.verifyPasskeyLogin(email, response);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Passkey login failed',
        isLoading: false,
      });
      throw error;
    }
  },
}));
