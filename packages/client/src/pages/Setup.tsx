import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../stores/authStore'
import { useSetupStore } from '../stores/setupStore'
import { authApi } from '../lib/api'
import { Footer } from '../components/Footer'
import { ParticleBackground } from '../components/ParticleBackground'

export function Setup() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameError, setUsernameError] = useState('')
  const { setupAdmin, isLoading } = useAuthStore()
  const { setNeedsSetup } = useSetupStore()
  const navigate = useNavigate()

  // Debounced username availability check
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null)
      setUsernameError('')
      return
    }

    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameAvailable(null)
      setUsernameError('')
      return
    }

    setCheckingUsername(true)
    try {
      const result = await authApi.checkUsernamePublic(value)
      setUsernameAvailable(result.available)
      if (!result.available && result.reason) {
        setUsernameError(result.reason)
      } else {
        setUsernameError('')
      }
    } catch {
      setUsernameAvailable(null)
      setUsernameError('')
    } finally {
      setCheckingUsername(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(username)
    }, 300)
    return () => clearTimeout(timer)
  }, [username, checkUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Username validation
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    if (username.length > 20) {
      toast.error('Username must be at most 20 characters')
      return
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      toast.error('Username can only contain lowercase letters, numbers, and underscores')
      return
    }

    if (usernameAvailable === false) {
      toast.error(usernameError || 'Username is not available')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      await setupAdmin(email, password, username)
      setNeedsSetup(false)
      toast.success('Admin account created successfully!')
      navigate('/', { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'Setup failed')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4 animate-fade-in relative">
      <ParticleBackground colorScheme="purple" />
      <div className="card bg-base-100/95 backdrop-blur-sm shadow-xl w-full max-w-md ios-card animate-fade-in-up relative z-10">
        <div className="card-body">
          <div className="text-center mb-2">
            <div className="text-5xl mb-4">
              <span role="img" aria-label="notebook">&#128221;</span>
            </div>
            <h1 className="card-title text-2xl justify-center">Welcome to Caderno</h1>
            <p className="text-base-content/70 mt-2">
              Create your administrator account to get started
            </p>
          </div>

          <div className="divider"></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Admin Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="admin@example.com"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Admin Username</span>
              </label>
              <div className="relative flex items-center">
                <span className="flex items-center justify-center px-3 h-10 bg-base-200 border border-r-0 border-base-300 rounded-l-lg text-base-content/70 font-medium">@</span>
                <input
                  type="text"
                  className={`input input-bordered w-full rounded-l-none ${
                    usernameAvailable === true ? 'input-success' :
                    usernameAvailable === false ? 'input-error' : ''
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-z0-9_]+$"
                  disabled={isLoading}
                  placeholder="admin_username"
                />
                {checkingUsername && (
                  <span className="absolute right-3 top-3 loading loading-spinner loading-sm"></span>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <span className="absolute right-3 top-3 text-success">&#10003;</span>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <span className="absolute right-3 top-3 text-error">&#10007;</span>
                )}
              </div>
              <span className="label pt-2">
                {checkingUsername ? (
                  <span className="label-text-alt text-base-content/70">Checking availability...</span>
                ) : usernameAvailable === true ? (
                  <span className="label-text-alt text-success">Username is available</span>
                ) : usernameAvailable === false ? (
                  <span className="label-text-alt text-error">{usernameError}</span>
                ) : (
                  <span className="label-text-alt">3-20 characters, lowercase letters, numbers, and underscores only</span>
                )}
              </span>
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
                minLength={8}
                disabled={isLoading}
                placeholder="8+ characters"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full ios-button"
              disabled={isLoading || checkingUsername || usernameAvailable === false}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-base-200 rounded-lg">
            <p className="text-sm text-base-content/70 text-center">
              <span className="font-semibold">Note:</span> This account will have full administrative privileges to manage your Caderno instance.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
