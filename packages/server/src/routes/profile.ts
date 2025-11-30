import { Router, type Router as RouterType } from 'express'
import { eq, sql, and, or, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, entries, deadManSwitches, publicEntries, followers, localFollowers } from '../db/schema.js'
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth.js'
import { env } from '../config/env.js'
import { sendAcceptActivity, sendRejectActivity } from './activitypub.js'

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
    // Common patterns: /users/username, /@username, /u/username
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      // Remove @ prefix if present
      return lastPart.startsWith('@') ? lastPart : `@${lastPart}@${url.hostname}`
    }
    return actorUrl
  } catch {
    return actorUrl
  }
}

// ============================================
// IMPORTANT: These routes must come BEFORE /:username routes
// to avoid "follow-requests" being interpreted as a username
// ============================================

// GET /api/profile/follow-requests - Get pending follow requests for current user (local + remote)
profileRouter.get('/follow-requests', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Get pending LOCAL follow requests where current user is the target
    const localPendingRequests = await db.query.localFollowers.findMany({
      where: and(
        eq(localFollowers.userId, req.user.userId),
        eq(localFollowers.accepted, false)
      ),
      with: {
        follower: true
      }
    })

    // Get pending REMOTE (ActivityPub) follow requests
    const remotePendingRequests = await db.query.followers.findMany({
      where: and(
        eq(followers.userId, req.user.userId),
        eq(followers.accepted, false)
      )
    })

    // Combine both types of requests
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

    // Sort by createdAt descending
    allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({ requests: allRequests })
  } catch (error) {
    console.error('Failed to get follow requests:', error)
    res.status(500).json({ error: 'Failed to get follow requests' })
  }
})

// POST /api/profile/follow-requests/:id/accept - Accept a follow request (local or remote)
profileRouter.post('/follow-requests/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { type } = req.query // 'local' or 'remote'
    const requestId = parseInt(id, 10)

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    if (isNaN(requestId)) {
      res.status(400).json({ error: 'Invalid request ID' })
      return
    }

    // Handle REMOTE (ActivityPub) follow request
    if (type === 'remote') {
      const remoteRequest = await db.query.followers.findFirst({
        where: and(
          eq(followers.id, requestId),
          eq(followers.userId, req.user.userId),
          eq(followers.accepted, false)
        )
      })

      if (!remoteRequest) {
        res.status(404).json({ error: 'Follow request not found' })
        return
      }

      // Get current user for sending Accept activity
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId),
        columns: {
          id: true,
          username: true,
          publicKey: true,
          privateKey: true
        }
      })

      if (!currentUser) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      // Accept the request in database
      await db.update(followers)
        .set({ accepted: true })
        .where(eq(followers.id, requestId))

      // Send Accept activity to the remote follower
      if (currentUser.privateKey && currentUser.username && remoteRequest.followActivityId) {
        // Reconstruct the original Follow activity for the Accept response
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

      res.json({ message: 'Follow request accepted' })
      return
    }

    // Handle LOCAL follow request (default)
    const localRequest = await db.query.localFollowers.findFirst({
      where: and(
        eq(localFollowers.id, requestId),
        eq(localFollowers.userId, req.user.userId),
        eq(localFollowers.accepted, false)
      )
    })

    if (!localRequest) {
      res.status(404).json({ error: 'Follow request not found' })
      return
    }

    // Accept the request
    await db.update(localFollowers)
      .set({ accepted: true })
      .where(eq(localFollowers.id, requestId))

    res.json({ message: 'Follow request accepted' })
  } catch (error) {
    console.error('Failed to accept follow request:', error)
    res.status(500).json({ error: 'Failed to accept follow request' })
  }
})

// POST /api/profile/follow-requests/:id/reject - Reject a follow request (local or remote)
profileRouter.post('/follow-requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { type } = req.query // 'local' or 'remote'
    const requestId = parseInt(id, 10)

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    if (isNaN(requestId)) {
      res.status(400).json({ error: 'Invalid request ID' })
      return
    }

    // Handle REMOTE (ActivityPub) follow request rejection
    if (type === 'remote') {
      const remoteRequest = await db.query.followers.findFirst({
        where: and(
          eq(followers.id, requestId),
          eq(followers.userId, req.user.userId),
          eq(followers.accepted, false)
        )
      })

      if (!remoteRequest) {
        res.status(404).json({ error: 'Follow request not found' })
        return
      }

      // Get current user for sending Reject activity
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId),
        columns: {
          id: true,
          username: true,
          publicKey: true,
          privateKey: true
        }
      })

      if (!currentUser) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      // Delete the request from database
      await db.delete(followers)
        .where(eq(followers.id, requestId))

      // Send Reject activity to the remote follower
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

      res.json({ message: 'Follow request rejected' })
      return
    }

    // Handle LOCAL follow request rejection (default)
    const localRequest = await db.query.localFollowers.findFirst({
      where: and(
        eq(localFollowers.id, requestId),
        eq(localFollowers.userId, req.user.userId),
        eq(localFollowers.accepted, false)
      )
    })

    if (!localRequest) {
      res.status(404).json({ error: 'Follow request not found' })
      return
    }

    // Delete the request
    await db.delete(localFollowers)
      .where(eq(localFollowers.id, requestId))

    res.json({ message: 'Follow request rejected' })
  } catch (error) {
    console.error('Failed to reject follow request:', error)
    res.status(500).json({ error: 'Failed to reject follow request' })
  }
})

// ============================================
// Profile routes with :username parameter
// ============================================

// GET /api/profile/:username - Get public profile (or own profile if authenticated)
profileRouter.get('/:username', optionalAuthMiddleware, async (req, res) => {
  try {
    const { username } = req.params
    const normalizedUsername = username.toLowerCase().trim()

    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername)
    })

    if (!user) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    // Check if this is the user viewing their own profile
    const isOwnProfile = req.user?.userId === user.id

    // Check if user is banned (bannedOn exists and is in the past)
    const now = new Date()
    if (user.bannedOn && user.bannedOn <= now && !isOwnProfile) {
      res.status(403).json({
        error: 'This account has been permanently banned',
        accountStatus: 'banned',
        bannedOn: user.bannedOn
      })
      return
    }

    // Check if user is suspended (suspendedUntil exists and is in the future)
    if (user.suspendedUntil && user.suspendedUntil > now && !isOwnProfile) {
      res.status(403).json({
        error: 'This account is temporarily suspended',
        accountStatus: 'suspended',
        suspendedUntil: user.suspendedUntil
      })
      return
    }

    // Return 404 if profile is private AND not the owner viewing it
    if (user.profileVisibility === 'private' && !isOwnProfile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    // Check local follower status
    let isFollowing = false
    let isFollowPending = false
    if (req.user && !isOwnProfile) {
      const status = await getLocalFollowerStatus(user.id, req.user.userId)
      isFollowing = status.isFollowing
      isFollowPending = status.isPending
    }

    // Determine if viewer can see full profile data
    const canSeeFullProfile = isOwnProfile ||
      user.profileVisibility === 'public' ||
      (user.profileVisibility === 'restricted' && isFollowing)

    // Count entries and switches (only if viewer can see full profile)
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
  } catch (error) {
    console.error('Failed to get profile:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

// GET /api/profile/:username/notes - Get notes for a user's profile
// Visibility filtering based on viewer relationship:
// - Owner sees all notes (public, followers, private)
// - Followers see public and followers-only notes
// - Anonymous/non-followers see only public notes
profileRouter.get('/:username/notes', optionalAuthMiddleware, async (req, res) => {
  try {
    const { username } = req.params
    const normalizedUsername = username.toLowerCase().trim()

    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername)
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Check relationships
    const isOwner = req.user?.userId === user.id

    // Check if user is banned or suspended (only block non-owners)
    const now = new Date()
    if (!isOwner) {
      if (user.bannedOn && user.bannedOn <= now) {
        res.status(403).json({
          error: 'This account has been permanently banned',
          accountStatus: 'banned'
        })
        return
      }
      if (user.suspendedUntil && user.suspendedUntil > now) {
        res.status(403).json({
          error: 'This account is temporarily suspended',
          accountStatus: 'suspended'
        })
        return
      }
    }

    let isFollower = false

    if (req.user && !isOwner) {
      // Check local followers first
      const localFollowerStatus = await getLocalFollowerStatus(user.id, req.user.userId)
      isFollower = localFollowerStatus.isFollowing

      // Also check ActivityPub followers for backwards compatibility
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

    // Determine which visibility levels to show
    let visibilityFilter: string[]
    if (isOwner) {
      visibilityFilter = ['public', 'followers', 'private']
    } else if (isFollower) {
      visibilityFilter = ['public', 'followers']
    } else {
      visibilityFilter = ['public']
    }

    // Fetch notes with appropriate visibility
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
  } catch (error) {
    console.error('Failed to get notes:', error)
    res.status(500).json({ error: 'Failed to get notes' })
  }
})

// GET /api/profile/:username/notes/:noteId - Get a single note (respects visibility)
profileRouter.get('/:username/notes/:noteId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { username, noteId } = req.params
    const normalizedUsername = username.toLowerCase().trim()

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername)
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Check if profile is private
    if (user.profileVisibility === 'private') {
      // Only the owner can see private profiles
      if (!req.user || req.user.userId !== user.id) {
        res.status(404).json({ error: 'Note not found' })
        return
      }
    }

    // Find the note
    const noteIdNum = parseInt(noteId)
    if (isNaN(noteIdNum)) {
      res.status(400).json({ error: 'Invalid note ID' })
      return
    }

    const note = await db.query.publicEntries.findFirst({
      where: and(
        eq(publicEntries.id, noteIdNum),
        eq(publicEntries.userId, user.id)
      )
    })

    if (!note) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    // Check if the note is banned
    if (note.bannedOn) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    const isOwner = req.user?.userId === user.id

    // Check visibility permissions
    if (note.visibility === 'private') {
      // Only the owner can see private notes
      if (!isOwner) {
        res.status(404).json({ error: 'Note not found' })
        return
      }
    } else if (note.visibility === 'followers') {
      // Owner can always see
      if (!isOwner) {
        // Check if viewer is a follower
        let isFollower = false

        if (req.user) {
          // Check local followers
          const localFollowerStatus = await getLocalFollowerStatus(user.id, req.user.userId)
          isFollower = localFollowerStatus.isFollowing

          // Also check ActivityPub followers
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
          res.status(404).json({ error: 'Note not found' })
          return
        }
      }
    }
    // 'public' notes are visible to everyone

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
  } catch (error) {
    console.error('Failed to get note:', error)
    res.status(500).json({ error: 'Failed to get note' })
  }
})

// POST /api/profile/:username/follow - Send follow request
profileRouter.post('/:username/follow', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params
    const normalizedUsername = username.toLowerCase().trim()

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Find target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername)
    })

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Can't follow yourself
    if (targetUser.id === req.user.userId) {
      res.status(400).json({ error: 'Cannot follow yourself' })
      return
    }

    // Check if already following or pending
    const existingFollow = await db.query.localFollowers.findFirst({
      where: and(
        eq(localFollowers.userId, targetUser.id),
        eq(localFollowers.followerId, req.user.userId)
      )
    })

    if (existingFollow) {
      if (existingFollow.accepted) {
        res.status(400).json({ error: 'Already following this user' })
      } else {
        res.status(400).json({ error: 'Follow request already pending' })
      }
      return
    }

    // For public profiles, auto-accept. For restricted, require approval.
    const autoAccept = targetUser.profileVisibility === 'public'

    await db.insert(localFollowers).values({
      userId: targetUser.id,
      followerId: req.user.userId,
      accepted: autoAccept
    })

    if (autoAccept) {
      res.json({ message: 'Now following this user', status: 'following' })
    } else {
      res.json({ message: 'Follow request sent', status: 'pending' })
    }
  } catch (error) {
    console.error('Failed to follow user:', error)
    res.status(500).json({ error: 'Failed to follow user' })
  }
})

// DELETE /api/profile/:username/follow - Unfollow or cancel follow request
profileRouter.delete('/:username/follow', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params
    const normalizedUsername = username.toLowerCase().trim()

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Find target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername)
    })

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Delete the follow relationship
    const result = await db.delete(localFollowers)
      .where(and(
        eq(localFollowers.userId, targetUser.id),
        eq(localFollowers.followerId, req.user.userId)
      ))
      .returning()

    if (result.length === 0) {
      res.status(400).json({ error: 'Not following this user' })
      return
    }

    res.json({ message: 'Unfollowed successfully' })
  } catch (error) {
    console.error('Failed to unfollow user:', error)
    res.status(500).json({ error: 'Failed to unfollow user' })
  }
})

