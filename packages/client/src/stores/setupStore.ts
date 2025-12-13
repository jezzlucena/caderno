import { create } from 'zustand'
import { setupApi } from '../lib/api'

interface SetupState {
  needsSetup: boolean | null  // null = not checked yet
  isLoading: boolean
  isChecked: boolean
  error: string | null

  // Actions
  checkSetupStatus: () => Promise<void>
  setNeedsSetup: (value: boolean) => void
}

export const useSetupStore = create<SetupState>()((set, get) => ({
  needsSetup: null,
  isLoading: false,
  isChecked: false,
  error: null,

  checkSetupStatus: async () => {
    // Don't refetch if already checked or currently loading
    if (get().isChecked || get().isLoading) return

    set({ isLoading: true, error: null })
    try {
      const { needsSetup } = await setupApi.getStatus()
      set({ needsSetup, isLoading: false, isChecked: true })
    } catch (err: any) {
      set({ error: err.message || 'Failed to check setup status', isLoading: false })
      // Default to not needing setup if we can't check (server might be down)
      set({ needsSetup: false, isChecked: true })
    }
  },

  setNeedsSetup: (value: boolean) => set({ needsSetup: value, isChecked: true })
}))
