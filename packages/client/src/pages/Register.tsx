import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profilePublic, setProfilePublic] = useState(false)
  const [validationError, setValidationError] = useState('')
  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Username validation
    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters')
      return
    }

    if (username.length > 20) {
      setValidationError('Username must be at most 20 characters')
      return
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setValidationError('Username can only contain lowercase letters, numbers, and underscores')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return
    }

    try {
      await register(email, password, username, profilePublic)
      navigate('/', { replace: true })
    } catch {
      // Error is handled in store
    }
  }

  const displayError = validationError || error

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4 animate-fade-in">
      <div className="card bg-base-100 shadow-xl w-full max-w-md ios-card animate-fade-in-up">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-4">Create Account</h1>

          {displayError && (
            <div className="alert alert-error mb-4">
              <span>{displayError}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setValidationError('')
                  clearError()
                }}
              >
                &times;
              </button>
            </div>
          )}

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
              <input
                type="text"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                minLength={3}
                maxLength={20}
                pattern="^[a-z0-9_]+$"
                disabled={isLoading}
                placeholder="3-20 characters, lowercase letters, numbers, and underscores only"
              />
              <label className="label">
                <span className="label-text-alt">Username</span>
              </label>
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
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={profilePublic}
                  onChange={(e) => setProfilePublic(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="label-text">Make my profile public</span>
              </label>
              <span className="label pt-0">
                <span className="label-text-alt">Public profiles show your username and activity stats</span>
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full ios-button"
              disabled={isLoading}
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

      <footer className="mt-8 text-center text-sm text-base-content/60">
        <Link to="/about" className="link link-hover mx-2">About</Link>
        <span>·</span>
        <Link to="/terms" className="link link-hover mx-2">Terms</Link>
        <span>·</span>
        <Link to="/privacy" className="link link-hover mx-2">Privacy</Link>
      </footer>
    </div>
  )
}
