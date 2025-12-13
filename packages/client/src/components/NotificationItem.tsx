import { Link } from 'react-router-dom'
import { DocumentTextIcon, UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '../stores/notificationStore'
import { formatRelativeTime } from '../lib/formatters'
import type { Notification } from '../lib/api'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
  showToggleButton?: boolean
}

export function NotificationItem({ notification, onClick, showToggleButton = false }: NotificationItemProps) {
  const { toggleRead } = useNotificationStore()

  const getIcon = () => {
    switch (notification.type) {
      case 'new_post':
        return <DocumentTextIcon className="h-5 w-5 text-primary" />
      case 'follow_request':
        return <UserPlusIcon className="h-5 w-5 text-warning" />
      case 'follow_accepted':
        return <CheckIcon className="h-5 w-5 text-success" />
      default:
        return null
    }
  }

  const getActorName = () => {
    if (notification.actor) {
      return notification.actor.displayName || notification.actor.username || 'Someone'
    }
    if (notification.actorActorUrl) {
      // Extract username from ActivityPub URL
      try {
        const url = new URL(notification.actorActorUrl)
        const parts = url.pathname.split('/').filter(Boolean)
        const username = parts[parts.length - 1]
        return `@${username}@${url.hostname}`
      } catch {
        return 'A remote user'
      }
    }
    return 'Someone'
  }

  const getMessage = () => {
    const actorName = getActorName()
    switch (notification.type) {
      case 'new_post':
        return <><span className="font-medium">{actorName}</span> published a new note</>
      case 'follow_request':
        return <><span className="font-medium">{actorName}</span> wants to follow you</>
      case 'follow_accepted':
        return <><span className="font-medium">{actorName}</span> accepted your follow request</>
      default:
        return 'New notification'
    }
  }

  const getLink = () => {
    switch (notification.type) {
      case 'new_post':
        if (notification.actor?.username && notification.referenceId) {
          return `/${notification.actor.username}/notes/${notification.referenceId}`
        }
        if (notification.actor?.username) {
          return `/${notification.actor.username}`
        }
        return '/feed'
      case 'follow_request':
        return '/settings' // Settings page has follow requests section
      case 'follow_accepted':
        if (notification.actor?.username) {
          return `/${notification.actor.username}`
        }
        return '/feed'
      default:
        return '/notifications'
    }
  }

  const handleClick = () => {
    if (!notification.isRead) {
      toggleRead(notification.id)
    }
    onClick?.()
  }

  const handleToggleRead = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleRead(notification.id)
  }

  return (
    <Link
      to={getLink()}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-200 last:border-b-0 ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.isRead ? 'font-medium' : 'text-base-content/80'}`}>
          {getMessage()}
        </p>
        <p className="text-xs text-base-content/60 mt-0.5">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {!notification.isRead && !showToggleButton && (
          <span className="w-2 h-2 rounded-full bg-primary" />
        )}
        {showToggleButton && (
          <button
            onClick={handleToggleRead}
            className="btn btn-ghost btn-xs"
            title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {notification.isRead ? 'Mark unread' : 'Mark read'}
          </button>
        )}
      </div>
    </Link>
  )
}
