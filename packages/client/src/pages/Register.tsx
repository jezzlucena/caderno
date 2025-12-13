import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../lib/api'
import { Footer } from '../components/Footer'
import { ParticleBackground } from '../components/ParticleBackground'
import { useDebouncedValidation } from '../hooks/useDebouncedValidation'

export function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'restricted' | 'private'>('private')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  // Debounced username availability check using hook
  const {
    isChecking: checkingUsername,
    isAvailable: usernameAvailable,
    error: usernameError,
    checkValue: checkUsername
  } = useDebouncedValidation({
    validate: async (value) => authApi.checkUsernamePublic(value),
    minLength: 3,
    pattern: /^[a-z0-9_]+$/,
    debounceMs: 300
  })

  useEffect(() => {
    checkUsername(username)
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
      await register(email, password, username, profileVisibility)
      toast.success('Account created successfully!')
      navigate('/', { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200/10 p-4 animate-fade-in relative">
      <ParticleBackground colorScheme="purple" />
      <div className="card bg-base-100/90 backdrop-blur-lg shadow-xl w-full max-w-md ios-card animate-fade-in-up relative z-10">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-4">Create Account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
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
                  placeholder="3-20 characters, lowercase letters, numbers, and underscores only"
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
              <label className="label">
                <span className="label-text-alt">Password</span>
              </label>
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

            <div className="form-control">
              <label className="label">
                <span className="label-text">Profile Visibility</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'restricted' | 'private')}
                disabled={isLoading}
              >
                <option value="private">Private - Hidden from everyone</option>
                <option value="restricted">Restricted - Visible, but data only to approved followers</option>
                <option value="public">Public - Visible to everyone</option>
              </select>
              <span className="label pt-0">
                <span className="label-text-alt">
                  {profileVisibility === 'public' && 'Your profile will be visible to everyone'}
                  {profileVisibility === 'restricted' && 'Your profile is visible, but data is only shown to approved followers'}
                  {profileVisibility === 'private' && 'Your profile will be hidden from everyone except you'}
                </span>
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full ios-button"
              disabled={isLoading || checkingUsername || usernameAvailable === false}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Create Account'}
            </button>
          </form>

          <div className="divider">OR</div>

          <p className="text-center">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
