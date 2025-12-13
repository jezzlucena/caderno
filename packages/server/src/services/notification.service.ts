import { eq, and, desc, lt, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { notifications, users, localFollowers, type Notification } from '../db/schema.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('NotificationService')

export type NotificationType = 'new_post' | 'follow_request' | 'follow_accepted'
export type ReferenceType = 'public_entry' | 'local_follower' | 'remote_follower'

export interface CreateNotificationParams {
  userId: number
  type: NotificationType
  actorId?: number
  actorActorUrl?: string
  referenceId?: number
  referenceType?: ReferenceType
}

export interface NotificationWithActor {
  id: number
  type: string
  isRead: boolean
  createdAt: Date
  referenceId: number | null
  referenceType: string | null
  actorActorUrl: string | null
  actor: {
    id: number
    username: string | null
    displayName: string | null
    avatarUrl: string | null
  } | null
}

// Will be set by websocket service after initialization
let emitToUserFn: ((userId: number, event: string, data: unknown) => void) | null = null

export function setEmitToUser(fn: (userId: number, event: string, data: unknown) => void) {
  emitToUserFn = fn
}

/**
 * Create a single notification
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  // Don't create notification if actor is the same as recipient
  if (params.actorId && params.actorId === params.userId) {
    return null
  }

  try {
    const [notification] = await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      actorId: params.actorId ?? null,
      actorActorUrl: params.actorActorUrl ?? null,
      referenceId: params.referenceId ?? null,
      referenceType: params.referenceType ?? null
    }).returning()

    logger.debug('Notification created', { type: params.type, userId: params.userId, notificationId: notification.id })

    // Emit real-time notification if WebSocket is available
    if (emitToUserFn) {
      // Fetch the full notification with actor info
      const fullNotification = await getNotificationById(notification.id)
      if (fullNotification) {
        emitToUserFn(params.userId, 'notification:new', fullNotification)

        // Also send updated unread count
        const count = await getUnreadCount(params.userId)
        emitToUserFn(params.userId, 'notification:count', { count })
      }
    }

    return notification
  } catch (error) {
    logger.error('Failed to create notification', error)
    return null
  }
}

/**
 * Create notifications for all followers when a user publishes a post
 */
export async function createNotificationsForFollowers(
  authorId: number,
  entryId: number
): Promise<void> {
  try {
    // Get all local followers who have accepted the follow
    const followersList = await db.query.localFollowers.findMany({
      where: and(
        eq(localFollowers.userId, authorId),
        eq(localFollowers.accepted, true)
      )
    })

    if (followersList.length === 0) {
      return
    }

    // Batch insert notifications
    const notificationValues = followersList.map(f => ({
      userId: f.followerId,
      type: 'new_post' as const,
      actorId: authorId,
      referenceId: entryId,
      referenceType: 'public_entry' as const
    }))

    await db.insert(notifications).values(notificationValues)

    logger.debug('Created notifications for followers', {
      authorId,
      entryId,
      count: followersList.length
    })

    // Emit real-time notifications to each follower
    if (emitToUserFn) {
      for (const follower of followersList) {
        const count = await getUnreadCount(follower.followerId)
        emitToUserFn(follower.followerId, 'notification:count', { count })
      }
    }
  } catch (error) {
    logger.error('Failed to create follower notifications', error)
  }
}

/**
 * Get a single notification by ID with actor info
 */
async function getNotificationById(notificationId: number): Promise<NotificationWithActor | null> {
  const notification = await db.query.notifications.findFirst({
    where: eq(notifications.id, notificationId),
    with: {
      actor: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    }
  })

  if (!notification) return null

  return {
    id: notification.id,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    referenceId: notification.referenceId,
    referenceType: notification.referenceType,
    actorActorUrl: notification.actorActorUrl,
    actor: notification.actor ? {
      id: notification.actor.id,
      username: notification.actor.username,
      displayName: notification.actor.displayName,
      avatarUrl: notification.actor.avatarUrl
    } : null
  }
}

/**
 * Get unread notification count for a user (capped at 100)
 */
export async function getUnreadCount(userId: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ))

  // Cap at 100 for performance
  return Math.min(result[0]?.count ?? 0, 100)
}

/**
 * Get paginated notifications for a user
 */
export async function getNotifications(
  userId: number,
  cursor?: string,
  limit: number = 20
): Promise<{ notifications: NotificationWithActor[], nextCursor: string | null, hasMore: boolean }> {
  const maxLimit = Math.min(limit, 50)

  // Build where condition
  const whereCondition = cursor
    ? and(
        eq(notifications.userId, userId),
        lt(notifications.createdAt, new Date(cursor))
      )
    : eq(notifications.userId, userId)

  // Query with limit + 1 to check hasMore
  const results = await db.query.notifications.findMany({
    where: whereCondition,
    orderBy: [desc(notifications.createdAt)],
    limit: maxLimit + 1,
    with: {
      actor: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    }
  })

  const hasMore = results.length > maxLimit
  const items = results.slice(0, maxLimit)

  return {
    notifications: items.map(n => ({
      id: n.id,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
      referenceId: n.referenceId,
      referenceType: n.referenceType,
      actorActorUrl: n.actorActorUrl,
      actor: n.actor ? {
        id: n.actor.id,
        username: n.actor.username,
        displayName: n.actor.displayName,
        avatarUrl: n.actor.avatarUrl
      } : null
    })),
    nextCursor: items.length > 0 && hasMore
      ? items[items.length - 1].createdAt.toISOString()
      : null,
    hasMore
  }
}

/**
 * Toggle read status for a notification
 */
export async function toggleReadStatus(
  notificationId: number,
  userId: number,
  isRead: boolean
): Promise<Notification | null> {
  const [updated] = await db.update(notifications)
    .set({ isRead })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ))
    .returning()

  if (updated && emitToUserFn) {
    const count = await getUnreadCount(userId)
    emitToUserFn(userId, 'notification:count', { count })
  }

  return updated || null
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: number): Promise<number> {
  const result = await db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ))
    .returning()

  if (emitToUserFn) {
    emitToUserFn(userId, 'notification:count', { count: 0 })
  }

  return result.length
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number, userId: number): Promise<boolean> {
  const result = await db.delete(notifications)
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ))
    .returning()

  if (result.length > 0 && emitToUserFn) {
    const count = await getUnreadCount(userId)
    emitToUserFn(userId, 'notification:count', { count })
  }

  return result.length > 0
}
