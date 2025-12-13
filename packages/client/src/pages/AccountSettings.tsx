import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { FingerPrintIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import { useCryptoStore } from '../stores/cryptoStore'
import { authApi, federationApi, profileApi, passkeyApi, type FederationProfile, type FollowRequest, type PasskeyInfo } from '../lib/api'
import { deriveKeyFromPrf, encryptMasterKeyWithPrf, base64UrlToBuffer } from '../lib/crypto'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { useDebouncedValidation } from '../hooks/useDebouncedValidation'

type TabType = 'profile' | 'followers'

export function AccountSettings() {
  const { user, updateProfile, isLoading, clearError } = useAuthStore()
  const { isKeyReady } = useCryptoStore()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // Profile form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'restricted' | 'private'>('private')

  // Follow requests state
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Email form state
  const [email, setEmail] = useState('')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  // Federation state
  const [federationProfile, setFederationProfile] = useState<FederationProfile | null>(null)
  const [federationLoading, setFederationLoading] = useState(true)

  // Setup state
  const [isSettingUp, setIsSettingUp] = useState(false)

  // Follow state
  const [followingList, setFollowingList] = useState<{ actorUrl: string; pending: boolean; since: string }[]>([])
  const [followHandle, setFollowHandle] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [lookupResult, setLookupResult] = useState<{ actorUrl: string; username: string; displayName: string | null; bio: string | null; isLocal: boolean } | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  // Passkey state
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([])
  const [passkeysLoading, setPasskeysLoading] = useState(true)
  const [isAddingPasskey, setIsAddingPasskey] = useState(false)
  const [newPasskeyName, setNewPasskeyName] = useState('')
  const [editingPasskeyId, setEditingPasskeyId] = useState<number | null>(null)
  const [editingPasskeyName, setEditingPasskeyName] = useState('')
  const supportsPasskey = browserSupportsWebAuthn()

  // Debounced username availability check
  const {
    isChecking: checkingUsername,
    isAvailable: usernameAvailable,
    error: validationError,
    checkValue: checkUsername,
    reset: resetUsernameValidation
  } = useDebouncedValidation({
    validate: async (value) => authApi.checkUsername(value),
    minLength: 3,
    pattern: /^[a-z0-9_]+$/,
    debounceMs: 500,
    skipValue: user?.username ?? undefined
  })

  // Debounced email availability check
  const {
    isChecking: checkingEmail,
    isAvailable: emailAvailable,
    error: emailError,
    checkValue: checkEmail,
    reset: resetEmailValidation
  } = useDebouncedValidation({
    validate: async (value) => authApi.checkEmail(value),
    minLength: 5,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    debounceMs: 500,
    skipValue: user?.email ?? undefined
  })

  // Initialize profile form with current user data
  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setEmail(user.email || '')
      setDisplayName(user.displayName || '')
      setBio(user.bio || '')
      setProfileVisibility(user.profileVisibility)
      resetUsernameValidation()
      resetEmailValidation()
    }
  }, [user, resetUsernameValidation, resetEmailValidation])

  // Fetch federation data and passkeys when key is ready
  useEffect(() => {
    if (isKeyReady) {
      fetchFederationProfile()
      fetchFollowing()
      fetchFollowRequests()
      fetchPasskeys()
    }
  }, [isKeyReady])

  // Fetch passkeys
  const fetchPasskeys = useCallback(async () => {
    setPasskeysLoading(true)
    try {
      const { passkeys: passkeyList } = await passkeyApi.list()
      setPasskeys(passkeyList)
    } catch {
      // Silently fail
    } finally {
      setPasskeysLoading(false)
    }
  }, [])

  // Add passkey handler with PRF support for E2EE key encryption
  const handleAddPasskey = async () => {
    if (!supportsPasskey) {
      toast.error('Passkeys are not supported on this device')
      return
    }

    const masterKey = useCryptoStore.getState().getKey()
    if (!masterKey) {
      toast.error('Encryption key not available. Please unlock first.')
      return
    }

    setIsAddingPasskey(true)
    try {
      // Get registration options from server (includes PRF extension)
      const { options, challengeKey, prfSalt } = await passkeyApi.getRegistrationOptions()

      // Start WebAuthn registration with PRF extension
      const regResponse = await startRegistration({
        optionsJSON: options as Parameters<typeof startRegistration>[0]['optionsJSON']
      })

      // Verify with server and check PRF support
      const { passkey, prfSupported } = await passkeyApi.verifyRegistration(
        challengeKey,
        regResponse,
        newPasskeyName || 'Passkey'
      )

      if (!passkey) {
        throw new Error('Failed to register passkey')
      }

      // If PRF is supported, encrypt the master key with passkey
      if (prfSupported && prfSalt) {
        try {
          // Need to authenticate with PRF to get the secret
          // Build authentication options with PRF eval
          const prfSaltBuffer = base64UrlToBuffer(prfSalt)

          const authOptions = {
            rpId: (options as any).rp?.id || window.location.hostname,
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            allowCredentials: [{
              id: passkey.id.toString(),
              type: 'public-key' as const,
              transports: ['internal' as const]
            }],
            userVerification: 'preferred' as const,
            extensions: {
              prf: {
                eval: {
                  first: prfSaltBuffer
                }
              }
            }
          }

          // Get PRF output through authentication
          const authResponse = await startAuthentication({
            optionsJSON: authOptions as any
          })

          // Get PRF result from client extension results
          const prfResult = (authResponse as any).clientExtensionResults?.prf?.results?.first
          if (prfResult) {
            // Derive encryption key from PRF output
            const prfKey = await deriveKeyFromPrf(prfResult)

            // Encrypt master key with PRF-derived key
            const { encryptedKey, iv } = await encryptMasterKeyWithPrf(masterKey, prfKey)

            // Store encrypted key on server
            await passkeyApi.storeEncryptedKey(passkey.id, encryptedKey, iv)

            toast.success('Passkey added with E2EE key backup!')
          } else {
            toast.success('Passkey added (without E2EE key backup)')
          }
        } catch (prfError) {
          console.warn('PRF key encryption failed:', prfError)
          toast.success('Passkey added (E2EE key backup not available)')
        }
      } else {
        toast.success('Passkey added successfully!')
      }

      setPasskeys([...passkeys, passkey])
      setNewPasskeyName('')
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Passkey registration was cancelled')
      } else {
        toast.error(err.message || 'Failed to add passkey')
      }
    } finally {
      setIsAddingPasskey(false)
    }
  }

  // Delete passkey handler
  const handleDeletePasskey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this passkey?')) return

    try {
      await passkeyApi.delete(id)
      setPasskeys(passkeys.filter(p => p.id !== id))
      toast.success('Passkey deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete passkey')
    }
  }

  // Rename passkey handler
  const handleRenamePasskey = async (id: number) => {
    if (!editingPasskeyName.trim()) return

    try {
      const { passkey } = await passkeyApi.rename(id, editingPasskeyName.trim())
      setPasskeys(passkeys.map(p => p.id === id ? passkey : p))
      setEditingPasskeyId(null)
      setEditingPasskeyName('')
      toast.success('Passkey renamed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename passkey')
    }
  }

  // Fetch follow requests
  const fetchFollowRequests = async () => {
    setLoadingRequests(true)
    try {
      const { requests } = await profileApi.getFollowRequests()
      setFollowRequests(requests)
    } catch {
      // Silently fail
    } finally {
      setLoadingRequests(false)
    }
  }

  // Handle accept follow request
  const handleAcceptRequest = async (id: number, type: 'local' | 'remote') => {
    try {
      await profileApi.acceptFollowRequest(id, type)
      setFollowRequests(followRequests.filter(r => r.id !== id || r.type !== type))
      toast.success('Follow request accepted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept request')
    }
  }

  // Handle reject follow request
  const handleRejectRequest = async (id: number, type: 'local' | 'remote') => {
    try {
      await profileApi.rejectFollowRequest(id, type)
      setFollowRequests(followRequests.filter(r => r.id !== id || r.type !== type))
      toast.success('Follow request rejected')
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request')
    }
  }

  // Trigger username validation on change
  useEffect(() => {
    checkUsername(username)
  }, [username, checkUsername])

  // Trigger email validation on change
  useEffect(() => {
    checkEmail(email)
  }, [email, checkEmail])

  // Email update handler
  const handleEmailUpdate = async () => {
    if (!email || email === user?.email) return
    if (emailAvailable === false) {
      toast.error('This email is not available')
      return
    }

    setIsUpdatingEmail(true)
    try {
      const { user: updatedUser, message } = await authApi.updateEmail(email)
      // Update the user in the auth store
      useAuthStore.getState().setUser(updatedUser)
      toast.success(message)
      resetEmailValidation()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update email')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  // Federation API calls
  const fetchFederationProfile = async () => {
    try {
      const { profile } = await federationApi.getProfile()
      setFederationProfile(profile)
    } catch {
      toast.error('Failed to load federation profile')
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

  // Profile handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

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
      toast.error('This username is not available')
      return
    }

    try {
      await updateProfile({
        username,
        displayName: displayName || null,
        bio: bio || null,
        profileVisibility
      })
      toast.success('Profile updated successfully!')
      resetUsernameValidation()
    } catch {
      // Error handled in store
    }
  }

  // Federation handlers
  const handleSetup = async () => {
    setIsSettingUp(true)

    try {
      const { profile } = await federationApi.setup()
      setFederationProfile(profile)
      toast.success('Notes enabled successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to setup federation')
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleLookup = async () => {
    if (!followHandle.trim()) return

    setIsLookingUp(true)
    setLookupResult(null)

    try {
      const { user } = await federationApi.lookup(followHandle.trim())
      setLookupResult(user)
    } catch (err: any) {
      toast.error(err.message || 'User not found')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleFollow = async () => {
    if (!followHandle.trim()) return

    setIsFollowing(true)

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
      toast.success(result.following.pending ? 'Follow request sent!' : 'Now following!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to follow user')
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
      toast.success('Unfollowed successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to unfollow user')
    }
  }

  const isAlreadyFollowing = lookupResult && followingList.some(f => f.actorUrl === lookupResult.actorUrl)

  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <Navbar currentPage="settings" />

      <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
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
              className={`tab flex-1 ${activeTab === 'followers' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              Followers
            </button>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card bg-base-100 shadow-xl animate-fade-in-up">
            <div className="card-body">
              <h1 className="card-title text-2xl mb-6">Profile Settings</h1>

              {/* Email - separate from main form since it has its own update flow */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                  {user && !user.emailVerified && (
                    <span className="label-text-alt text-warning">Not verified</span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    className={`input input-bordered w-full ${
                      emailAvailable === true ? 'input-success' :
                      emailAvailable === false ? 'input-error' : ''
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    required
                    disabled={isUpdatingEmail}
                    placeholder="your@email.com"
                  />
                  {checkingEmail && (
                    <span className="absolute right-3 top-3 loading loading-spinner loading-sm"></span>
                  )}
                  {!checkingEmail && emailAvailable === true && (
                    <span className="absolute right-3 top-3 text-success">&#10003;</span>
                  )}
                  {!checkingEmail && emailAvailable === false && (
                    <span className="absolute right-3 top-3 text-error">&#10007;</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  {checkingEmail && email !== user?.email && (
                    <span className="label py-2">
                      {checkingEmail ? (
                        <span className="label-text-alt text-base-content/70">Checking availability...</span>
                      ) : emailAvailable === true ? (
                        <span className="label-text-alt text-success">Email is available</span>
                      ) : emailAvailable === false ? (
                        <span className="label-text-alt text-error">{emailError}</span>
                      ) : email !== user?.email ? (
                        <span className="label-text-alt text-base-content/70">Enter a valid email address</span>
                      ) : null}
                    </span>
                  )}
                  {email !== user?.email && emailAvailable === true && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleEmailUpdate}
                      disabled={isUpdatingEmail || checkingEmail}
                    >
                      {isUpdatingEmail ? <span className="loading loading-spinner loading-sm"></span> : 'Update Email'}
                    </button>
                  )}
                </div>
                {email !== user?.email && emailAvailable === true && (
                  <div className="alert alert-info mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm">Changing your email will require re-verification. A verification link will be sent to your new email address.</span>
                  </div>
                )}
              </div>

              <div className="divider"></div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Username */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Username</span>
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
                  <div className="flex justify-between">
                    {user?.username && profileVisibility !== 'private' && (
                      <span className="label pt-2">
                        <span className="label-text-alt">
                          Your profile URL: <Link to={`/${user.username}`} className="font-mono text-primary underline">/{user.username}</Link>
                        </span>
                      </span>
                    )}
                    <span className="label pt-2">
                      {checkingUsername ? (
                        <span className="label-text-alt text-base-content/70">Checking availability...</span>
                      ) : usernameAvailable === true ? (
                        <span className="label-text-alt text-success">Username is available</span>
                      ) : (
                        <span className="label-text-alt text-error">{validationError}</span>
                      )}
                    </span>
                  </div>
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
                  <label className="label">
                    <span className="label-text font-medium">Profile Visibility</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'restricted' | 'private')}
                    disabled={isLoading}
                  >
                    <option value="public">Public - Visible to everyone</option>
                    <option value="restricted">Restricted - Visible, but data only to approved followers</option>
                    <option value="private">Private - Hidden from everyone</option>
                  </select>
                  <span className="label pt-2">
                    <span className="label-text-alt">
                      {profileVisibility === 'public' && `Your profile is visible to everyone at /${username}`}
                      {profileVisibility === 'restricted' && 'Your profile is visible, but entries, switches, and notes are only visible to approved followers'}
                      {profileVisibility === 'private' && 'Your profile is hidden from everyone except you'}
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

              {/* Passkeys Section */}
              <div className="divider mt-8"></div>

              <h2 className="card-title text-xl mb-4">
                <FingerPrintIcon className="h-6 w-6" />
                Passkeys
              </h2>
              <p className="text-sm text-base-content/70 mb-4">
                Passkeys let you sign in quickly and securely using biometrics like Face ID or Touch ID.
                {!supportsPasskey && (
                  <span className="text-warning ml-1">Your browser doesn't support passkeys.</span>
                )}
              </p>

              {passkeysLoading ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              ) : (
                <>
                  {passkeys.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {passkeys.map((pk) => (
                        <div key={pk.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FingerPrintIcon className="h-5 w-5 text-primary" />
                            <div>
                              {editingPasskeyId === pk.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    className="input input-bordered input-sm w-40"
                                    value={editingPasskeyName}
                                    onChange={(e) => setEditingPasskeyName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenamePasskey(pk.id)}
                                    autoFocus
                                  />
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleRenamePasskey(pk.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                      setEditingPasskeyId(null)
                                      setEditingPasskeyName('')
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="font-medium">{pk.name || 'Passkey'}</p>
                                  <p className="text-xs text-base-content/60">
                                    {pk.deviceType === 'multiDevice' ? 'Synced' : 'Device-bound'}
                                    {pk.backedUp && ' • Backed up'}
                                    {pk.lastUsedAt && ` • Last used ${new Date(pk.lastUsedAt).toLocaleDateString()}`}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          {editingPasskeyId !== pk.id && (
                            <div className="flex gap-1">
                              <button
                                className="btn btn-ghost btn-sm btn-square"
                                onClick={() => {
                                  setEditingPasskeyId(pk.id)
                                  setEditingPasskeyName(pk.name || '')
                                }}
                                title="Rename"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm btn-square text-error"
                                onClick={() => handleDeletePasskey(pk.id)}
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {supportsPasskey && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1"
                        placeholder="Passkey name (optional)"
                        value={newPasskeyName}
                        onChange={(e) => setNewPasskeyName(e.target.value)}
                        disabled={isAddingPasskey}
                      />
                      <button
                        className="btn btn-primary gap-2"
                        onClick={handleAddPasskey}
                        disabled={isAddingPasskey}
                      >
                        {isAddingPasskey ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <FingerPrintIcon className="h-5 w-5" />
                        )}
                        Add Passkey
                      </button>
                    </div>
                  )}

                  {passkeys.length === 0 && !supportsPasskey && (
                    <div className="text-center text-base-content/60 py-4">
                      Passkeys are not available on this device.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Followers Tab */}
        {activeTab === 'followers' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Pending Follow Requests Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Pending Follow Requests</h3>
                  {followRequests.length > 0 && (
                    <span className="badge badge-primary">{followRequests.length}</span>
                  )}
                </div>
                <p className="text-sm text-base-content/70">
                  People who want to follow you
                </p>

                {loadingRequests ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                ) : followRequests.length === 0 ? (
                  <div className="text-center text-base-content/60 py-6">
                    No pending follow requests
                  </div>
                ) : (
                  <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                    {followRequests.map((req) => {
                      const canLinkToProfile = req.type === 'local' && req.follower.username
                      return (
                        <div key={`${req.type}-${req.id}`} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            {canLinkToProfile ? (
                              <Link to={`/${req.follower.username}`} className="avatar placeholder">
                                <div className="flex items-center justify-center bg-neutral text-neutral-content rounded-full w-10 hover:ring-2 hover:ring-primary transition-all">
                                  <span>{(req.follower.displayName || req.follower.username || '?').charAt(0).toUpperCase()}</span>
                                </div>
                              </Link>
                            ) : (
                              <div className="avatar placeholder">
                                <div className="flex items-center justify-center bg-neutral text-neutral-content rounded-full w-10">
                                  <span>{(req.follower.displayName || req.follower.username || '?').charAt(0).toUpperCase()}</span>
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                {canLinkToProfile ? (
                                  <Link to={`/${req.follower.username}`} className="font-medium hover:underline">
                                    {req.follower.displayName || req.follower.username}
                                  </Link>
                                ) : (
                                  <p className="font-medium">{req.follower.displayName || req.follower.username}</p>
                                )}
                                {req.type === 'remote' && (
                                  <span className="badge badge-info badge-xs">Remote</span>
                                )}
                              </div>
                              {req.follower.username && (
                                canLinkToProfile ? (
                                  <Link to={`/${req.follower.username}`} className="text-xs text-base-content/60 hover:underline">
                                    @{req.follower.username}
                                  </Link>
                                ) : (
                                  <p className="text-xs text-base-content/60">@{req.follower.username}</p>
                                )
                              )}
                              {req.follower.actorUrl && (
                                <p className="text-xs text-base-content/40 truncate max-w-[200px]" title={req.follower.actorUrl}>
                                  {req.follower.actorUrl}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleAcceptRequest(req.id, req.type)}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRejectRequest(req.id, req.type)}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

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
                    <div>
                      <h2 className="card-title text-base sm:text-lg">{federationProfile.displayName || federationProfile.username}</h2>
                      <p className="text-primary font-mono text-sm break-all">{federationProfile.handle}</p>
                      {federationProfile.bio && (
                        <p className="mt-2 text-sm text-base-content/70">{federationProfile.bio}</p>
                      )}
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
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
