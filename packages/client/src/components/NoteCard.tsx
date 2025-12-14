import { useState, useMemo, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { GlobeAltIcon, UserGroupIcon, LockClosedIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { NoteVisibility } from '../lib/api'
import { formatRelativeTime } from '../lib/formatters'
import { getVisibilityConfig, type VisibilityIconType } from '../lib/visibility'

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

const MAX_CONTENT_LENGTH = 300

const VISIBILITY_ICONS: Record<VisibilityIconType, React.ReactNode> = {
  globe: <GlobeAltIcon className="h-3 w-3" aria-hidden="true" />,
  users: <UserGroupIcon className="h-3 w-3" aria-hidden="true" />,
  lock: <LockClosedIcon className="h-3 w-3" aria-hidden="true" />
}

function NoteCardComponent({
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

  const contentNeedsExpansion = useMemo(() => content.length > MAX_CONTENT_LENGTH, [content])
  const displayContent = useMemo(
    () => isExpanded || !contentNeedsExpansion ? content : content.slice(0, MAX_CONTENT_LENGTH) + '...',
    [content, isExpanded, contentNeedsExpansion]
  )

  const toggleExpanded = useCallback(() => setIsExpanded((prev) => !prev), [])

  // Get visibility config using centralized utility
  const visibilityConfig = useMemo(
    () => visibility ? getVisibilityConfig(visibility) : null,
    [visibility]
  )

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
            {showVisibilityBadge && visibilityConfig && (
              <span className={`badge badge-sm gap-1 ${visibilityConfig.badgeClass}`}>
                {VISIBILITY_ICONS[visibilityConfig.icon]}
                {visibilityConfig.label}
              </span>
            )}

            {/* Owner actions */}
            {isOwner && (onEdit || onDelete) && (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={onEdit}
                    aria-label="Edit note"
                  >
                    <PencilIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={onDelete}
                    aria-label="Delete note"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
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
            onClick={toggleExpanded}
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

export const NoteCard = memo(NoteCardComponent)
