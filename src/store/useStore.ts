import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
}

interface JournalState {
  entries: JournalEntry[];
  currentEntryId: string | null;
  addEntry: (title: string) => void;
  updateEntry: (id: string, content: string, title?: string, summary?: string) => void;
  deleteEntry: (id: string) => void;
  setCurrentEntry: (id: string | null) => void;
  getCurrentEntry: () => JournalEntry | null;
  exportEntries: () => JournalEntry[];
  importEntries: (entries: JournalEntry[], merge?: boolean) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [
        {
          id: '1',
          title: 'Welcome to Agenda',
          content: '<h1>Welcome to Agenda</h1><p>Start writing your notes here...</p>',
          summary: 'Welcome to Agenda',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      currentEntryId: null,
      addEntry: (title: string) => {
        const newEntry: JournalEntry = {
          id: Date.now().toString(),
          title,
          content: '<p>Start writing...</p>',
          summary: 'Start writing...',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          entries: [newEntry, ...state.entries],
          currentEntryId: newEntry.id,
        }));
      },
      updateEntry: (id: string, content: string, title?: string, summary?: string) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  content,
                  ...(title && { title }),
                  ...(summary && { summary }),
                  updatedAt: Date.now()
                }
              : entry
          ),
        }));
      },
      deleteEntry: (id: string) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
          currentEntryId: state.currentEntryId === id ? null : state.currentEntryId,
        }));
      },
      setCurrentEntry: (id: string | null) => set({ currentEntryId: id }),
      getCurrentEntry: () => {
        const state = get();
        return state.entries.find((entry) => entry.id === state.currentEntryId) || null;
      },
      exportEntries: () => {
        return get().entries;
      },
      importEntries: (entries: JournalEntry[], merge = false) => {
        const newEntries = entries.map(e => { e.id = Date.now().toString(); return e });
        set((state) => ({
          entries: merge
            ? [...newEntries, ...state.entries.filter(e => !entries.find(ne => ne.id === e.id))]
            : entries,
          currentEntryId: null,
        }));
      },
    }),
    {
      name: 'agenda-journal-storage',
    }
  )
);
