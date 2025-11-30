import { create } from 'zustand'
import { platformApi } from '../lib/api'

interface PlatformState {
  displayName: string
  isLoaded: boolean
  isLoading: boolean
  error: string | null

  // Actions
  fetchSettings: () => Promise<void>
  setDisplayName: (name: string) => void
}

export const usePlatformStore = create<PlatformState>()((set, get) => ({
  displayName: 'Caderno',
  isLoaded: false,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    // Don't refetch if already loaded or currently loading
    if (get().isLoaded || get().isLoading) return

    set({ isLoading: true, error: null })
    try {
      const settings = await platformApi.getSettings()
      set({ displayName: settings.displayName, isLoaded: true, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load platform settings', isLoading: false })
    }
  },

  setDisplayName: (name: string) => set({ displayName: name })
}))
