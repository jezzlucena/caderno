import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { FingerPrintIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import { useCryptoStore } from '../stores/cryptoStore'
import { usePlatformStore } from '../stores/platformStore'
import { passkeyApi } from '../lib/api'
import { deriveKeyFromPrf, decryptMasterKeyWithPrf, base64UrlToBuffer } from '../lib/crypto'
import { Footer } from '../components/Footer'
import { ParticleBackground } from '../components/ParticleBackground'

export function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const { login, loginWithPasskey, isLoading } = useAuthStore()
  const { displayName, fetchSettings } = usePlatformStore()
  const navigate = useNavigate()
  const location = useLocation()

  const supportsPasskey = browserSupportsWebAuthn()

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(emailOrUsername, password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    }
  }

  const handlePasskeyLogin = async () => {
    if (!supportsPasskey) {
      toast.error('Passkeys are not supported on this device')
      return
    }

    setIsPasskeyLoading(true)
    try {
      // Get authentication options from server (includes PRF salts if available)
      const { options, challengeKey, prfSalts } = await passkeyApi.getAuthenticationOptions(
        emailOrUsername || undefined
      )

      // Build authentication options with PRF if salts are available
      let authOptionsWithPrf: any = options
      if (prfSalts && Object.keys(prfSalts).length > 0) {
        // Use the first PRF salt (user will select the passkey)
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

      // Verify with server and get auth token + encrypted key data
      const result = await passkeyApi.verifyAuthentication(challengeKey, authResponse)

      // Store auth data
      loginWithPasskey(result)

      // Try to decrypt master key if we have PRF result and encrypted key
      let keyDecrypted = false
      if (result.encryptedMasterKey && result.masterKeyIv && result.prfSalt) {
        try {
          // Get PRF result from authentication response
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
            keyDecrypted = true
          }
        } catch (prfError) {
          console.warn('PRF key decryption failed:', prfError)
        }
      }

      if (keyDecrypted) {
        toast.success('Welcome back! Encryption key restored.')
      } else {
        toast.success('Welcome back! Enter password to unlock encrypted data.')
      }

      navigate(from, { replace: true })
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Passkey authentication was cancelled')
      } else {
        toast.error(err.message || 'Passkey authentication failed')
      }
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200/10 p-4 animate-fade-in relative">
      <ParticleBackground colorScheme="purple" />
      <main id="main-content" className="card bg-base-100/90 backdrop-blur-lg shadow-xl w-full max-w-md ios-card animate-fade-in-up relative z-10">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-4">Sign in to {displayName}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email or Username</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full ios-button"
              disabled={isLoading || isPasskeyLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Sign In'}
            </button>
          </form>

          {supportsPasskey && (
            <>
              <div className="divider">OR</div>

              <button
                type="button"
                className="btn btn-outline w-full gap-2"
                onClick={handlePasskeyLogin}
                disabled={isLoading || isPasskeyLoading}
              >
                {isPasskeyLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <FingerPrintIcon className="h-5 w-5" />
                )}
                Sign in with Passkey
              </button>
            </>
          )}

          <div className="divider"></div>

          <p className="text-center">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary">
              Sign up
            </Link>
          </p>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
