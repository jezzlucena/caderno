import { useState, useEffect, useCallback, useRef } from 'react'

interface ValidationResult {
  available: boolean
  reason?: string
}

interface UseDebouncedValidationOptions {
  /** Async validation function */
  validate: (value: string) => Promise<ValidationResult>
  /** Minimum length before validation triggers (default: 3) */
  minLength?: number
  /** Regex pattern the value must match before validation */
  pattern?: RegExp
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
  /** Value to skip validation for (e.g., current username) */
  skipValue?: string
}

interface UseDebouncedValidationReturn {
  /** Whether validation is currently in progress */
  isChecking: boolean
  /** Whether the value is available (null = not yet checked) */
  isAvailable: boolean | null
  /** Error message if validation failed */
  error: string
  /** Manually trigger validation for a value */
  checkValue: (value: string) => void
  /** Reset the validation state */
  reset: () => void
}

/**
 * Hook for debounced async validation (e.g., username/email availability)
 *
 * Usage:
 * ```tsx
 * const { isChecking, isAvailable, error, checkValue } = useDebouncedValidation({
 *   validate: async (value) => authApi.checkUsername(value),
 *   minLength: 3,
 *   pattern: /^[a-z0-9_]+$/,
 *   debounceMs: 300
 * })
 *
 * useEffect(() => {
 *   checkValue(username)
 * }, [username, checkValue])
 * ```
 */
export function useDebouncedValidation({
  validate,
  minLength = 3,
  pattern,
  debounceMs = 300,
  skipValue
}: UseDebouncedValidationOptions): UseDebouncedValidationReturn {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsChecking(false)
    setIsAvailable(null)
    setError('')
  }, [])

  const checkValue = useCallback((value: string) => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Reset if value matches skip value
    if (skipValue && value === skipValue) {
      setIsAvailable(null)
      setError('')
      setIsChecking(false)
      return
    }

    // Reset if too short
    if (!value || value.length < minLength) {
      setIsAvailable(null)
      setError('')
      setIsChecking(false)
      return
    }

    // Reset if pattern doesn't match
    if (pattern && !pattern.test(value)) {
      setIsAvailable(null)
      setError('')
      setIsChecking(false)
      return
    }

    // Schedule validation
    timerRef.current = setTimeout(async () => {
      setIsChecking(true)
      abortControllerRef.current = new AbortController()

      try {
        const result = await validate(value)
        // Only update state if this request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setIsAvailable(result.available)
          setError(result.available ? '' : (result.reason || 'Not available'))
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        // Only update state if this request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setIsAvailable(null)
          setError('')
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsChecking(false)
        }
      }
    }, debounceMs)
  }, [validate, minLength, pattern, debounceMs, skipValue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return { isChecking, isAvailable, error, checkValue, reset }
}
