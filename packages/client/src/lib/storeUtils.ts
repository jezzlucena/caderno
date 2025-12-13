import { ApiError } from './api'

/**
 * Extract a user-friendly error message from caught errors
 * Replaces: error instanceof ApiError ? error.message : 'Failed to X'
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

/**
 * Type-safe store state interface for error/loading state
 */
export interface AsyncStoreState {
  isLoading: boolean
  error: string | null
}

/**
 * Create a wrapper for async store actions that handles loading/error state
 *
 * Usage:
 * ```
 * fetchEntries: async () => {
 *   return asyncAction(
 *     set,
 *     async () => {
 *       const entries = await api.getEntries()
 *       set({ entries })
 *     },
 *     'Failed to fetch entries'
 *   )
 * }
 * ```
 */
export async function asyncAction<T extends AsyncStoreState>(
  set: (partial: Partial<T>) => void,
  action: () => Promise<void>,
  errorFallback: string
): Promise<void> {
  set({ isLoading: true, error: null } as Partial<T>)
  try {
    await action()
    set({ isLoading: false } as Partial<T>)
  } catch (error) {
    set({
      error: getErrorMessage(error, errorFallback),
      isLoading: false
    } as Partial<T>)
    throw error
  }
}
