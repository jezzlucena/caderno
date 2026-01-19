import { create } from 'zustand';
import { api, Entry, CreateEntryInput, UpdateEntryInput, PaginatedResponse } from '../lib/api';

interface EntriesState {
  entries: Entry[];
  currentEntry: Entry | null;
  pagination: PaginatedResponse<Entry>['pagination'] | null;
  tags: string[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  // Filters
  filters: {
    search: string;
    tags: string[];
    sortBy: 'createdAt' | 'updatedAt' | 'title';
    sortOrder: 'asc' | 'desc';
  };

  fetchEntries: (page?: number) => Promise<void>;
  fetchEntry: (id: string) => Promise<void>;
  createEntry: (data: CreateEntryInput) => Promise<Entry>;
  updateEntry: (id: string, data: UpdateEntryInput) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  fetchTags: () => Promise<void>;
  setFilters: (filters: Partial<EntriesState['filters']>) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearCurrentEntry: () => void;
  clearError: () => void;
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  currentEntry: null,
  pagination: null,
  tags: [],
  isLoading: false,
  isSearching: false,
  error: null,
  filters: {
    search: '',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },

  fetchEntries: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params: Record<string, string> = {
        page: String(page),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      if (filters.search) params.search = filters.search;
      if (filters.tags.length) params.tags = filters.tags.join(',');

      const response = await api.listEntries(params);
      set({
        entries: response.items,
        pagination: response.pagination,
        isLoading: false,
        isSearching: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch entries',
        isLoading: false,
        isSearching: false,
      });
    }
  },

  fetchEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await api.getEntry(id);
      set({ currentEntry: entry, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch entry',
        isLoading: false,
      });
    }
  },

  createEntry: async (data: CreateEntryInput) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await api.createEntry(data);
      set((state) => ({
        entries: [entry, ...state.entries],
        isLoading: false,
      }));
      return entry;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create entry',
        isLoading: false,
      });
      throw error;
    }
  },

  updateEntry: async (id: string, data: UpdateEntryInput) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await api.updateEntry(id, data);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? entry : e)),
        currentEntry: entry,
        isLoading: false,
      }));
      return entry;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update entry',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteEntry(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete entry',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchTags: async () => {
    try {
      const { tags } = await api.getTags();
      set({ tags });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setIsSearching: (isSearching) => set({ isSearching }),

  clearCurrentEntry: () => set({ currentEntry: null }),

  clearError: () => set({ error: null }),
}));
