import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  subscription?: {
    planId: string
    status: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: User) => void
  hasPaidSubscription: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (user) => {
        set({ user })
      },

      hasPaidSubscription: () => {
        const { user } = get()
        return (
          user?.subscription?.planId !== 'free' &&
          user?.subscription?.planId !== undefined &&
          user?.subscription?.status === 'active'
        )
      },
    }),
    {
      name: 'caderno-auth-storage',
    }
  )
)
