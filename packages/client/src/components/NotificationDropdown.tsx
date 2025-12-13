import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationStore } from '../stores/notificationStore'
import { NotificationItem } from './NotificationItem'

const MAX_DROPDOWN_ITEMS = 9

export function NotificationDropdown() {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    setDropdownOpen
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const displayNotifications = notifications.slice(0, MAX_DROPDOWN_ITEMS)
  const hasUnread = notifications.some(n => !n.isRead)

  return (
    <div className="dropdown-content z-50 menu p-0 shadow-lg bg-base-100 rounded-box w-80 max-h-[28rem] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
        <span className="font-semibold">Notifications</span>
        {hasUnread && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => markAllAsRead()}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto max-h-72">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">
            <p>No notifications yet</p>
          </div>
        ) : (
          displayNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => setDropdownOpen(false)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-base-200 p-2">
        <Link
          to="/notifications"
          className="btn btn-ghost btn-sm btn-block"
          onClick={() => setDropdownOpen(false)}
        >
          View all notifications
        </Link>
      </div>
    </div>
  )
}
