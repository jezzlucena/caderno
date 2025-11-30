import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlusIcon, UserMinusIcon, ClockIcon } from '@heroicons/react/24/outline'
import { profileApi, ApiError } from '../lib/api'

interface FollowButtonProps {
  username: string
  isFollowing: boolean
  isPending: boolean
  isRestricted: boolean
  isAuthenticated?: boolean
  onFollowChange: () => void
}

export function FollowButton({ username, isFollowing, isPending, isRestricted, isAuthenticated = true, onFollowChange }: FollowButtonProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFollow = async () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      await profileApi.follow(username)
      onFollowChange()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to follow user')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfollow = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await profileApi.unfollow(username)
      onFollowChange()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to unfollow user')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isFollowing) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          className="btn btn-outline btn-sm gap-1"
          onClick={handleUnfollow}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <UserMinusIcon className="h-4 w-4" />
          )}
          Unfollow
        </button>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          className="btn btn-outline btn-sm gap-1"
          onClick={handleUnfollow}
          disabled={isLoading}
          title="Cancel follow request"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <ClockIcon className="h-4 w-4" />
          )}
          Pending
        </button>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        className="btn btn-primary btn-sm gap-1"
        onClick={handleFollow}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <UserPlusIcon className="h-4 w-4" />
        )}
        {isRestricted ? 'Request to Follow' : 'Follow'}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}
