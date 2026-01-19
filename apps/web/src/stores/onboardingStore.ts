import { create } from 'zustand';
import { api, OnboardingStatus } from '../lib/api';

interface OnboardingState {
  status: OnboardingStatus | null;
  currentStep: number;
  isLoading: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  setStep: (step: number) => void;
  completeOnboarding: (instanceName?: string) => Promise<void>;
  clearError: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  status: null,
  currentStep: 0,
  isLoading: false,
  error: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.getOnboardingStatus();
      set({
        status,
        currentStep: status.currentStep,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch onboarding status',
        isLoading: false,
      });
    }
  },

  setStep: (step) => set({ currentStep: step }),

  completeOnboarding: async (instanceName) => {
    set({ isLoading: true, error: null });
    try {
      await api.completeOnboarding({ instanceName });
      set((state) => ({
        status: state.status ? { ...state.status, isComplete: true } : null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to complete onboarding',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
