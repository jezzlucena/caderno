import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'
import type { Notification } from '../lib/api'

// Get WebSocket URL - same as API but for WebSocket connection
const getSocketUrl = () => {
  // In development, connect to the server directly
  // In production, use the same origin
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  return window.location.origin
}

export function useNotificationSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { token, user } = useAuthStore()

  // Use refs to avoid stale closures in socket event handlers
  const storeActionsRef = useRef(useNotificationStore.getState())

  // Keep ref updated with latest store actions
  useEffect(() => {
    return useNotificationStore.subscribe((state) => {
      storeActionsRef.current = state
    })
  }, [])

  useEffect(() => {
    // Only connect if authenticated
    if (!user || !token) {
      // Disconnect if we were connected
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) {
      return
    }

    // Create socket connection with auth
    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected')
      // Fetch current unread count on reconnect
      storeActionsRef.current.fetchUnreadCount()
    })

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message)
    })

    // Notification events - use ref to always get latest store actions
    socket.on('notification:new', (notification: Notification) => {
      console.log('[WebSocket] New notification:', notification)
      storeActionsRef.current.addNotification(notification)
    })

    socket.on('notification:count', (data: { count: number }) => {
      console.log('[WebSocket] Unread count update:', data.count)
      storeActionsRef.current.updateUnreadCount(data.count)
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, token])

  return socketRef.current
}
