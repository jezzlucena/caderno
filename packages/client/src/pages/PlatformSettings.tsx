import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCryptoStore } from '../stores/cryptoStore'
import { usePlatformStore } from '../stores/platformStore'
import { adminApi, platformApi, type BannedNote, type ModerationUser } from '../lib/api'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { NoSymbolIcon, ExclamationTriangleIcon, DocumentTextIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

type TabType = 'banned-notes' | 'banned-users' | 'suspended-users'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function PlatformSettings() {
  const { user } = useAuthStore()
  const { isKeyReady } = useCryptoStore()
  const [activeTab, setActiveTab] = useState<TabType>('banned-notes')

  // Data state
  const [bannedNotes, setBannedNotes] = useState<BannedNote[]>([])
  const [bannedUsers, setBannedUsers] = useState<ModerationUser[]>([])
  const [suspendedUsers, setSuspendedUsers] = useState<ModerationUser[]>([])

  // Loading states
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [loadingBannedUsers, setLoadingBannedUsers] = useState(false)
  const [loadingSuspendedUsers, setLoadingSuspendedUsers] = useState(false)

  // User actions state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedUser, setSearchedUser] = useState<ModerationUser | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [suspendUntil, setSuspendUntil] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Messages
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Platform settings state (admin only)
  const { displayName: currentDisplayName, fetchSettings: fetchPlatformSettings, setDisplayName: updateStoreDisplayName } = usePlatformStore()
  const [platformDisplayName, setPlatformDisplayName] = useState('')
  const [platformSaving, setPlatformSaving] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isModerator = user?.role === 'moderator'
  const hasAccess = isAdmin || isModerator

  // Load platform settings on mount
  useEffect(() => {
    if (isAdmin) {
      fetchPlatformSettings()
    }
  }, [isAdmin, fetchPlatformSettings])

  // Sync local state with store
  useEffect(() => {
    setPlatformDisplayName(currentDisplayName)
  }, [currentDisplayName])

  // Validate platform display name
  const validateDisplayName = (name: string): string | null => {
    if (!name.trim()) return 'Display name is required'
    if (name.length > 30) return 'Display name must be 30 characters or less'
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) return 'Display name can only contain letters, numbers, and spaces'
    return null
  }

  const handleSavePlatformSettings = async () => {
    const validationError = validateDisplayName(platformDisplayName)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setPlatformSaving(true)
    setErrorMessage('')
    try {
      const result = await platformApi.updateSettings(platformDisplayName.trim())
      updateStoreDisplayName(result.displayName)
      setSuccessMessage('Platform settings saved successfully')
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save platform settings')
    } finally {
      setPlatformSaving(false)
    }
  }

  // Fetch data on tab change
  useEffect(() => {
    if (!hasAccess || !isKeyReady) return

    if (activeTab === 'banned-notes') {
      fetchBannedNotes()
    } else if (activeTab === 'banned-users') {
      fetchBannedUsers()
    } else if (activeTab === 'suspended-users') {
      fetchSuspendedUsers()
    }
  }, [activeTab, hasAccess, isKeyReady])

  const fetchBannedNotes = async () => {
    setLoadingNotes(true)
    try {
      const { notes } = await adminApi.getBannedNotes()
      setBannedNotes(notes)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load banned notes')
    } finally {
      setLoadingNotes(false)
    }
  }

  const fetchBannedUsers = async () => {
    setLoadingBannedUsers(true)
    try {
      const { users } = await adminApi.getBannedUsers()
      setBannedUsers(users)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load banned users')
    } finally {
      setLoadingBannedUsers(false)
    }
  }

  const fetchSuspendedUsers = async () => {
    setLoadingSuspendedUsers(true)
    try {
      const { users } = await adminApi.getSuspendedUsers()
      setSuspendedUsers(users)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load suspended users')
    } finally {
      setLoadingSuspendedUsers(false)
    }
  }

  // User search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchedUser(null)
    setErrorMessage('')

    try {
      const { user } = await adminApi.searchUser(searchQuery.trim())
      if (user) {
        setSearchedUser(user)
      } else {
        setErrorMessage('User not found')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  // Moderation actions
  const handleUnbanNote = async (noteId: number) => {
    setActionLoading(true)
    setErrorMessage('')
    try {
      await adminApi.unbanNote(noteId)
      setSuccessMessage('Note unbanned successfully')
      setBannedNotes(bannedNotes.filter(n => n.id !== noteId))
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to unban note')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBanUser = async (identifier: string) => {
    if (!isAdmin) return

    setActionLoading(true)
    setErrorMessage('')
    try {
      await adminApi.banUser(identifier)
      setSuccessMessage('User banned successfully')
      setSearchedUser(null)
      setSearchQuery('')
      if (activeTab === 'banned-users') fetchBannedUsers()
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to ban user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnbanUser = async (identifier: string) => {
    if (!isAdmin) return

    setActionLoading(true)
    setErrorMessage('')
    try {
      await adminApi.unbanUser(identifier)
      setSuccessMessage('User unbanned successfully')
      setBannedUsers(bannedUsers.filter(u => u.username !== identifier && u.email !== identifier))
      setSearchedUser(null)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to unban user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendUser = async (identifier: string) => {
    if (!suspendUntil) {
      setErrorMessage('Please select a suspension end date')
      return
    }

    setActionLoading(true)
    setErrorMessage('')
    try {
      await adminApi.suspendUser(identifier, suspendUntil)
      setSuccessMessage('User suspended successfully')
      setSearchedUser(null)
      setSearchQuery('')
      setSuspendUntil('')
      if (activeTab === 'suspended-users') fetchSuspendedUsers()
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to suspend user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsuspendUser = async (identifier: string) => {
    setActionLoading(true)
    setErrorMessage('')
    try {
      await adminApi.unsuspendUser(identifier)
      setSuccessMessage('User unsuspended successfully')
      setSuspendedUsers(suspendedUsers.filter(u => u.username !== identifier && u.email !== identifier))
      setSearchedUser(null)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to unsuspend user')
    } finally {
      setActionLoading(false)
    }
  }

  // Access check
  if (!hasAccess) {
    return <Navigate to="/" replace />
  }

  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <Navbar currentPage="platform" />

      <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
        <h1 className="text-2xl font-bold mb-6">Platform Settings</h1>

        {/* Messages */}
        {errorMessage && (
          <div className="alert alert-error mb-4" role="alert">
            <span>{errorMessage}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setErrorMessage('')} aria-label="Dismiss error">
              <span aria-hidden="true">&times;</span>
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

        {/* User Search & Actions Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg">User Actions</h2>
            <p className="text-sm text-base-content/70 mb-4">
              Search for a user by username or email to take moderation actions.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1"
                placeholder="Username or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? <span className="loading loading-spinner loading-sm"></span> : 'Search'}
              </button>
            </div>

            {/* Search Result */}
            {searchedUser && (
              <div className="mt-4 p-4 bg-base-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-12">
                      <span className="text-lg">
                        {(searchedUser.displayName || searchedUser.username || searchedUser.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{searchedUser.displayName || searchedUser.username || 'No name'}</p>
                    {searchedUser.username && (
                      <p className="text-sm text-primary">@{searchedUser.username}</p>
                    )}
                    <p className="text-sm text-base-content/60">{searchedUser.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`badge badge-sm ${
                        searchedUser.role === 'admin' ? 'badge-error' :
                        searchedUser.role === 'moderator' ? 'badge-warning' :
                        'badge-ghost'
                      }`}>
                        {searchedUser.role}
                      </span>
                      {searchedUser.bannedOn && (
                        <span className="badge badge-sm badge-error">Banned</span>
                      )}
                      {searchedUser.suspendedUntil && new Date(searchedUser.suspendedUntil) > new Date() && (
                        <span className="badge badge-sm badge-warning">Suspended</span>
                      )}
                    </div>
                    <p className="text-xs text-base-content/50 mt-1">
                      Joined: {formatDate(searchedUser.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-base-300">
                  {/* Suspend/Unsuspend */}
                  {searchedUser.role !== 'admin' && (
                    <>
                      {searchedUser.suspendedUntil && new Date(searchedUser.suspendedUntil) > new Date() ? (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleUnsuspendUser(searchedUser.username || searchedUser.email)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Unsuspend'}
                        </button>
                      ) : !searchedUser.bannedOn && (
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            className="input input-bordered input-sm"
                            value={suspendUntil}
                            onChange={(e) => setSuspendUntil(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleSuspendUser(searchedUser.username || searchedUser.email)}
                            disabled={actionLoading || !suspendUntil}
                          >
                            {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Suspend'}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Ban/Unban - Admin only */}
                  {isAdmin && searchedUser.role !== 'admin' && (
                    <>
                      {searchedUser.bannedOn ? (
                        <button
                          className="btn btn-error btn-sm"
                          onClick={() => handleUnbanUser(searchedUser.username || searchedUser.email)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Unban'}
                        </button>
                      ) : (
                        <button
                          className="btn btn-error btn-sm"
                          onClick={() => handleBanUser(searchedUser.username || searchedUser.email)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Ban Permanently'}
                        </button>
                      )}
                    </>
                  )}

                  {searchedUser.role === 'admin' && (
                    <span className="text-sm text-base-content/50">Cannot moderate admin users</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Configuration Card - Admin only */}
        {isAdmin && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-lg gap-2">
                <Cog6ToothIcon className="w-5 h-5" />
                Platform Configuration
              </h2>
              <p className="text-sm text-base-content/70 mb-4">
                Configure platform-wide settings. These settings affect how your platform appears to all users.
              </p>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Platform Display Name</span>
                  <span className="label-text-alt text-base-content/50">
                    {platformDisplayName.length}/30 characters
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Caderno"
                  value={platformDisplayName}
                  onChange={(e) => setPlatformDisplayName(e.target.value)}
                  maxLength={30}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Only letters, numbers, and spaces allowed. Default: Caderno
                  </span>
                </label>
              </div>

              {platformDisplayName !== 'Caderno' && platformDisplayName.trim() && (
                <div className="alert alert-info text-sm">
                  <span>
                    When using a custom platform name, a "Powered by Caderno" disclaimer will appear in the footer.
                  </span>
                </div>
              )}

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleSavePlatformSettings}
                  disabled={platformSaving || platformDisplayName === currentDisplayName}
                >
                  {platformSaving ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Save Platform Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6 bg-base-100 p-1">
          <button
            className={`tab flex-1 gap-2 ${activeTab === 'banned-notes' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('banned-notes')}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Banned Notes
          </button>
          <button
            className={`tab flex-1 gap-2 ${activeTab === 'banned-users' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('banned-users')}
          >
            <NoSymbolIcon className="w-4 h-4" />
            Banned Users
          </button>
          <button
            className={`tab flex-1 gap-2 ${activeTab === 'suspended-users' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('suspended-users')}
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            Suspended
          </button>
        </div>

        {/* Banned Notes Tab */}
        {activeTab === 'banned-notes' && (
          <div className="card bg-base-100 shadow-xl animate-fade-in-up">
            <div className="card-body">
              <h2 className="card-title">Banned Notes</h2>
              {loadingNotes ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : bannedNotes.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No banned notes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bannedNotes.map((note) => (
                    <div key={note.id} className="p-4 bg-base-200 rounded-lg">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{note.title}</h3>
                          <p className="text-sm text-base-content/70 line-clamp-2 mt-1">{note.content}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-base-content/50">
                            <span>By: {note.author.displayName || note.author.username || note.author.email}</span>
                            <span>|</span>
                            <span>Banned: {formatDate(note.bannedOn)}</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm text-success"
                          onClick={() => handleUnbanNote(note.id)}
                          disabled={actionLoading}
                        >
                          Unban
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banned Users Tab */}
        {activeTab === 'banned-users' && (
          <div className="card bg-base-100 shadow-xl animate-fade-in-up">
            <div className="card-body">
              <h2 className="card-title">Banned Users</h2>
              {loadingBannedUsers ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : bannedUsers.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No banned users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bannedUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-error text-error-content rounded-full w-10">
                            <span>{(u.displayName || u.username || u.email).charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{u.displayName || u.username || 'No name'}</p>
                          <p className="text-xs text-base-content/60">{u.email}</p>
                          <p className="text-xs text-base-content/50">Banned: {formatDate(u.bannedOn)}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          className="btn btn-ghost btn-sm text-success"
                          onClick={() => handleUnbanUser(u.username || u.email)}
                          disabled={actionLoading}
                        >
                          Unban
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suspended Users Tab */}
        {activeTab === 'suspended-users' && (
          <div className="card bg-base-100 shadow-xl animate-fade-in-up">
            <div className="card-body">
              <h2 className="card-title">Suspended Users</h2>
              {loadingSuspendedUsers ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : suspendedUsers.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No suspended users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suspendedUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-warning text-warning-content rounded-full w-10">
                            <span>{(u.displayName || u.username || u.email).charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{u.displayName || u.username || 'No name'}</p>
                          <p className="text-xs text-base-content/60">{u.email}</p>
                          <p className="text-xs text-warning">Suspended until: {formatDate(u.suspendedUntil)}</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm text-success"
                        onClick={() => handleUnsuspendUser(u.username || u.email)}
                        disabled={actionLoading}
                      >
                        Unsuspend
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
