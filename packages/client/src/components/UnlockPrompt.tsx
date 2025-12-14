import { useState, useEffect } from 'react'
import { LockClosedIcon, FingerPrintIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { useAuthStore } from '../stores/authStore'
import { useCryptoStore } from '../stores/cryptoStore'
import { passkeyApi } from '../lib/api'
import { deriveKeyFromPrf, decryptMasterKeyWithPrf, base64UrlToBuffer } from '../lib/crypto'
import { ParticleBackground } from './ParticleBackground'

export function UnlockPrompt() {
  const { user, logout, unlock } = useAuthStore()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [hasPasskeys, setHasPasskeys] = useState(false)
  const supportsPasskey = browserSupportsWebAuthn()

  // Check if user has passkeys on mount
  useEffect(() => {
    const checkPasskeys = async () => {
      if (user?.email && supportsPasskey) {
        try {
          const { hasPasskeys: has } = await passkeyApi.checkHasPasskeys(user.email)
          setHasPasskeys(has)
        } catch {
          // Silently fail
        }
      }
    }
    checkPasskeys()
  }, [user?.email, supportsPasskey])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await unlock(password)
      toast.success('Vault unlocked!')
    } catch {
      toast.error('Invalid password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasskeyUnlock = async () => {
    if (!supportsPasskey) {
      toast.error('Passkeys are not supported on this device')
      return
    }

    setIsPasskeyLoading(true)
    try {
      // Get authentication options from server (includes PRF salts)
      const { options, challengeKey, prfSalts } = await passkeyApi.getAuthenticationOptions(
        user?.email || undefined
      )

      // Build authentication options with PRF if salts are available
      let authOptionsWithPrf: any = options
      if (prfSalts && Object.keys(prfSalts).length > 0) {
        const firstSalt = Object.values(prfSalts)[0]
        const prfSaltBuffer = base64UrlToBuffer(firstSalt)
        const baseOptions = options as Record<string, unknown>

        authOptionsWithPrf = {
          ...baseOptions,
          extensions: {
            ...((baseOptions.extensions as Record<string, unknown>) || {}),
            prf: {
              eval: {
                first: prfSaltBuffer
              }
            }
          }
        }
      }

      // Start WebAuthn authentication with PRF
      const authResponse = await startAuthentication({
        optionsJSON: authOptionsWithPrf as Parameters<typeof startAuthentication>[0]['optionsJSON']
      })

      // Verify with server and get encrypted key data
      const result = await passkeyApi.verifyAuthentication(challengeKey, authResponse)

      // Try to decrypt master key using PRF result
      if (result.encryptedMasterKey && result.masterKeyIv && result.prfSalt) {
        const prfResult = (authResponse as any).clientExtensionResults?.prf?.results?.first
        if (prfResult) {
          // Derive key from PRF output
          const prfKey = await deriveKeyFromPrf(prfResult)

          // Decrypt master key
          const masterKey = await decryptMasterKeyWithPrf(
            result.encryptedMasterKey,
            result.masterKeyIv,
            prfKey
          )

          // Set the decrypted key in crypto store
          useCryptoStore.getState().setKey(masterKey)
          toast.success('Vault unlocked with passkey!')
        } else {
          toast.error('Passkey does not have encryption key backup. Please use your password.')
        }
      } else {
        toast.error('Passkey does not have encryption key backup. Please use your password.')
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Passkey authentication was cancelled')
      } else {
        toast.error(err.message || 'Passkey unlock failed')
      }
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200/10 flex items-center justify-center animate-fade-in relative">
      <ParticleBackground colorScheme="purple" />
      <div className="card w-full max-w-md bg-base-100/90 backdrop-blur-lg shadow-xl ios-card animate-fade-in-up relative z-10">
        <div className="card-body">
          <div className="flex items-center justify-center mb-4">
            <LockClosedIcon className="h-12 w-12 text-primary" />
          </div>
          <h2 className="card-title justify-center">Unlock Your Vault</h2>
          <p className="text-center text-base-content/70 mb-4">
            Enter your password to decrypt your journal entries.
          </p>
          <p className="text-center text-sm text-base-content/50 mb-4">
            Logged in as: {user?.email}
          </p>

          <form onSubmit={handleUnlock}>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full ios-button"
              disabled={isLoading || isPasskeyLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
                  Deriving encryption key...
                </>
              ) : (
                'Unlock with Password'
              )}
            </button>
          </form>

          {supportsPasskey && hasPasskeys && (
            <>
              <div className="divider">or</div>

              <button
                type="button"
                className="btn btn-outline w-full gap-2"
                onClick={handlePasskeyUnlock}
                disabled={isLoading || isPasskeyLoading}
              >
                {isPasskeyLoading ? (
                  <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
                ) : (
                  <FingerPrintIcon className="h-5 w-5" aria-hidden="true" />
                )}
                {isPasskeyLoading ? 'Authenticating...' : 'Unlock with Passkey'}
              </button>
            </>
          )}

          <div className="divider">or</div>

          <button className="btn btn-ghost w-full" onClick={logout} disabled={isLoading || isPasskeyLoading}>
            Logout and Login Again
          </button>
        </div>
      </div>
    </div>
  )
}
