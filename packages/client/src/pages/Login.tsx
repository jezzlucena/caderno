import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../stores/authStore'
import { usePlatformStore } from '../stores/platformStore'
import { Footer } from '../components/Footer'

export function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  const { displayName, fetchSettings } = usePlatformStore()
  const navigate = useNavigate()
  const location = useLocation()

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4 animate-fade-in">
      <div className="card bg-base-100 shadow-xl w-full max-w-md ios-card animate-fade-in-up">
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
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Sign In'}
            </button>
          </form>

          <div className="divider">OR</div>

          <p className="text-center">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
