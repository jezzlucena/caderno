import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlobeAltIcon, UserGroupIcon, LockClosedIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { NoteVisibility } from '../lib/api'

export interface NoteAuthor {
  username: string
  displayName: string | null
  isLocal?: boolean
  isOwnPost?: boolean
}

export interface NoteCardProps {
  id: string | number
  title: string
  content: string
  published: string
  author: NoteAuthor
  visibility?: NoteVisibility
  showAuthor?: boolean
  showVisibilityBadge?: boolean
  isOwner?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const MAX_CONTENT_LENGTH = 300

const getVisibilityIcon = (visibility: NoteVisibility) => {
  switch (visibility) {
    case 'public':
      return <GlobeAltIcon className="h-3 w-3" />
    case 'followers':
      return <UserGroupIcon className="h-3 w-3" />
    case 'private':
      return <LockClosedIcon className="h-3 w-3" />
  }
}

const getVisibilityLabel = (visibility: NoteVisibility) => {
  switch (visibility) {
    case 'public':
      return 'Public'
    case 'followers':
      return 'Followers'
    case 'private':
      return 'Only me'
  }
}

const getVisibilityBadgeClass = (visibility: NoteVisibility) => {
  switch (visibility) {
    case 'public':
      return 'badge-success'
    case 'followers':
      return 'badge-info'
    case 'private':
      return 'badge-warning'
  }
}

export function NoteCard({
  id,
  title,
  content,
  published,
  author,
  visibility,
  showAuthor = true,
  showVisibilityBadge = false,
  isOwner = false,
  onEdit,
  onDelete
}: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const contentNeedsExpansion = content.length > MAX_CONTENT_LENGTH
  const displayContent = isExpanded || !contentNeedsExpansion
    ? content
    : content.slice(0, MAX_CONTENT_LENGTH) + '...'

  // Determine if we can link to profile (only local users)
  const canLinkToProfile = author.isLocal !== false

  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* Author row */}
        {showAuthor && (
          <div className="flex items-center gap-3 mb-2">
            {/* Avatar */}
            {canLinkToProfile ? (
              <Link to={`/${author.username}`} className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center hover:ring-2 hover:ring-primary transition-all">
                  <span className="text-lg">
                    {(author.displayName || author.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-lg">
                    {(author.displayName || author.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Author info */}
            <div className="flex-1 min-w-0">
              {canLinkToProfile ? (
                <Link
                  to={`/${author.username}`}
                  className="font-medium hover:underline truncate block"
                >
                  {author.displayName || author.username}
                </Link>
              ) : (
                <span className="font-medium truncate block">
                  {author.displayName || author.username}
                </span>
              )}
              <span className="text-sm text-base-content/60 truncate block">
                @{author.username}
              </span>
            </div>

            {/* Visibility badge */}
            {showVisibilityBadge && visibility && (
              <span className={`badge badge-sm gap-1 ${getVisibilityBadgeClass(visibility)}`}>
                {getVisibilityIcon(visibility)}
                {getVisibilityLabel(visibility)}
              </span>
            )}

            {/* Owner actions */}
            {isOwner && (onEdit || onDelete) && (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={onEdit}
                    title="Edit note"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={onDelete}
                    title="Delete note"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-lg mb-1">{title}</h3>

        {/* Content */}
        <p className="text-base-content/80 whitespace-pre-wrap break-words">
          {displayContent}
        </p>

        {/* Expand/collapse button */}
        {contentNeedsExpansion && (
          <button
            className="btn btn-ghost btn-xs self-start mt-1 text-primary"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Date - links to permalink for local users */}
        <div className="mt-2">
          {author.isLocal !== false && author.username ? (
            <Link
              to={`/${author.username}/notes/${id}`}
              className="text-xs text-base-content/50 hover:text-primary hover:underline"
            >
              {formatRelativeTime(published)}
            </Link>
          ) : (
            <span className="text-xs text-base-content/50">
              {formatRelativeTime(published)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
