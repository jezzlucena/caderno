import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useCryptoStore } from '../stores/cryptoStore'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { Navbar } from '../components/Navbar'
import { federationApi, type FederationProfile, type PublicEntry, type FeedEntry } from '../lib/api'

export function Federation() {
  const { isKeyReady } = useCryptoStore()
  const [profile, setProfile] = useState<FederationProfile | null>(null)
  const [publishedEntries, setPublishedEntries] = useState<PublicEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Setup form state
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupUsername, setSetupUsername] = useState('')
  const [setupDisplayName, setSetupDisplayName] = useState('')
  const [setupBio, setSetupBio] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)

  // Publish form state
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishTitle, setPublishTitle] = useState('')
  const [publishContent, setPublishContent] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  // Follow state
  const [followingList, setFollowingList] = useState<{ actorUrl: string; pending: boolean; since: string }[]>([])
  const [followHandle, setFollowHandle] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [lookupResult, setLookupResult] = useState<{ actorUrl: string; username: string; displayName: string | null; bio: string | null; isLocal: boolean } | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  // Feed state
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([])
  const [isFeedLoading, setIsFeedLoading] = useState(false)

  useEffect(() => {
    if (isKeyReady) {
      fetchProfile()
      fetchPublished()
      fetchFollowing()
      fetchFeed()
    }
  }, [isKeyReady])

  const fetchProfile = async () => {
    try {
      const { profile } = await federationApi.getProfile()
      setProfile(profile)
    } catch (err) {
      setError('Failed to load federation profile')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPublished = async () => {
    try {
      const { entries } = await federationApi.getPublished()
      setPublishedEntries(entries)
    } catch {
      // Silently fail for published entries
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSettingUp(true)
    setError(null)

    try {
      const { profile } = await federationApi.setup({
        username: setupUsername,
        displayName: setupDisplayName || undefined,
        bio: setupBio || undefined
      })
      setProfile(profile)
      setShowSetupModal(false)
      setSetupUsername('')
      setSetupDisplayName('')
      setSetupBio('')
    } catch (err: any) {
      setError(err.message || 'Failed to setup federation')
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleToggleFederation = async () => {
    if (!profile) return

    try {
      await federationApi.updateProfile({
        federationEnabled: !profile.federationEnabled
      })
      setProfile({ ...profile, federationEnabled: !profile.federationEnabled })
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPublishing(true)
    setError(null)

    try {
      const { entry } = await federationApi.publish({
        title: publishTitle,
        content: publishContent
      })
      setPublishedEntries([entry, ...publishedEntries])
      setShowPublishModal(false)
      setPublishTitle('')
      setPublishContent('')
    } catch (err: any) {
      setError(err.message || 'Failed to publish entry')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async (id: number) => {
    if (!confirm('Are you sure you want to unpublish this entry?')) return

    try {
      await federationApi.unpublish(id)
      setPublishedEntries(publishedEntries.filter(e => e.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to unpublish entry')
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

  const handleLookup = async () => {
    if (!followHandle.trim()) return

    setIsLookingUp(true)
    setLookupResult(null)
    setError(null)

    try {
      const { user } = await federationApi.lookup(followHandle.trim())
      setLookupResult(user)
    } catch (err: any) {
      setError(err.message || 'User not found')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleFollow = async () => {
    if (!followHandle.trim()) return

    setIsFollowing(true)
    setError(null)

    try {
      const result = await federationApi.follow(followHandle.trim())
      setFollowingList([
        { actorUrl: result.following.actorUrl, pending: result.following.pending, since: new Date().toISOString() },
        ...followingList
      ])
      setFollowHandle('')
      setLookupResult(null)
      // Update profile follower count
      if (profile) {
        setProfile({ ...profile, followingCount: profile.followingCount + 1 })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to follow user')
    } finally {
      setIsFollowing(false)
    }
  }

  const handleUnfollow = async (actorUrl: string) => {
    try {
      await federationApi.unfollow(actorUrl)
      setFollowingList(followingList.filter(f => f.actorUrl !== actorUrl))
      // Update profile follower count
      if (profile) {
        setProfile({ ...profile, followingCount: Math.max(0, profile.followingCount - 1) })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unfollow user')
    }
  }

  // Check if already following the looked up user
  const isAlreadyFollowing = lookupResult && followingList.some(f => f.actorUrl === lookupResult.actorUrl)

  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200 animate-fade-in">
      <Navbar currentPage="federation" />

      <div className="container mx-auto p-3 sm:p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Federation</h1>
          <p className="text-sm sm:text-base text-base-content/70">
            Connect with other Caderno instances via ActivityPub
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : !profile?.username || !profile?.hasKeys ? (
          // Setup Card
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <div className="text-6xl mb-4">🌐</div>
              <h2 className="card-title">Enable Federation</h2>
              <p className="text-base-content/70 max-w-md mb-4">
                Join the fediverse! Choose a username to enable federation with other
                ActivityPub-compatible platforms like Mastodon, Pleroma, and other Caderno instances.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (profile?.username) setSetupUsername(profile.username)
                  if (profile?.displayName) setSetupDisplayName(profile.displayName)
                  if (profile?.bio) setSetupBio(profile.bio)
                  setShowSetupModal(true)
                }}
              >
                Setup Federation
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <h2 className="card-title text-base sm:text-lg">{profile.displayName || profile.username}</h2>
                    <p className="text-primary font-mono text-sm break-all">{profile.handle}</p>
                    {profile.bio && (
                      <p className="mt-2 text-sm text-base-content/70">{profile.bio}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm sm:badge-md ${profile.federationEnabled ? 'badge-success' : 'badge-ghost'}`}>
                      {profile.federationEnabled ? 'Active' : 'Paused'}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-sm sm:toggle-md toggle-success"
                      checked={profile.federationEnabled}
                      onChange={handleToggleFederation}
                      aria-label="Toggle federation"
                    />
                  </div>
                </div>

                <div className="divider"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{profile.followerCount}</div>
                    <div className="text-sm text-base-content/60">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profile.followingCount}</div>
                    <div className="text-sm text-base-content/60">Following</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{publishedEntries.length}</div>
                    <div className="text-sm text-base-content/60">Published</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profile.hasKeys ? 'Yes' : 'No'}</div>
                    <div className="text-sm text-base-content/60">Keys Ready</div>
                  </div>
                </div>

                {profile.actorUrl && (
                  <div className="mt-4 p-3 bg-base-200 rounded-lg">
                    <p className="text-xs text-base-content/60 mb-1">Actor URL</p>
                    <code className="text-sm break-all">{profile.actorUrl}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Published Entries */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Published Entries</h3>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowPublishModal(true)}
                    disabled={!profile.federationEnabled}
                  >
                    + Publish Entry
                  </button>
                </div>

                {!profile.federationEnabled && (
                  <div className="alert alert-warning mt-4">
                    <span>Enable federation to publish entries to the fediverse.</span>
                  </div>
                )}

                {publishedEntries.length === 0 ? (
                  <p className="text-center text-base-content/60 py-8">
                    No published entries yet. Your private journal entries are encrypted and safe.
                    Only entries you explicitly publish will be visible to others.
                  </p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {publishedEntries.map((entry) => (
                      <div key={entry.id} className="flex justify-between items-start p-3 bg-base-200 rounded-lg">
                        <div>
                          <h4 className="font-medium">{entry.title}</h4>
                          <p className="text-sm text-base-content/60">
                            Published {new Date(entry.published).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => handleUnpublish(entry.id)}
                        >
                          Unpublish
                        </button>
                      </div>
                    ))}
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

                {!profile.federationEnabled ? (
                  <div className="alert alert-warning mt-4">
                    <span>Enable federation to follow users.</span>
                  </div>
                ) : (
                  <>
                    {/* Follow Input */}
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

                    {/* Lookup Result */}
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

                    {/* Following List */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Following ({followingList.length})</h4>
                      {followingList.length === 0 ? (
                        <p className="text-center text-base-content/60 py-4">
                          Not following anyone yet. Search for users above to follow them.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {followingList.map((f) => {
                            // Extract username from actor URL
                            const usernameMatch = f.actorUrl.match(/\/users\/([^/]+)$/)
                            const username = usernameMatch ? usernameMatch[1] : f.actorUrl

                            return (
                              <div key={f.actorUrl} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                <div>
                                  <p className="font-medium font-mono text-sm break-all">{username}</p>
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

                {!profile.federationEnabled ? (
                  <div className="alert alert-warning mt-4">
                    <span>Enable federation to see your feed.</span>
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
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="modal modal-open">
          <div className="modal-backdrop modal-backdrop-enter" onClick={() => setShowSetupModal(false)} />
          <div className="modal-box modal-content-enter">
            <h3 className="font-bold text-lg">Setup Federation</h3>
            <form onSubmit={handleSetup} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="3-30 characters, alphanumeric and underscores only"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value.toLowerCase())}
                  pattern="^[a-zA-Z0-9_]{3,30}$"
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Username</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Display Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Your Name"
                  value={setupDisplayName}
                  onChange={(e) => setSetupDisplayName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Bio</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24 w-full"
                  placeholder="A short description about yourself..."
                  value={setupBio}
                  onChange={(e) => setSetupBio(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowSetupModal(false)}
                  disabled={isSettingUp}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSettingUp || !setupUsername}
                >
                  {isSettingUp ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Setting up...
                    </>
                  ) : (
                    'Enable Federation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="modal modal-open">
          <div className="modal-backdrop modal-backdrop-enter" onClick={() => setShowPublishModal(false)} />
          <div className="modal-box max-w-2xl modal-content-enter">
            <h3 className="font-bold text-lg">Publish Entry to Fediverse</h3>
            <p className="text-sm text-base-content/70 mt-1">
              This will create a public post visible to your followers and anyone on the fediverse.
            </p>

            <form onSubmit={handlePublish} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Entry title"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Content * (Markdown supported)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-48 font-mono"
                  placeholder="Write your public entry here..."
                  value={publishContent}
                  onChange={(e) => setPublishContent(e.target.value)}
                  required
                />
              </div>

              <div className="alert alert-warning">
                <ExclamationTriangleIcon className="shrink-0 h-6 w-6" />
                <span>This content will be public and unencrypted. Do not share sensitive information.</span>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowPublishModal(false)}
                  disabled={isPublishing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPublishing || !publishTitle || !publishContent}
                >
                  {isPublishing ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
