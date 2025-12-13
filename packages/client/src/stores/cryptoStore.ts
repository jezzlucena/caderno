import { create } from 'zustand'
import { deriveKey } from '../lib/crypto'

interface CryptoState {
  encryptionKey: CryptoKey | null
  isKeyReady: boolean

  // Actions
  deriveAndSetKey: (password: string, keySalt: string) => Promise<void>
  setKey: (key: CryptoKey) => void
  getKey: () => CryptoKey | null
  clearKey: () => void
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
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

  // Set key directly (used for passkey-decrypted keys)
  setKey: (key: CryptoKey) => {
    set({ encryptionKey: key, isKeyReady: true })
  },

  // Get current key (for passkey encryption)
  getKey: () => get().encryptionKey,

  clearKey: () => {
    set({ encryptionKey: null, isKeyReady: false })
  }
}))
