import { useState } from 'react'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { useAuthStore } from '../stores/authStore'

export function UnlockPrompt() {
  const { user, logout, unlock } = useAuthStore()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center animate-fade-in">
      <div className="card w-full max-w-md bg-base-100 shadow-xl ios-card animate-fade-in-up">
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Deriving encryption key...
                </>
              ) : (
                'Unlock'
              )}
            </button>
          </form>

          <div className="divider">or</div>

          <button className="btn btn-ghost w-full" onClick={logout}>
            Logout and Login Again
          </button>
        </div>
      </div>
    </div>
  )
}
