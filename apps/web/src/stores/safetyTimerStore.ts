import { create } from 'zustand';
import {
  api,
  SafetyTimerStatus,
  CreateRecipientInput,
  CreateReminderInput,
  UpdateSafetyTimerInput,
  SmtpConfig,
} from '../lib/api';

interface SafetyTimerState {
  status: SafetyTimerStatus | null;
  isLoading: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  updateTimer: (data: UpdateSafetyTimerInput) => Promise<void>;
  checkIn: () => Promise<void>;
  addRecipient: (data: CreateRecipientInput) => Promise<void>;
  updateRecipient: (id: string, data: Partial<CreateRecipientInput>) => Promise<void>;
  deleteRecipient: (id: string) => Promise<void>;
  addReminder: (data: CreateReminderInput) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  verifySmtp: (config: SmtpConfig) => Promise<boolean>;
  sendTestEmail: (config: SmtpConfig & { recipientEmail: string }) => Promise<boolean>;
  clearError: () => void;
}

export const useSafetyTimerStore = create<SafetyTimerState>((set) => ({
  status: null,
  isLoading: false,
  error: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.getSafetyTimer();
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch safety timer status',
        isLoading: false,
      });
    }
  },

  updateTimer: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.updateSafetyTimer(data);
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update safety timer',
        isLoading: false,
      });
      throw error;
    }
  },

  checkIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.checkIn();
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to check in',
        isLoading: false,
      });
      throw error;
    }
  },

  addRecipient: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.addRecipient(data);
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add recipient',
        isLoading: false,
      });
      throw error;
    }
  },

  updateRecipient: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.updateRecipient(id, data);
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update recipient',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRecipient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.deleteRecipient(id);
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete recipient',
        isLoading: false,
      });
      throw error;
    }
  },

  addReminder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.addReminder(data);
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add reminder',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteReminder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const status = await api.deleteReminder(id);
      set({ status, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete reminder',
        isLoading: false,
      });
      throw error;
    }
  },

  verifySmtp: async (config) => {
    set({ isLoading: true, error: null });
    try {
      const { success } = await api.verifySmtp(config);
      set({ isLoading: false });
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'SMTP verification failed',
        isLoading: false,
      });
      return false;
    }
  },

  sendTestEmail: async (config) => {
    set({ isLoading: true, error: null });
    try {
      const { success } = await api.sendTestEmail(config);
      set({ isLoading: false });
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send test email',
        isLoading: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
