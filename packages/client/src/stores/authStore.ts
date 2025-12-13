import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, setupApi, type User, type UpdateProfileData, type PasskeyAuthResponse } from '../lib/api'
import { useCryptoStore } from './cryptoStore'
import { getErrorMessage } from '../lib/storeUtils'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null

  // Actions
  register: (email: string, password: string, username: string, profileVisibility: 'public' | 'restricted' | 'private') => Promise<void>
  setupAdmin: (email: string, password: string, username: string) => Promise<void>
  login: (emailOrUsername: string, password: string) => Promise<void>
  loginWithPasskey: (authResponse: PasskeyAuthResponse) => void
  unlock: (password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  setUser: (user: User) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      register: async (email: string, password: string, username: string, profileVisibility: 'public' | 'restricted' | 'private') => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await authApi.register(email, password, username, profileVisibility)
          // Derive encryption key from password
          await useCryptoStore.getState().deriveAndSetKey(password, user.keySalt)
          set({ user, token, isLoading: false })
        } catch (error) {
          set({ error: getErrorMessage(error, 'Registration failed'), isLoading: false })
          throw error
        }
      },

      setupAdmin: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await setupApi.createAdmin(email, password, username)
          // Derive encryption key from password
          await useCryptoStore.getState().deriveAndSetKey(password, user.keySalt)
          set({ user, token, isLoading: false })
        } catch (error) {
          set({ error: getErrorMessage(error, 'Setup failed'), isLoading: false })
          throw error
        }
      },

      login: async (emailOrUsername: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await authApi.login(emailOrUsername, password)
          // Derive encryption key from password
          await useCryptoStore.getState().deriveAndSetKey(password, user.keySalt)
          set({ user, token, isLoading: false })
        } catch (error) {
          set({ error: getErrorMessage(error, 'Login failed'), isLoading: false })
          throw error
        }
      },

      // Login with passkey - key may be decrypted via PRF or user needs to unlock
      loginWithPasskey: ({ user, token }: PasskeyAuthResponse) => {
        // Don't clear key here - it may have been set by PRF decryption in Login.tsx
        // If PRF decryption failed, the key will still be null
        set({ user, token, isLoading: false, error: null })
      },

      // Unlock encryption after page refresh (re-derive key from password)
      unlock: async (password: string) => {
        const { user } = get()
        if (!user) throw new Error('Not authenticated')

        set({ isLoading: true, error: null })
        try {
          // Verify password with server first
          await authApi.verifyPassword(password)
          // If password is correct, derive the encryption key
          await useCryptoStore.getState().deriveAndSetKey(password, user.keySalt)
          set({ isLoading: false })
        } catch (error) {
          set({ error: 'Invalid password', isLoading: false })
          throw error
        }
      },

      logout: () => {
        useCryptoStore.getState().clearKey()
        set({ user: null, token: null, error: null })
      },

      checkAuth: async () => {
        const { token, user, isLoading } = get()
        // Skip if no token, already loading, or already have user data
        if (!token || isLoading || user) return

        set({ isLoading: true })
        try {
          const { user } = await authApi.me(token)
          set({ user, isLoading: false })
        } catch {
          // Token invalid, clear auth state
          useCryptoStore.getState().clearKey()
          set({ user: null, token: null, isLoading: false })
        }
      },

      updateProfile: async (data: UpdateProfileData) => {
        set({ isLoading: true, error: null })
        try {
          const { user } = await authApi.updateProfile(data)
          set({ user, isLoading: false })
        } catch (error) {
          set({ error: getErrorMessage(error, 'Failed to update profile'), isLoading: false })
          throw error
        }
      },

      setUser: (user: User) => set({ user }),

      clearError: () => set({ error: null })
    }),
    {
      name: 'caderno-auth',
      partialize: (state) => ({ token: state.token })
    }
  )
)
