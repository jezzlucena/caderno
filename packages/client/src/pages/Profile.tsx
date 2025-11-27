import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { profileApi, type PublicProfile, ApiError } from '../lib/api'

export function Profile() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!username) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      try {
        const data = await profileApi.getPublicProfile(username)
        setProfile(data)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true)
        } else {
          console.error('Failed to load profile:', error)
          setNotFound(true)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [username])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        <div className="card bg-base-100 shadow-xl w-full max-w-md">
          <div className="card-body text-center">
            <h1 className="text-6xl mb-4">404</h1>
            <h2 className="card-title justify-center text-2xl mb-2">Profile Not Found</h2>
            <p className="text-base-content/70 mb-6">
              This profile doesn't exist or is set to private.
            </p>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })

  return (
    <div className="min-h-screen bg-base-200 p-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="card bg-base-100 shadow-xl animate-fade-in-up">
          <div className="card-body items-center text-center">
            {/* Avatar */}
            <div className="avatar placeholder mb-4">
              <div className="bg-primary text-primary-content rounded-full w-24">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.username} />
                ) : (
                  <span className="text-3xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Display Name & Username */}
            <h1 className="text-2xl font-bold">
              {profile.displayName || profile.username}
            </h1>
            <p className="text-base-content/60">@{profile.username}</p>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-base-content/80 max-w-md">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="stats stats-vertical sm:stats-horizontal shadow mt-6">
              <div className="stat">
                <div className="stat-title">Entries</div>
                <div className="stat-value text-primary">{profile.entryCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Switches</div>
                <div className="stat-value text-secondary">{profile.switchCount}</div>
              </div>
            </div>

            {/* Member Since */}
            <p className="mt-6 text-sm text-base-content/50">
              Member since {memberSince}
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link to="/" className="link link-primary">
            &larr; Back to Caderno
          </Link>
        </div>
      </div>
    </div>
  )
}
