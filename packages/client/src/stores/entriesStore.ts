import { create } from 'zustand'
import { entriesApi, type Entry, ApiError } from '../lib/api'
import { useCryptoStore } from './cryptoStore'
import { encryptEntry, decryptEntryCompat } from '../lib/crypto'

export interface DecryptedEntry {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface EntriesState {
  entries: DecryptedEntry[]
  currentEntry: DecryptedEntry | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchEntries: () => Promise<void>
  fetchEntry: (id: number) => Promise<void>
  createEntry: (title: string, content: string) => Promise<DecryptedEntry>
  updateEntry: (id: number, title: string, content: string) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
  setCurrentEntry: (entry: DecryptedEntry | null) => void
  clearError: () => void
}

// Track if fetch is in progress to prevent concurrent requests
let isFetching = false

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,

  fetchEntries: async () => {
    // Prevent concurrent fetches
    if (isFetching || get().isLoading) {
      console.log('[EntriesStore] Skipping fetch - already in progress')
      return
    }

    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      console.log('[EntriesStore] No encryption key available')
      set({ error: 'Encryption key not available' })
      return
    }

    isFetching = true
    set({ isLoading: true, error: null })
    try {
      console.log('[EntriesStore] Fetching entries from API...')
      const { entries } = await entriesApi.list()
      console.log('[EntriesStore] API returned', entries.length, 'entries:', entries)

      // Decrypt all entries
      const decryptedEntries: DecryptedEntry[] = await Promise.all(
        entries.map(async (entry: Entry) => {
          const { title, content } = await decryptEntryCompat(
            cryptoStore.encryptionKey!,
            entry.encryptedTitle,
            entry.encryptedContent,
            entry.iv
          )
          return {
            id: entry.id,
            title,
            content,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
          }
        })
      )

      console.log('[EntriesStore] Decrypted', decryptedEntries.length, 'entries')
      set({ entries: decryptedEntries, isLoading: false })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch entries'
      console.error('[EntriesStore] Failed to fetch entries:', error)
      set({ error: message, isLoading: false })
    } finally {
      isFetching = false
    }
  },

  fetchEntry: async (id: number) => {
    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      set({ error: 'Encryption key not available' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const { entry } = await entriesApi.get(id)

      const { title, content } = await decryptEntryCompat(
        cryptoStore.encryptionKey!,
        entry.encryptedTitle,
        entry.encryptedContent,
        entry.iv
      )

      const decryptedEntry: DecryptedEntry = {
        id: entry.id,
        title,
        content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }

      set({ currentEntry: decryptedEntry, isLoading: false })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch entry'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  createEntry: async (title: string, content: string) => {
    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      throw new Error('Encryption key not available')
    }

    set({ isLoading: true, error: null })
    try {
      // Encrypt the entry client-side
      const encrypted = await encryptEntry(cryptoStore.encryptionKey, title, content)

      // Send encrypted data to server
      const { entry } = await entriesApi.create(encrypted)

      const decryptedEntry: DecryptedEntry = {
        id: entry.id,
        title,
        content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }

      // Add to local state
      set((state) => ({
        entries: [decryptedEntry, ...state.entries],
        currentEntry: decryptedEntry,
        isLoading: false
      }))

      return decryptedEntry
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create entry'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  updateEntry: async (id: number, title: string, content: string) => {
    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      throw new Error('Encryption key not available')
    }

    set({ isLoading: true, error: null })
    try {
      // Encrypt the entry client-side
      const encrypted = await encryptEntry(cryptoStore.encryptionKey, title, content)

      // Send encrypted data to server
      const { entry } = await entriesApi.update(id, encrypted)

      const decryptedEntry: DecryptedEntry = {
        id: entry.id,
        title,
        content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }

      // Update local state
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? decryptedEntry : e)),
        currentEntry: decryptedEntry,
        isLoading: false
      }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update entry'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  deleteEntry: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await entriesApi.delete(id)

      // Remove from local state
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        isLoading: false
      }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete entry'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  setCurrentEntry: (entry) => set({ currentEntry: entry }),

  clearError: () => set({ error: null })
}))
