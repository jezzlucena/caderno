import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../lib/api'
import { Navbar } from '../components/Navbar'

export function AccountSettings() {
  const { user, updateProfile, isLoading, error, clearError } = useAuthStore()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [profilePublic, setProfilePublic] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setDisplayName(user.displayName || '')
      setBio(user.bio || '')
      setProfilePublic(user.profilePublic)
    }
  }, [user])

  // Debounced username availability check
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3 || value === user?.username) {
      setUsernameAvailable(null)
      return
    }

    // Validate format first
    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const result = await authApi.checkUsername(value)
      setUsernameAvailable(result.available)
      if (!result.available && result.reason) {
        setValidationError(result.reason)
      } else {
        setValidationError('')
      }
    } catch {
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }, [user?.username])

  // Check username when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(username)
    }, 500)

    return () => clearTimeout(timer)
  }, [username, checkUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    setSuccessMessage('')
    clearError()

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

    if (usernameAvailable === false) {
      setValidationError('This username is not available')
      return
    }

    try {
      await updateProfile({
        username,
        displayName: displayName || null,
        bio: bio || null,
        profilePublic
      })
      setSuccessMessage('Profile updated successfully!')
      setUsernameAvailable(null)
    } catch {
      // Error is handled in store
    }
  }

  const displayError = validationError || error

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar currentPage="settings" />

      <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
        <div className="mb-6">
          <Link to="/" className="link link-primary">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl animate-fade-in-up">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-6">Account Settings</h1>

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

            {successMessage && (
              <div className="alert alert-success mb-4">
                <span>{successMessage}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSuccessMessage('')}
                >
                  &times;
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Username</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={`input input-bordered w-full ${
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
                <label className="label">
                  <span className="label-text-alt">
                    Username
                  </span>
                </label>
                {user?.username && profilePublic && (
                  <span className="label pt-0">
                    <span className="label-text-alt">
                      Your profile URL: <Link to={`/${user.username}`} className="font-mono text-primary underline">{import.meta.env.VITE_APP_URL}/{user.username}</Link>
                    </span>
                  </span>
                )}
              </div>

              {/* Display Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Display Name</span>
                  <span className="label-text-alt">Optional</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  placeholder="How you want to be called"
                  disabled={isLoading}
                />
              </div>

              {/* Bio */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Bio</span>
                  <span className="label-text-alt">Optional</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  placeholder="Tell us about yourself"
                  disabled={isLoading}
                />
                <label className="label">
                  <span className="label-text-alt">{bio.length}/500 characters</span>
                </label>
              </div>

              {/* Profile Visibility */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={profilePublic}
                    onChange={(e) => setProfilePublic(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="label-text font-medium">Public Profile</span>
                </label>
                <span className="label pt-0">
                  <span className="label-text-alt">
                    {profilePublic
                      ? 'Your profile is visible to everyone at /' + username
                      : 'Your profile is private and hidden from others'
                    }
                  </span>
                </span>
              </div>

              <div className="divider"></div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading || checkingUsername || usernameAvailable === false}
              >
                {isLoading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
