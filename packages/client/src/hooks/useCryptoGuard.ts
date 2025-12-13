import { useCryptoStore } from '../stores/cryptoStore'

/**
 * Guard function for use in store actions
 * Returns the encryption key or sets an error on the provided setter
 *
 * Usage in stores:
 * ```
 * const key = getEncryptionKeyOrError((err) => set({ error: err }))
 * if (!key) return
 * ```
 */
export function getEncryptionKeyOrError(
  setError: (error: string) => void
): CryptoKey | null {
  const { encryptionKey } = useCryptoStore.getState()
  if (!encryptionKey) {
    setError('Encryption key not available')
    return null
  }
  return encryptionKey
}

/**
 * Guard function that throws if encryption key is not available
 * Use in contexts where you want to propagate the error
 */
export function requireEncryptionKey(): CryptoKey {
  const { encryptionKey } = useCryptoStore.getState()
  if (!encryptionKey) {
    throw new Error('Encryption key not available')
  }
  return encryptionKey
}

/**
 * Check if encryption key is ready (non-throwing)
 */
export function isEncryptionReady(): boolean {
  const { encryptionKey, isKeyReady } = useCryptoStore.getState()
  return isKeyReady && encryptionKey !== null
}
