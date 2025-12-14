import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme

  setTheme: (theme: ThemePreference) => void
  initTheme: () => void
  syncFromUser: (userTheme: ThemePreference) => void
}

// Map theme preference to DaisyUI theme name
const THEME_MAP: Record<ResolvedTheme, string> = {
  light: 'corporate',
  dark: 'business'
}

// Get the system's preferred color scheme
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Resolve theme preference to actual theme
function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme()
  }
  return preference
}

// Apply theme to document
function applyTheme(resolvedTheme: ResolvedTheme) {
  const daisyTheme = THEME_MAP[resolvedTheme]
  document.documentElement.setAttribute('data-theme', daisyTheme)
}

// Set up listener for system theme changes
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme: ThemePreference) => {
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ theme, resolvedTheme })
      },

      initTheme: () => {
        const { theme } = get()
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ resolvedTheme })

        // Set up system theme change listener
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

          // Remove existing listener if any
          if (mediaQueryListener) {
            mediaQuery.removeEventListener('change', mediaQueryListener)
          }

          // Add new listener
          mediaQueryListener = (e: MediaQueryListEvent) => {
            const { theme } = get()
            if (theme === 'system') {
              const newResolvedTheme: ResolvedTheme = e.matches ? 'dark' : 'light'
              applyTheme(newResolvedTheme)
              set({ resolvedTheme: newResolvedTheme })
            }
          }
          mediaQuery.addEventListener('change', mediaQueryListener)
        }
      },

      // Sync theme from user data (when user logs in or page loads with auth)
      syncFromUser: (userTheme: ThemePreference) => {
        const { theme } = get()
        // Only update if different from current localStorage value
        if (userTheme !== theme) {
          const resolvedTheme = resolveTheme(userTheme)
          applyTheme(resolvedTheme)
          set({ theme: userTheme, resolvedTheme })
        }
      }
    }),
    {
      name: 'caderno-theme',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)
