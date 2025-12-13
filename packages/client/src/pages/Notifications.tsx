import { useEffect, useRef, useCallback } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { Navbar } from '../components/Navbar'
import { NotificationItem } from '../components/NotificationItem'
import { useNotificationStore } from '../stores/notificationStore'

export function Notifications() {
  const {
    notifications,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    fetchNotifications,
    fetchMoreNotifications,
    markAllAsRead,
    clearError
  } = useNotificationStore()

  const observerRef = useRef<HTMLDivElement>(null)

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading) {
        fetchMoreNotifications()
      }
    },
    [hasMore, isFetchingMore, isLoading, fetchMoreNotifications]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [handleObserver])

  const hasUnread = notifications.some(n => !n.isRead)

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar currentPage="notifications" />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {hasUnread && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={clearError}>
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body items-center text-center py-12">
              <BellIcon className="w-16 h-16 text-base-content/30 mb-4" />
              <h2 className="card-title">No notifications</h2>
              <p className="text-base-content/70">
                You'll see notifications here when people interact with you.
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-lg overflow-hidden">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                showToggleButton={true}
              />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-4" />

            {/* Loading more indicator */}
            {isFetchingMore && (
              <div className="flex justify-center py-4 border-t border-base-200">
                <span className="loading loading-spinner loading-sm" />
              </div>
            )}

            {/* End of list */}
            {!hasMore && notifications.length > 0 && (
              <div className="text-center py-6 text-base-content/60 border-t border-base-200">
                No more notifications
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
