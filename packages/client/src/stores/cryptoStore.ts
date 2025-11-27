import { create } from 'zustand'
import { deriveKey } from '../lib/crypto'

interface CryptoState {
  encryptionKey: CryptoKey | null
  isKeyReady: boolean

  // Actions
  deriveAndSetKey: (password: string, keySalt: string) => Promise<void>
  clearKey: () => void
}

export const useCryptoStore = create<CryptoState>((set) => ({
  encryptionKey: null,
  isKeyReady: false,

  deriveAndSetKey: async (password: string, keySalt: string) => {
    try {
      const key = await deriveKey(password, keySalt)
      set({ encryptionKey: key, isKeyReady: true })
    } catch (error) {
      console.error('Failed to derive encryption key:', error)
      throw error
    }
  },

  clearKey: () => {
    set({ encryptionKey: null, isKeyReady: false })
  }
}))
