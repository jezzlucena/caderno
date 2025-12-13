import { Router, type Router as RouterType } from 'express'
import { eq, sql, and, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, entries, deadManSwitches, publicEntries, followers, localFollowers } from '../db/schema.js'
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth.js'
import { asyncHandler, notFound, badRequest, unauthorized, forbidden } from '../middleware/errorHandler.js'
import { parseId } from '../utils/validation.js'
import { createLogger } from '../utils/logger.js'
import { env } from '../config/env.js'
import { sendAcceptActivity, sendRejectActivity } from './activitypub.js'
import { createNotification } from '../services/notification.service.js'

const logger = createLogger('Profile')

export const profileRouter: RouterType = Router()

// Helper function to check local follower status
async function getLocalFollowerStatus(userId: number, followerId: number): Promise<{ isFollowing: boolean; isPending: boolean }> {
  const record = await db.query.localFollowers.findFirst({
    where: and(
      eq(localFollowers.userId, userId),
      eq(localFollowers.followerId, followerId)
    )
  })
  if (!record) {
    return { isFollowing: false, isPending: false }
  }
  return { isFollowing: record.accepted, isPending: !record.accepted }
}

// Helper to extract username from ActivityPub actor URL
function extractUsernameFromActorUrl(actorUrl: string): string {
  try {
    const url = new URL(actorUrl)
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      return lastPart.startsWith('@') ? lastPart : `@${lastPart}@${url.hostname}`
    }
    return actorUrl
  } catch {
    return actorUrl
  }
}

// ============================================
// IMPORTANT: These routes must come BEFORE /:username routes
// ============================================

// GET /api/profile/follow-requests - Get pending follow requests for current user
profileRouter.get('/follow-requests', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const localPendingRequests = await db.query.localFollowers.findMany({
    where: and(
      eq(localFollowers.userId, req.user.userId),
      eq(localFollowers.accepted, false)
    ),
    with: {
      follower: true
    }
  })

  const remotePendingRequests = await db.query.followers.findMany({
    where: and(
      eq(followers.userId, req.user.userId),
      eq(followers.accepted, false)
    )
  })

  const allRequests = [
    ...localPendingRequests.map(r => ({
      id: r.id,
      type: 'local' as const,
      follower: {
        id: r.follower.id,
        username: r.follower.username,
        displayName: r.follower.displayName,
        avatarUrl: r.follower.avatarUrl,
        actorUrl: null
      },
      createdAt: r.createdAt
    })),
    ...remotePendingRequests.map(r => ({
      id: r.id,
      type: 'remote' as const,
      follower: {
        id: null,
        username: extractUsernameFromActorUrl(r.followerActorUrl),
        displayName: null,
        avatarUrl: null,
        actorUrl: r.followerActorUrl
      },
      createdAt: r.createdAt
    }))
  ]

  allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({ requests: allRequests })
}))

// POST /api/profile/follow-requests/:id/accept - Accept a follow request
profileRouter.post('/follow-requests/:id/accept', authMiddleware, asyncHandler(async (req, res) => {
  const { type } = req.query
  const requestId = parseId(req.params.id, 'request')

  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  if (type === 'remote') {
    const remoteRequest = await db.query.followers.findFirst({
      where: and(
        eq(followers.id, requestId),
        eq(followers.userId, req.user.userId),
        eq(followers.accepted, false)
      )
    })

    if (!remoteRequest) {
      throw notFound('Follow request')
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
      columns: { id: true, username: true, publicKey: true, privateKey: true }
    })

    if (!currentUser) {
      throw notFound('User')
    }

    await db.update(followers)
      .set({ accepted: true })
      .where(eq(followers.id, requestId))

    if (currentUser.privateKey && currentUser.username && remoteRequest.followActivityId) {
      const originalFollowActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: remoteRequest.followActivityId,
        type: 'Follow',
        actor: remoteRequest.followerActorUrl,
        object: `${env.SERVER_URL}/users/${currentUser.username}`
      }

      await sendAcceptActivity(
        currentUser,
        remoteRequest.followerActorUrl,
        remoteRequest.followerInbox,
        originalFollowActivity
      )
    }

    logger.debug('Remote follow request accepted', { requestId })
    res.json({ message: 'Follow request accepted' })
    return
  }

  // Handle LOCAL follow request
  const localRequest = await db.query.localFollowers.findFirst({
    where: and(
      eq(localFollowers.id, requestId),
      eq(localFollowers.userId, req.user.userId),
      eq(localFollowers.accepted, false)
    )
  })

  if (!localRequest) {
    throw notFound('Follow request')
  }

  await db.update(localFollowers)
    .set({ accepted: true })
    .where(eq(localFollowers.id, requestId))

  // Notify the follower that their request was accepted
  createNotification({
    userId: localRequest.followerId,
    type: 'follow_accepted',
    actorId: req.user.userId,
    referenceId: requestId,
    referenceType: 'local_follower'
  }).catch(err => logger.error('Failed to create follow accepted notification:', err))

  logger.debug('Local follow request accepted', { requestId })
  res.json({ message: 'Follow request accepted' })
}))

// POST /api/profile/follow-requests/:id/reject - Reject a follow request
profileRouter.post('/follow-requests/:id/reject', authMiddleware, asyncHandler(async (req, res) => {
  const { type } = req.query
  const requestId = parseId(req.params.id, 'request')

  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  if (type === 'remote') {
    const remoteRequest = await db.query.followers.findFirst({
      where: and(
        eq(followers.id, requestId),
        eq(followers.userId, req.user.userId),
        eq(followers.accepted, false)
      )
    })

    if (!remoteRequest) {
      throw notFound('Follow request')
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
      columns: { id: true, username: true, publicKey: true, privateKey: true }
    })

    if (!currentUser) {
      throw notFound('User')
    }

    await db.delete(followers).where(eq(followers.id, requestId))

    if (currentUser.privateKey && currentUser.username && remoteRequest.followActivityId) {
      const originalFollowActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: remoteRequest.followActivityId,
        type: 'Follow',
        actor: remoteRequest.followerActorUrl,
        object: `${env.SERVER_URL}/users/${currentUser.username}`
      }

      await sendRejectActivity(
        currentUser,
        remoteRequest.followerActorUrl,
        remoteRequest.followerInbox,
        originalFollowActivity
      )
    }

    logger.debug('Remote follow request rejected', { requestId })
    res.json({ message: 'Follow request rejected' })
    return
  }

  // Handle LOCAL follow request rejection
  const localRequest = await db.query.localFollowers.findFirst({
    where: and(
      eq(localFollowers.id, requestId),
      eq(localFollowers.userId, req.user.userId),
      eq(localFollowers.accepted, false)
    )
  })

  if (!localRequest) {
    throw notFound('Follow request')
  }

  await db.delete(localFollowers).where(eq(localFollowers.id, requestId))

  logger.debug('Local follow request rejected', { requestId })
  res.json({ message: 'Follow request rejected' })
}))

// ============================================
// Profile routes with :username parameter
// ============================================

// GET /api/profile/:username - Get public profile
profileRouter.get('/:username', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { username } = req.params
  const normalizedUsername = username.toLowerCase().trim()

  const user = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername)
  })

  if (!user) {
    throw notFound('Profile')
  }

  const isOwnProfile = req.user?.userId === user.id
  const now = new Date()

  if (user.bannedOn && user.bannedOn <= now && !isOwnProfile) {
    throw forbidden('This account has been permanently banned')
  }

  if (user.suspendedUntil && user.suspendedUntil > now && !isOwnProfile) {
    throw forbidden('This account is temporarily suspended')
  }

  if (user.profileVisibility === 'private' && !isOwnProfile) {
    throw notFound('Profile')
  }

  let isFollowing = false
  let isFollowPending = false
  if (req.user && !isOwnProfile) {
    const status = await getLocalFollowerStatus(user.id, req.user.userId)
    isFollowing = status.isFollowing
    isFollowPending = status.isPending
  }

  const canSeeFullProfile = isOwnProfile ||
    user.profileVisibility === 'public' ||
    (user.profileVisibility === 'restricted' && isFollowing)

  let entryCount = 0
  let switchCount = 0
  if (canSeeFullProfile) {
    const entryCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(entries)
      .where(eq(entries.userId, user.id))
    entryCount = entryCountResult[0]?.count ?? 0

    const switchCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deadManSwitches)
      .where(eq(deadManSwitches.userId, user.id))
    switchCount = switchCountResult[0]?.count ?? 0
  }

  res.json({
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    entryCount: canSeeFullProfile ? entryCount : null,
    switchCount: canSeeFullProfile ? switchCount : null,
    createdAt: user.createdAt,
    isOwnProfile,
    profileVisibility: user.profileVisibility,
    isFollowing,
    isFollowPending,
    isRestricted: user.profileVisibility === 'restricted' && !isFollowing && !isOwnProfile
  })
}))

// GET /api/profile/:username/notes - Get notes for a user's profile
profileRouter.get('/:username/notes', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { username } = req.params
  const normalizedUsername = username.toLowerCase().trim()

  const user = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername)
  })

  if (!user) {
    throw notFound('User')
  }

  const isOwner = req.user?.userId === user.id
  const now = new Date()

  if (!isOwner) {
    if (user.bannedOn && user.bannedOn <= now) {
      throw forbidden('This account has been permanently banned')
    }
    if (user.suspendedUntil && user.suspendedUntil > now) {
      throw forbidden('This account is temporarily suspended')
    }
  }

  let isFollower = false
  if (req.user && !isOwner) {
    const localFollowerStatus = await getLocalFollowerStatus(user.id, req.user.userId)
    isFollower = localFollowerStatus.isFollowing

    if (!isFollower) {
      const viewerUser = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId)
      })

      if (viewerUser?.username) {
        const viewerActorUrl = `${env.SERVER_URL}/users/${viewerUser.username}`
        const followerRecord = await db.query.followers.findFirst({
          where: and(
            eq(followers.userId, user.id),
            eq(followers.followerActorUrl, viewerActorUrl)
          )
        })
        isFollower = !!followerRecord
      }
    }
  }

  let visibilityFilter: string[]
  if (isOwner) {
    visibilityFilter = ['public', 'followers', 'private']
  } else if (isFollower) {
    visibilityFilter = ['public', 'followers']
  } else {
    visibilityFilter = ['public']
  }

  const notes = await db.query.publicEntries.findMany({
    where: and(
      eq(publicEntries.userId, user.id),
      inArray(publicEntries.visibility, visibilityFilter)
    ),
    orderBy: (entries, { desc }) => [desc(entries.published)]
  })

  res.json({
    notes: notes.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      visibility: n.visibility,
      published: n.published
    })),
    isOwner,
    isFollower
  })
}))

// GET /api/profile/:username/notes/:noteId - Get a single note
profileRouter.get('/:username/notes/:noteId', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { username, noteId } = req.params
  const normalizedUsername = username.toLowerCase().trim()

  const user = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername)
  })

  if (!user) {
    throw notFound('User')
  }

  if (user.profileVisibility === 'private') {
    if (!req.user || req.user.userId !== user.id) {
      throw notFound('Note')
    }
  }

  const noteIdNum = parseId(noteId, 'note')

  const note = await db.query.publicEntries.findFirst({
    where: and(
      eq(publicEntries.id, noteIdNum),
      eq(publicEntries.userId, user.id)
    )
  })

  if (!note || note.bannedOn) {
    throw notFound('Note')
  }

  const isOwner = req.user?.userId === user.id

  if (note.visibility === 'private' && !isOwner) {
    throw notFound('Note')
  }

  if (note.visibility === 'followers' && !isOwner) {
    let isFollower = false

    if (req.user) {
      const localFollowerStatus = await getLocalFollowerStatus(user.id, req.user.userId)
      isFollower = localFollowerStatus.isFollowing

      if (!isFollower) {
        const viewerUser = await db.query.users.findFirst({
          where: eq(users.id, req.user.userId)
        })

        if (viewerUser?.username) {
          const viewerActorUrl = `${env.SERVER_URL}/users/${viewerUser.username}`
          const followerRecord = await db.query.followers.findFirst({
            where: and(
              eq(followers.userId, user.id),
              eq(followers.followerActorUrl, viewerActorUrl),
              eq(followers.accepted, true)
            )
          })
          isFollower = !!followerRecord
        }
      }
    }

    if (!isFollower) {
      throw notFound('Note')
    }
  }

  res.json({
    note: {
      id: note.id,
      title: note.title,
      content: note.content,
      visibility: note.visibility,
      published: note.published
    },
    author: {
      username: user.username,
      displayName: user.displayName
    },
    isOwner
  })
}))

// POST /api/profile/:username/follow - Send follow request
profileRouter.post('/:username/follow', authMiddleware, asyncHandler(async (req, res) => {
  const { username } = req.params
  const normalizedUsername = username.toLowerCase().trim()

  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername)
  })

  if (!targetUser) {
    throw notFound('User')
  }

  if (targetUser.id === req.user.userId) {
    throw badRequest('Cannot follow yourself')
  }

  const existingFollow = await db.query.localFollowers.findFirst({
    where: and(
      eq(localFollowers.userId, targetUser.id),
      eq(localFollowers.followerId, req.user.userId)
    )
  })

  if (existingFollow) {
    if (existingFollow.accepted) {
      throw badRequest('Already following this user')
    } else {
      throw badRequest('Follow request already pending')
    }
  }

  const autoAccept = targetUser.profileVisibility === 'public'

  const [newFollow] = await db.insert(localFollowers).values({
    userId: targetUser.id,
    followerId: req.user.userId,
    accepted: autoAccept
  }).returning()

  logger.debug('Follow request sent', { from: req.user.userId, to: targetUser.id, autoAccept })

  // Create notification for follow request (only for restricted profiles - pending requests)
  if (!autoAccept) {
    createNotification({
      userId: targetUser.id,
      type: 'follow_request',
      actorId: req.user.userId,
      referenceId: newFollow.id,
      referenceType: 'local_follower'
    }).catch(err => logger.error('Failed to create follow request notification:', err))
  }

  if (autoAccept) {
    res.json({ message: 'Now following this user', status: 'following' })
  } else {
    res.json({ message: 'Follow request sent', status: 'pending' })
  }
}))

// DELETE /api/profile/:username/follow - Unfollow or cancel follow request
profileRouter.delete('/:username/follow', authMiddleware, asyncHandler(async (req, res) => {
  const { username } = req.params
  const normalizedUsername = username.toLowerCase().trim()

  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername)
  })

  if (!targetUser) {
    throw notFound('User')
  }

  const result = await db.delete(localFollowers)
    .where(and(
      eq(localFollowers.userId, targetUser.id),
      eq(localFollowers.followerId, req.user.userId)
    ))
    .returning()

  if (result.length === 0) {
    throw badRequest('Not following this user')
  }

  logger.debug('Unfollowed', { from: req.user.userId, to: targetUser.id })
  res.json({ message: 'Unfollowed successfully' })
}))
