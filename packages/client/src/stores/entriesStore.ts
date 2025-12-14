import { create } from 'zustand'
import { entriesApi, type Entry } from '../lib/api'
import { useCryptoStore } from './cryptoStore'
import { encryptEntry, decryptEntryCompat } from '../lib/crypto'
import { getErrorMessage } from '../lib/storeUtils'
import { getEncryptionKeyOrError } from '../hooks/useCryptoGuard'

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
  importEntry: (title: string, content: string, createdAt: string, updatedAt: string) => Promise<DecryptedEntry>
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
    if (isFetching || get().isLoading) return

    const encryptionKey = getEncryptionKeyOrError((err) => set({ error: err }))
    if (!encryptionKey) return

    isFetching = true
    set({ isLoading: true, error: null })
    try {
      const { entries } = await entriesApi.list()

      // Decrypt all entries
      const decryptedEntries: DecryptedEntry[] = await Promise.all(
        entries.map(async (entry: Entry) => {
          const { title, content } = await decryptEntryCompat(
            encryptionKey,
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

      set({ entries: decryptedEntries, isLoading: false })
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to fetch entries'), isLoading: false })
    } finally {
      isFetching = false
    }
  },

  fetchEntry: async (id: number) => {
    const encryptionKey = getEncryptionKeyOrError((err) => set({ error: err }))
    if (!encryptionKey) return

    set({ isLoading: true, error: null })
    try {
      const { entry } = await entriesApi.get(id)

      const { title, content } = await decryptEntryCompat(
        encryptionKey,
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
      set({ error: getErrorMessage(error, 'Failed to fetch entry'), isLoading: false })
      throw error
    }
  },

  createEntry: async (title: string, content: string) => {
    const { encryptionKey } = useCryptoStore.getState()
    if (!encryptionKey) {
      throw new Error('Encryption key not available')
    }

    set({ isLoading: true, error: null })
    try {
      // Encrypt the entry client-side
      const encrypted = await encryptEntry(encryptionKey, title, content)

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
      set({ error: getErrorMessage(error, 'Failed to create entry'), isLoading: false })
      throw error
    }
  },

  importEntry: async (title: string, content: string, createdAt: string, updatedAt: string) => {
    const { encryptionKey } = useCryptoStore.getState()
    if (!encryptionKey) {
      throw new Error('Encryption key not available')
    }

    try {
      // Encrypt the entry client-side
      const encrypted = await encryptEntry(encryptionKey, title, content)

      // Send encrypted data to server with original timestamps
      const { entry } = await entriesApi.import({
        ...encrypted,
        createdAt,
        updatedAt
      })

      const decryptedEntry: DecryptedEntry = {
        id: entry.id,
        title,
        content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }

      // Add to local state (don't set as current entry during import)
      set((state) => ({
        entries: [decryptedEntry, ...state.entries]
      }))

      return decryptedEntry
    } catch (error) {
      throw error
    }
  },

  updateEntry: async (id: number, title: string, content: string) => {
    const { encryptionKey } = useCryptoStore.getState()
    if (!encryptionKey) {
      throw new Error('Encryption key not available')
    }

    set({ isLoading: true, error: null })
    try {
      // Encrypt the entry client-side
      const encrypted = await encryptEntry(encryptionKey, title, content)

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
      set({ error: getErrorMessage(error, 'Failed to update entry'), isLoading: false })
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
      set({ error: getErrorMessage(error, 'Failed to delete entry'), isLoading: false })
      throw error
    }
  },

  setCurrentEntry: (entry) => set({ currentEntry: entry }),

  clearError: () => set({ error: null })
}))
