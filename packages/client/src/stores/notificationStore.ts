import { create } from 'zustand'
import { notificationApi, type Notification } from '../lib/api'
import { getErrorMessage } from '../lib/storeUtils'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isFetchingMore: boolean
  error: string | null
  hasMore: boolean
  nextCursor: string | null
  isDropdownOpen: boolean

  // Actions
  fetchUnreadCount: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchMoreNotifications: () => Promise<void>
  toggleRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
  updateUnreadCount: (count: number) => void
  setDropdownOpen: (open: boolean) => void
  clearError: () => void
  reset: () => void
}

// Prevent concurrent fetches
let isFetchingCount = false
let isFetchingNotifications = false

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isFetchingMore: false,
  error: null,
  hasMore: true,
  nextCursor: null,
  isDropdownOpen: false,

  fetchUnreadCount: async () => {
    if (isFetchingCount) return
    isFetchingCount = true

    try {
      const { count } = await notificationApi.getUnreadCount()
      set({ unreadCount: count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    } finally {
      isFetchingCount = false
    }
  },

  fetchNotifications: async () => {
    if (isFetchingNotifications || get().isLoading) return
    isFetchingNotifications = true
    set({ isLoading: true, error: null })

    try {
      const response = await notificationApi.list()
      set({
        notifications: response.notifications,
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
        isLoading: false
      })
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to fetch notifications'),
        isLoading: false
      })
    } finally {
      isFetchingNotifications = false
    }
  },

  fetchMoreNotifications: async () => {
    const { nextCursor, hasMore, isFetchingMore } = get()
    if (!nextCursor || !hasMore || isFetchingMore) return

    set({ isFetchingMore: true })

    try {
      const response = await notificationApi.list(nextCursor)
      set(state => ({
        notifications: [...state.notifications, ...response.notifications],
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
        isFetchingMore: false
      }))
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to load more notifications'),
        isFetchingMore: false
      })
    }
  },

  toggleRead: async (id: number) => {
    const notification = get().notifications.find(n => n.id === id)
    if (!notification) return

    const newIsRead = !notification.isRead
    const previousUnreadCount = get().unreadCount

    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, isRead: newIsRead } : n
      ),
      unreadCount: newIsRead
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount + 1
    }))

    try {
      await notificationApi.toggleRead(id, newIsRead)
    } catch (error) {
      // Revert on error
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: !newIsRead } : n
        ),
        unreadCount: previousUnreadCount
      }))
      console.error('Failed to toggle notification read status:', error)
    }
  },

  markAllAsRead: async () => {
    const previousNotifications = get().notifications
    const previousUnreadCount = get().unreadCount

    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    }))

    try {
      await notificationApi.markAllAsRead()
    } catch (error) {
      // Revert on error
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount
      })
      console.error('Failed to mark all as read:', error)
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1
    }))
  },

  updateUnreadCount: (count: number) => {
    set({ unreadCount: count })
  },

  setDropdownOpen: (open: boolean) => {
    set({ isDropdownOpen: open })
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isFetchingMore: false,
      error: null,
      hasMore: true,
      nextCursor: null,
      isDropdownOpen: false
    })
  }
}))
