import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCryptoStore } from '../stores/cryptoStore'
import { authApi, federationApi, type FederationProfile, type FeedEntry } from '../lib/api'
import { Navbar } from '../components/Navbar'
import { UnlockPrompt } from '../components/UnlockPrompt'

type TabType = 'profile' | 'notes'

export function AccountSettings() {
  const { user, updateProfile, isLoading, error, clearError } = useAuthStore()
  const { isKeyReady } = useCryptoStore()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // Profile form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [profilePublic, setProfilePublic] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Federation state
  const [federationProfile, setFederationProfile] = useState<FederationProfile | null>(null)
  const [federationLoading, setFederationLoading] = useState(true)
  const [federationError, setFederationError] = useState<string | null>(null)

  // Setup state
  const [isSettingUp, setIsSettingUp] = useState(false)

  // Follow state
  const [followingList, setFollowingList] = useState<{ actorUrl: string; pending: boolean; since: string }[]>([])
  const [followHandle, setFollowHandle] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [lookupResult, setLookupResult] = useState<{ actorUrl: string; username: string; displayName: string | null; bio: string | null; isLocal: boolean } | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  // Feed state
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([])
  const [isFeedLoading, setIsFeedLoading] = useState(false)

  // Initialize profile form with current user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setDisplayName(user.displayName || '')
      setBio(user.bio || '')
      setProfilePublic(user.profilePublic)
    }
  }, [user])

  // Fetch federation data when key is ready
  useEffect(() => {
    if (isKeyReady) {
      fetchFederationProfile()
      fetchFollowing()
      fetchFeed()
    }
  }, [isKeyReady])

  // Debounced username availability check
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3 || value === user?.username) {
      setUsernameAvailable(null)
      return
    }

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

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(username)
    }, 500)
    return () => clearTimeout(timer)
  }, [username, checkUsername])

  // Federation API calls
  const fetchFederationProfile = async () => {
    try {
      const { profile } = await federationApi.getProfile()
      setFederationProfile(profile)
    } catch {
      setFederationError('Failed to load federation profile')
    } finally {
      setFederationLoading(false)
    }
  }

  const fetchFollowing = async () => {
    try {
      const { following } = await federationApi.getFollowing()
      setFollowingList(following)
    } catch {
      // Silently fail
    }
  }

  const fetchFeed = async () => {
    setIsFeedLoading(true)
    try {
      const { entries } = await federationApi.getFeed()
      setFeedEntries(entries)
    } catch {
      // Silently fail
    } finally {
      setIsFeedLoading(false)
    }
  }

  // Profile handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    setSuccessMessage('')
    clearError()

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
      // Error handled in store
    }
  }

  // Federation handlers
  const handleSetup = async () => {
    setIsSettingUp(true)
    setFederationError(null)

    try {
      const { profile } = await federationApi.setup()
      setFederationProfile(profile)
    } catch (err: any) {
      setFederationError(err.message || 'Failed to setup federation')
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleToggleFederation = async () => {
    if (!federationProfile) return

    try {
      await federationApi.updateProfile({
        federationEnabled: !federationProfile.federationEnabled
      })
      setFederationProfile({ ...federationProfile, federationEnabled: !federationProfile.federationEnabled })
    } catch (err: any) {
      setFederationError(err.message || 'Failed to update profile')
    }
  }

  const handleLookup = async () => {
    if (!followHandle.trim()) return

    setIsLookingUp(true)
    setLookupResult(null)
    setFederationError(null)

    try {
      const { user } = await federationApi.lookup(followHandle.trim())
      setLookupResult(user)
    } catch (err: any) {
      setFederationError(err.message || 'User not found')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleFollow = async () => {
    if (!followHandle.trim()) return

    setIsFollowing(true)
    setFederationError(null)

    try {
      const result = await federationApi.follow(followHandle.trim())
      setFollowingList([
        { actorUrl: result.following.actorUrl, pending: result.following.pending, since: new Date().toISOString() },
        ...followingList
      ])
      setFollowHandle('')
      setLookupResult(null)
      if (federationProfile) {
        setFederationProfile({ ...federationProfile, followingCount: federationProfile.followingCount + 1 })
      }
    } catch (err: any) {
      setFederationError(err.message || 'Failed to follow user')
    } finally {
      setIsFollowing(false)
    }
  }

  const handleUnfollow = async (actorUrl: string) => {
    try {
      await federationApi.unfollow(actorUrl)
      setFollowingList(followingList.filter(f => f.actorUrl !== actorUrl))
      if (federationProfile) {
        setFederationProfile({ ...federationProfile, followingCount: Math.max(0, federationProfile.followingCount - 1) })
      }
    } catch (err: any) {
      setFederationError(err.message || 'Failed to unfollow user')
    }
  }

  const isAlreadyFollowing = lookupResult && followingList.some(f => f.actorUrl === lookupResult.actorUrl)
  const displayError = validationError || error

  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar currentPage="settings" />

      <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
        <div className="mb-6">
          <Link to="/" className="link link-primary">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Tabs */}
        {import.meta.env.VITE_FEDERATION_ENABLED === 'true' && (
          <div className="tabs tabs-boxed mb-6 bg-base-100 p-1">
            <button
              className={`tab flex-1 ${activeTab === 'profile' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`tab flex-1 ${activeTab === 'notes' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card bg-base-100 shadow-xl animate-fade-in-up">
            <div className="card-body">
              <h1 className="card-title text-2xl mb-6">Profile Settings</h1>

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
                  <button className="btn btn-ghost btn-sm" onClick={() => setSuccessMessage('')}>
                    &times;
                  </button>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
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
                  {user?.username && profilePublic && (
                    <span className="label pt-2">
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
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6 animate-fade-in-up">
            {federationError && (
              <div className="alert alert-error">
                <span>{federationError}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setFederationError(null)}>Dismiss</button>
              </div>
            )}

            {federationLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : !federationProfile?.hasKeys ? (
              /* Setup Card */
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h2 className="card-title">Enable Notes</h2>
                  <p className="text-base-content/70 max-w-md mb-4">
                    Share public notes with the fediverse! Connect with other
                    ActivityPub-compatible platforms like Mastodon, Pleroma, and other Caderno instances.
                  </p>
                  {!user?.username ? (
                    <div className="alert alert-warning max-w-md">
                      <span>
                        Please set a username in the <button className="link link-primary" onClick={() => setActiveTab('profile')}>Profile tab</button> before enabling notes.
                      </span>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleSetup}
                      disabled={isSettingUp}
                    >
                      {isSettingUp ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Setting up...
                        </>
                      ) : (
                        'Enable Notes'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Notes Profile Card */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div>
                        <h2 className="card-title text-base sm:text-lg">{federationProfile.displayName || federationProfile.username}</h2>
                        <p className="text-primary font-mono text-sm break-all">{federationProfile.handle}</p>
                        {federationProfile.bio && (
                          <p className="mt-2 text-sm text-base-content/70">{federationProfile.bio}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-sm sm:badge-md ${federationProfile.federationEnabled ? 'badge-success' : 'badge-ghost'}`}>
                          {federationProfile.federationEnabled ? 'Active' : 'Paused'}
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-sm sm:toggle-md toggle-success"
                          checked={federationProfile.federationEnabled}
                          onChange={handleToggleFederation}
                          aria-label="Toggle notes"
                        />
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{federationProfile.followerCount}</div>
                        <div className="text-sm text-base-content/60">Followers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{federationProfile.followingCount}</div>
                        <div className="text-sm text-base-content/60">Following</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{federationProfile.hasKeys ? 'Yes' : 'No'}</div>
                        <div className="text-sm text-base-content/60">Keys Ready</div>
                      </div>
                    </div>

                    {federationProfile.actorUrl && (
                      <div className="mt-4 p-3 bg-base-200 rounded-lg">
                        <p className="text-xs text-base-content/60 mb-1">Actor URL</p>
                        <code className="text-sm break-all">{federationProfile.actorUrl}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow Users */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="text-lg font-bold">Follow Users</h3>
                    <p className="text-sm text-base-content/70">
                      Follow users from this instance or other Caderno instances
                    </p>

                    {!federationProfile.federationEnabled ? (
                      <div className="alert alert-warning mt-4">
                        <span>Enable notes to follow users.</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2 mt-4">
                          <input
                            type="text"
                            className="input input-bordered flex-1"
                            placeholder="@username@caderno-instance.com or @localuser"
                            value={followHandle}
                            onChange={(e) => setFollowHandle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                          />
                          <button
                            className="btn btn-ghost"
                            onClick={handleLookup}
                            disabled={isLookingUp || !followHandle.trim()}
                          >
                            {isLookingUp ? <span className="loading loading-spinner loading-sm"></span> : 'Lookup'}
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={handleFollow}
                            disabled={isFollowing || !followHandle.trim()}
                          >
                            {isFollowing ? <span className="loading loading-spinner loading-sm"></span> : 'Follow'}
                          </button>
                        </div>

                        {lookupResult && (
                          <div className="mt-4 p-4 bg-base-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{lookupResult.displayName || lookupResult.username}</h4>
                                <p className="text-sm text-primary font-mono">@{lookupResult.username}</p>
                                {lookupResult.bio && (
                                  <p className="text-sm text-base-content/70 mt-1">{lookupResult.bio}</p>
                                )}
                                <span className={`badge badge-sm mt-2 ${lookupResult.isLocal ? 'badge-success' : 'badge-info'}`}>
                                  {lookupResult.isLocal ? 'Local User' : 'Remote Caderno'}
                                </span>
                              </div>
                              {isAlreadyFollowing ? (
                                <span className="badge badge-ghost">Already Following</span>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={handleFollow}
                                  disabled={isFollowing}
                                >
                                  {isFollowing ? <span className="loading loading-spinner loading-sm"></span> : 'Follow'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Following ({followingList.length})</h4>
                          {followingList.length === 0 ? (
                            <p className="text-center text-base-content/60 py-4">
                              Not following anyone yet. Search for users above to follow them.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {followingList.map((f) => {
                                const usernameMatch = f.actorUrl.match(/\/users\/([^/]+)$/)
                                const followUsername = usernameMatch ? usernameMatch[1] : f.actorUrl

                                return (
                                  <div key={f.actorUrl} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                    <div>
                                      <p className="font-medium font-mono text-sm break-all">{followUsername}</p>
                                      <p className="text-xs text-base-content/50 break-all">{f.actorUrl}</p>
                                      {f.pending && (
                                        <span className="badge badge-warning badge-sm mt-1">Pending</span>
                                      )}
                                    </div>
                                    <button
                                      className="btn btn-ghost btn-sm text-error"
                                      onClick={() => handleUnfollow(f.actorUrl)}
                                    >
                                      Unfollow
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Feed */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Feed</h3>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={fetchFeed}
                        disabled={isFeedLoading}
                      >
                        {isFeedLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Refresh'}
                      </button>
                    </div>
                    <p className="text-sm text-base-content/70">
                      Recent entries from users you follow
                    </p>

                    {!federationProfile.federationEnabled ? (
                      <div className="alert alert-warning mt-4">
                        <span>Enable notes to see your feed.</span>
                      </div>
                    ) : isFeedLoading ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                    ) : feedEntries.length === 0 ? (
                      <p className="text-center text-base-content/60 py-8">
                        No entries in your feed yet. Follow some users to see their published entries here.
                      </p>
                    ) : (
                      <div className="space-y-4 mt-4">
                        {feedEntries.map((entry) => (
                          <div key={entry.id} className="p-4 bg-base-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="avatar placeholder">
                                <div className="bg-neutral text-neutral-content rounded-full w-8">
                                  <span className="text-xs">{(entry.author.displayName || entry.author.username).charAt(0).toUpperCase()}</span>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{entry.author.displayName || entry.author.username}</p>
                                <p className="text-xs text-base-content/50">
                                  @{entry.author.username}
                                  {entry.author.isLocal ? '' : ' (remote)'}
                                </p>
                              </div>
                              <span className="ml-auto text-xs text-base-content/50">
                                {new Date(entry.published).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-semibold">{entry.title}</h4>
                            <p className="text-sm text-base-content/80 mt-1 whitespace-pre-wrap line-clamp-4">
                              {entry.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
