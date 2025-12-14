import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { EyeSlashIcon, UserGroupIcon, LockClosedIcon, PlusIcon, NoSymbolIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { profileApi, federationApi, type PublicProfile, type ProfileNote, type NoteVisibility, ApiError } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { FollowButton } from '../components/FollowButton'
import { NoteCard } from '../components/NoteCard'
import { Footer } from '../components/Footer'

interface AccountStatus {
  status: 'banned' | 'suspended'
  bannedOn?: string
  suspendedUntil?: string
}

export function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser } = useAuthStore()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [notes, setNotes] = useState<ProfileNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notesLoading, setNotesLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Create note state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteVisibility, setNewNoteVisibility] = useState<NoteVisibility>('public')
  const [isCreating, setIsCreating] = useState(false)

  // Edit note state
  const [editingNote, setEditingNote] = useState<ProfileNote | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editVisibility, setEditVisibility] = useState<NoteVisibility>('public')
  const [isEditing, setIsEditing] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // Memoize member since date - must be before any early returns
  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return ''
    return new Date(profile.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }, [profile?.createdAt])

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
        setIsOwner(data.isOwnProfile)
        setAccountStatus(null)
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setNotFound(true)
          } else if (error.status === 403 && error.data?.accountStatus) {
            setAccountStatus({
              status: error.data.accountStatus,
              bannedOn: error.data.bannedOn,
              suspendedUntil: error.data.suspendedUntil
            })
          } else {
            console.error('Failed to load profile:', error)
            setNotFound(true)
          }
        } else {
          console.error('Failed to load profile:', error)
          setNotFound(true)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [username, refreshKey])

  useEffect(() => {
    async function loadNotes() {
      if (!username || profile?.isRestricted) return

      setNotesLoading(true)
      try {
        const data = await profileApi.getNotes(username)
        setNotes(data.notes)
        setIsOwner(data.isOwner)
      } catch (error) {
        console.error('Failed to load notes:', error)
      } finally {
        setNotesLoading(false)
      }
    }

    loadNotes()
  }, [username, refreshKey, profile?.isRestricted])

  const handleCreateNote = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const { entry } = await federationApi.publish({
        title: newNoteTitle,
        content: newNoteContent,
        visibility: newNoteVisibility
      })
      setNotes(prev => [{
        id: entry.id,
        title: entry.title,
        content: entry.content,
        visibility: entry.visibility,
        published: entry.published
      }, ...prev])
      setShowCreateModal(false)
      setNewNoteTitle('')
      setNewNoteContent('')
      setNewNoteVisibility('public')
    } catch (err: any) {
      setError(err.message || 'Failed to create note')
    } finally {
      setIsCreating(false)
    }
  }, [newNoteTitle, newNoteContent, newNoteVisibility])

  const handleEditNote = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return

    setIsEditing(true)
    setError(null)

    try {
      const { entry } = await federationApi.updateNote(editingNote.id, {
        title: editTitle,
        content: editContent,
        visibility: editVisibility
      })
      setNotes(prev => prev.map(n => n.id === entry.id ? {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        visibility: entry.visibility,
        published: entry.published
      } : n))
      setEditingNote(null)
    } catch (err: any) {
      setError(err.message || 'Failed to update note')
    } finally {
      setIsEditing(false)
    }
  }, [editingNote, editTitle, editContent, editVisibility])

  const handleDeleteNote = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await federationApi.unpublish(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete note')
    }
  }, [])

  const openEditModal = useCallback((note: ProfileNote) => {
    setEditingNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditVisibility(note.visibility)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (accountStatus) {
    const isBanned = accountStatus.status === 'banned'
    const formattedDate = isBanned && accountStatus.bannedOn
      ? new Date(accountStatus.bannedOn).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : accountStatus.suspendedUntil
        ? new Date(accountStatus.suspendedUntil).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        : null

    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
        <div className="card bg-base-100 shadow-xl w-full max-w-md">
          <div className="card-body text-center">
            {isBanned ? (
              <>
                <NoSymbolIcon className="h-16 w-16 mx-auto mb-4 text-error" />
                <h2 className="card-title justify-center text-2xl mb-2">Account Banned</h2>
                <p className="text-base-content/70 mb-2">
                  This account has been permanently banned for violating our terms of service.
                </p>
                {formattedDate && (
                  <p className="text-sm text-base-content/50 mb-6">
                    Banned on {formattedDate}
                  </p>
                )}
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-warning" />
                <h2 className="card-title justify-center text-2xl mb-2">Account Suspended</h2>
                <p className="text-base-content/70 mb-2">
                  This account is temporarily suspended.
                </p>
                {formattedDate && (
                  <p className="text-sm text-base-content/50 mb-6">
                    Suspension ends on {formattedDate}
                  </p>
                )}
              </>
            )}
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-base-200 p-4 animate-fade-in flex flex-col">
      <div className="w-full min-w-[300px] sm:min-w-[500px] max-w-2xl mx-auto flex-1">
        {/* Error alert */}
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Private/Restricted profile disclaimer for owner */}
        {profile.isOwnProfile && profile.profileVisibility === 'private' && (
          <div className="alert alert-warning mb-4 animate-fade-in-up">
            <EyeSlashIcon className="h-5 w-5" />
            <span>
              This profile is private. Only you can see this page.
              <Link to="/settings" className="link link-primary ml-1">
                Change visibility in settings
              </Link>
            </span>
          </div>
        )}
        {profile.isOwnProfile && profile.profileVisibility === 'restricted' && (
          <div className="alert alert-info mb-4 animate-fade-in-up">
            <UserGroupIcon className="h-5 w-5" />
            <span>
              This profile is restricted. Only approved followers can see your entries, switches, and notes.
              <Link to="/settings" className="link link-primary ml-1">
                Manage in settings
              </Link>
            </span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl animate-fade-in-up">
          <div className="card-body items-center text-center">
            {/* Avatar */}
            <div className="avatar placeholder mb-4">
              <div className="bg-primary flex justify-center items-center text-primary-content rounded-full w-24 h-24">
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

            {/* Follow Button - show to non-owners (redirects to login if not authenticated) */}
            {!profile.isOwnProfile && (
              <div className="mt-4">
                <FollowButton
                  username={profile.username}
                  isFollowing={profile.isFollowing}
                  isPending={profile.isFollowPending}
                  isRestricted={profile.isRestricted}
                  isAuthenticated={!!authUser}
                  onFollowChange={() => setRefreshKey(k => k + 1)}
                />
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-base-content/80 max-w-md">
                {profile.bio}
              </p>
            )}

            {/* Stats - only show when not restricted */}
            {!profile.isRestricted && profile.entryCount !== null && (
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
            )}

            {/* Restricted notice for non-followers */}
            {profile.isRestricted && (
              <div className="alert alert-info mt-6 max-w-sm">
                <LockClosedIcon className="h-5 w-5" />
                <span>This profile is restricted. Follow to see more.</span>
              </div>
            )}

            {/* Member Since */}
            <p className="mt-6 text-sm text-base-content/50">
              Member since {memberSince}
            </p>
          </div>
        </div>

        {/* Notes Section - hide when restricted */}
        {!profile.isRestricted && (
        <div className="card bg-base-100 shadow-xl mt-6 animate-fade-in-up">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Notes</h2>
              {isOwner && (
                <button
                  className="btn btn-primary btn-sm gap-1"
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  New Note
                </button>
              )}
            </div>

            {notesLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : notes.length === 0 ? (
              <p className="text-center text-base-content/60 py-8">
                {isOwner
                  ? "You haven't posted any notes yet. Click 'New Note' to create one!"
                  : 'No notes to display.'}
              </p>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    id={note.id}
                    title={note.title}
                    content={note.content}
                    published={note.published}
                    author={{
                      username: profile.username,
                      displayName: profile.displayName,
                      isLocal: true
                    }}
                    visibility={note.visibility}
                    showAuthor={true}
                    showVisibilityBadge={true}
                    isOwner={isOwner}
                    onEdit={() => openEditModal(note)}
                    onDelete={() => handleDeleteNote(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link to="/" className="link link-primary">
            &larr; Back to Caderno
          </Link>
        </div>
      </div>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Create New Note</h3>
            <form onSubmit={handleCreateNote} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Note title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Content *</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 w-full"
                  placeholder="Write your note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Visibility</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={newNoteVisibility}
                  onChange={(e) => setNewNoteVisibility(e.target.value as NoteVisibility)}
                >
                  <option value="public">Public - Visible to everyone</option>
                  <option value="followers">Followers - Only your followers can see</option>
                  <option value="private">Only me - Private note</option>
                </select>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating || !newNoteTitle || !newNoteContent}
                >
                  {isCreating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Note'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="modal modal-open">
          <div className="modal-backdrop" onClick={() => setEditingNote(null)} />
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Edit Note</h3>
            <form onSubmit={handleEditNote} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Note title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Content *</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 w-full"
                  placeholder="Write your note..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Visibility</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as NoteVisibility)}
                >
                  <option value="public">Public - Visible to everyone</option>
                  <option value="followers">Followers - Only your followers can see</option>
                  <option value="private">Only me - Private note</option>
                </select>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingNote(null)}
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEditing || !editTitle || !editContent}
                >
                  {isEditing ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
