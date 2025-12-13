import { useEffect, useRef } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { useNotificationStore } from '../stores/notificationStore'
import { useNotificationSocket } from '../hooks/useNotificationSocket'
import { NotificationDropdown } from './NotificationDropdown'

export function NotificationBell() {
  const {
    unreadCount,
    isDropdownOpen,
    setDropdownOpen,
    fetchUnreadCount
  } = useNotificationStore()

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket connection for real-time updates
  useNotificationSocket()

  // Initial fetch of unread count
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Handle visibility change - refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchUnreadCount])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, setDropdownOpen])

  const formatBadge = (count: number): string => {
    if (count > 99) return '99+'
    return count.toString()
  }

  return (
    <div className="dropdown dropdown-end" ref={dropdownRef}>
      <button
        className="btn btn-ghost btn-sm btn-circle relative"
        onClick={() => setDropdownOpen(!isDropdownOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="badge badge-primary badge-xs absolute -top-1 -right-1 text-[10px] px-1 min-w-[18px] h-[18px] font-medium">
            {formatBadge(unreadCount)}
          </span>
        )}
      </button>

      {isDropdownOpen && <NotificationDropdown />}
    </div>
  )
}
