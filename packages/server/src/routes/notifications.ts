import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, notFound, badRequest } from '../middleware/errorHandler.js'
import { parseId } from '../utils/validation.js'
import { createLogger } from '../utils/logger.js'
import {
  getNotifications,
  getUnreadCount,
  toggleReadStatus,
  markAllAsRead,
  deleteNotification
} from '../services/notification.service.js'

const logger = createLogger('Notifications')

export const notificationsRouter: RouterType = Router()

// All routes require authentication
notificationsRouter.use(authMiddleware)

// Validation schemas
const toggleReadSchema = z.object({
  isRead: z.boolean()
})

// GET /api/notifications - List notifications with cursor pagination
notificationsRouter.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const cursor = req.query.cursor as string | undefined
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

  // Validate cursor format if provided
  if (cursor) {
    const cursorDate = new Date(cursor)
    if (isNaN(cursorDate.getTime())) {
      throw badRequest('Invalid cursor format')
    }
  }

  const result = await getNotifications(userId, cursor, limit)

  logger.debug('Fetched notifications', { userId, count: result.notifications.length, hasMore: result.hasMore })

  res.json(result)
}))

// GET /api/notifications/unread-count - Get unread notification count
notificationsRouter.get('/unread-count', asyncHandler(async (req, res) => {
  const userId = req.user!.userId

  const count = await getUnreadCount(userId)

  res.json({ count })
}))

// PUT /api/notifications/:id/read - Toggle read status
notificationsRouter.put('/:id/read', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const notificationId = parseId(req.params.id, 'notification')

  const { isRead } = toggleReadSchema.parse(req.body)

  const notification = await toggleReadStatus(notificationId, userId, isRead)

  if (!notification) {
    throw notFound('Notification')
  }

  logger.debug('Toggled notification read status', { notificationId, userId, isRead })

  res.json({ notification })
}))

// PUT /api/notifications/read-all - Mark all notifications as read
notificationsRouter.put('/read-all', asyncHandler(async (req, res) => {
  const userId = req.user!.userId

  const count = await markAllAsRead(userId)

  logger.debug('Marked all notifications as read', { userId, count })

  res.json({ message: 'All notifications marked as read', count })
}))

// DELETE /api/notifications/:id - Delete a notification
notificationsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const notificationId = parseId(req.params.id, 'notification')

  const deleted = await deleteNotification(notificationId, userId)

  if (!deleted) {
    throw notFound('Notification')
  }

  logger.debug('Deleted notification', { notificationId, userId })

  res.json({ message: 'Notification deleted' })
}))
