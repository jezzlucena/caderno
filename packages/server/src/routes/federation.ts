import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, publicEntries, followers, following, localFollowers } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { generateRSAKeyPair, isValidUsername, normalizeUsername } from '../services/federation.service.js'
import { env } from '../config/env.js'
import { randomUUID } from 'crypto'
import { deliverToFollowers, deliverActivity } from './activitypub.js'

export const federationRouter: RouterType = Router()

// All routes require authentication
federationRouter.use(authMiddleware)

// Validation schemas
const updateProfileSchema = z.object({
  federationEnabled: z.boolean().optional()
})

const publishEntrySchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string().min(1).max(50000), // 50KB max for public entries
  visibility: z.enum(['public', 'followers', 'private']).default('public')
})

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  content: z.string().min(1).max(50000).optional(),
  visibility: z.enum(['public', 'followers', 'private']).optional()
})

const followSchema = z.object({
  handle: z.string().min(1).max(200).trim() // @username@domain or @username or username@domain
})

// GET /api/federation/profile - Get current user's federation profile
federationRouter.get('/profile', async (req, res) => {
  try {
    const userId = req.user!.userId

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Get follower/following counts
    const followerCount = await db.query.followers.findMany({
      where: eq(followers.userId, userId)
    })

    const followingList = await db.query.following.findMany({
      where: eq(following.userId, userId)
    })

    res.json({
      profile: {
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        federationEnabled: user.federationEnabled,
        hasKeys: !!user.publicKey,
        actorUrl: user.username ? `${env.SERVER_URL}/users/${user.username}` : null,
        handle: user.username ? `@${user.username}@${env.FEDERATION_DOMAIN}` : null,
        followerCount: followerCount.length,
        followingCount: followingList.length
      }
    })
  } catch (error) {
    console.error('Failed to get federation profile:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

// POST /api/federation/setup - Enable federation for the first time
// Uses the user's existing profile data (username, displayName, bio)
federationRouter.post('/setup', async (req, res) => {
  try {
    const userId = req.user!.userId

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Require username to be set in profile settings first
    if (!user.username) {
      res.status(400).json({
        error: 'Please set a username in your Profile settings before enabling federation.'
      })
      return
    }

    // Validate username format
    if (!isValidUsername(user.username)) {
      res.status(400).json({
        error: 'Invalid username format. Please update your username in Profile settings.'
      })
      return
    }

    // Generate RSA keys if not already present
    let publicKey = user.publicKey
    let privateKey = user.privateKey

    if (!publicKey || !privateKey) {
      const keys = generateRSAKeyPair()
      publicKey = keys.publicKey
      privateKey = keys.privateKey
    }

    // Update user with federation keys and enable
    await db.update(users)
      .set({
        publicKey,
        privateKey,
        federationEnabled: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    res.json({
      message: 'Federation enabled successfully',
      profile: {
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio,
        handle: `@${user.username}@${env.FEDERATION_DOMAIN}`,
        actorUrl: `${env.SERVER_URL}/users/${user.username}`
      }
    })
  } catch (error) {
    console.error('Failed to setup federation:', error)
    res.status(500).json({ error: 'Failed to setup federation' })
  }
})

// PUT /api/federation/profile - Toggle federation enabled/disabled
federationRouter.put('/profile', async (req, res) => {
  try {
    const userId = req.user!.userId
    const updates = updateProfileSchema.parse(req.body)

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (updates.federationEnabled !== undefined) {
      // Can only enable if username and keys are set
      if (updates.federationEnabled && (!user.username || !user.publicKey)) {
        res.status(400).json({
          error: 'Must complete federation setup before enabling'
        })
        return
      }

      await db.update(users)
        .set({
          federationEnabled: updates.federationEnabled,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
    }

    res.json({ message: 'Federation settings updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to update federation settings:', error)
    res.status(500).json({ error: 'Failed to update federation settings' })
  }
})

// POST /api/federation/publish - Publish a note
federationRouter.post('/publish', async (req, res) => {
  try {
    const userId = req.user!.userId
    const { title, content, visibility } = publishEntrySchema.parse(req.body)

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (!user.federationEnabled || !user.username) {
      res.status(400).json({
        error: 'Notes must be enabled to publish entries'
      })
      return
    }

    // Create unique activity ID
    const activityId = `${env.SERVER_URL}/activities/${randomUUID()}`

    // Create note entry
    const [publicEntry] = await db.insert(publicEntries)
      .values({
        userId,
        title,
        content,
        visibility,
        activityId,
        published: new Date()
      })
      .returning()

    // Only deliver to followers if visibility is public or followers
    if (visibility !== 'private') {
      const actorUrl = `${env.SERVER_URL}/users/${user.username}`
      const followersUrl = `${actorUrl}/followers`

      // Build audience based on visibility
      const to = visibility === 'public'
        ? ['https://www.w3.org/ns/activitystreams#Public']
        : [followersUrl]
      const cc = visibility === 'public' ? [followersUrl] : []

      const createActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: activityId,
        type: 'Create',
        actor: actorUrl,
        published: publicEntry.published.toISOString(),
        to,
        cc,
        object: {
          id: `${env.SERVER_URL}/entries/${publicEntry.id}`,
          type: 'Note',
          attributedTo: actorUrl,
          content: `<h1>${escapeHtml(title)}</h1>\n${markdownToHtml(content)}`,
          published: publicEntry.published.toISOString(),
          to,
          cc
        }
      }

      // Deliver Create activity to followers (async, don't block response)
      deliverToFollowers(
        { id: user.id, username: user.username, publicKey: user.publicKey, privateKey: user.privateKey },
        createActivity
      ).catch(err => console.error('Failed to deliver to followers:', err))
    }

    res.status(201).json({
      message: 'Note published successfully',
      entry: {
        id: publicEntry.id,
        title: publicEntry.title,
        content: publicEntry.content,
        visibility: publicEntry.visibility,
        activityId: publicEntry.activityId,
        published: publicEntry.published,
        url: `${env.SERVER_URL}/entries/${publicEntry.id}`
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to publish entry:', error)
    res.status(500).json({ error: 'Failed to publish entry' })
  }
})

// GET /api/federation/published - List user's notes
federationRouter.get('/published', async (req, res) => {
  try {
    const userId = req.user!.userId

    const entries = await db.query.publicEntries.findMany({
      where: eq(publicEntries.userId, userId),
      orderBy: (entries, { desc }) => [desc(entries.published)]
    })

    res.json({
      entries: entries.map(e => ({
        id: e.id,
        title: e.title,
        content: e.content,
        visibility: e.visibility,
        activityId: e.activityId,
        published: e.published
      }))
    })
  } catch (error) {
    console.error('Failed to get published entries:', error)
    res.status(500).json({ error: 'Failed to get entries' })
  }
})

// PUT /api/federation/published/:id - Update a note
federationRouter.put('/published/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const entryId = parseInt(req.params.id)

    if (isNaN(entryId)) {
      res.status(400).json({ error: 'Invalid entry ID' })
      return
    }

    const updates = updateNoteSchema.parse(req.body)

    // Verify ownership
    const entry = await db.query.publicEntries.findFirst({
      where: eq(publicEntries.id, entryId)
    })

    if (!entry || entry.userId !== userId) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    // Update the note
    const [updatedEntry] = await db.update(publicEntries)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(publicEntries.id, entryId))
      .returning()

    res.json({
      message: 'Note updated successfully',
      entry: {
        id: updatedEntry.id,
        title: updatedEntry.title,
        content: updatedEntry.content,
        visibility: updatedEntry.visibility,
        activityId: updatedEntry.activityId,
        published: updatedEntry.published
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to update note:', error)
    res.status(500).json({ error: 'Failed to update note' })
  }
})

// DELETE /api/federation/published/:id - Unpublish an entry
federationRouter.delete('/published/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const entryId = parseInt(req.params.id)

    if (isNaN(entryId)) {
      res.status(400).json({ error: 'Invalid entry ID' })
      return
    }

    // Verify ownership
    const entry = await db.query.publicEntries.findFirst({
      where: eq(publicEntries.id, entryId)
    })

    if (!entry || entry.userId !== userId) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }

    await db.delete(publicEntries)
      .where(eq(publicEntries.id, entryId))

    // TODO: Send Delete activity to followers

    res.json({ message: 'Entry unpublished successfully' })
  } catch (error) {
    console.error('Failed to unpublish entry:', error)
    res.status(500).json({ error: 'Failed to unpublish entry' })
  }
})

// GET /api/federation/followers - List followers
federationRouter.get('/followers', async (req, res) => {
  try {
    const userId = req.user!.userId

    const followersList = await db.query.followers.findMany({
      where: eq(followers.userId, userId)
    })

    res.json({
      followers: followersList.map(f => ({
        actorUrl: f.followerActorUrl,
        since: f.createdAt
      }))
    })
  } catch (error) {
    console.error('Failed to get followers:', error)
    res.status(500).json({ error: 'Failed to get followers' })
  }
})

// GET /api/federation/following - List users being followed
federationRouter.get('/following', async (req, res) => {
  try {
    const userId = req.user!.userId

    const followingList = await db.query.following.findMany({
      where: eq(following.userId, userId)
    })

    res.json({
      following: followingList.map(f => ({
        actorUrl: f.targetActorUrl,
        pending: f.pending,
        since: f.createdAt
      }))
    })
  } catch (error) {
    console.error('Failed to get following:', error)
    res.status(500).json({ error: 'Failed to get following' })
  }
})

// POST /api/federation/follow - Follow a user
federationRouter.post('/follow', async (req, res) => {
  try {
    const userId = req.user!.userId
    const { handle } = followSchema.parse(req.body)

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user || !user.federationEnabled || !user.username || !user.privateKey) {
      res.status(400).json({ error: 'You must complete federation setup before following users' })
      return
    }

    // Parse the handle - supports @user@domain, user@domain, @user (local)
    const { username: targetUsername, domain: targetDomain } = parseHandle(handle)

    if (!targetUsername) {
      res.status(400).json({ error: 'Invalid handle format. Use @username@domain or username@domain' })
      return
    }

    // Resolve the handle to an actor URL
    const targetActor = await resolveHandle(targetUsername, targetDomain)

    if (!targetActor) {
      res.status(404).json({ error: 'User not found. Check the handle and try again.' })
      return
    }

    // Check if already following
    const existingFollow = await db.query.following.findFirst({
      where: and(
        eq(following.userId, userId),
        eq(following.targetActorUrl, targetActor.actorUrl)
      )
    })

    if (existingFollow) {
      res.status(400).json({ error: 'You are already following this user' })
      return
    }

    // Create Follow activity
    const actorUrl = `${env.SERVER_URL}/users/${user.username}`
    const followActivity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${env.SERVER_URL}/activities/${randomUUID()}`,
      type: 'Follow',
      actor: actorUrl,
      object: targetActor.actorUrl
    }

    // Store the follow relationship (pending until Accept is received)
    await db.insert(following).values({
      userId,
      targetActorUrl: targetActor.actorUrl,
      pending: !targetActor.isLocal // Local follows are auto-accepted
    })

    // If local user, auto-accept the follow
    if (targetActor.isLocal && targetActor.localUserId) {
      // Add to local user's followers
      await db.insert(followers).values({
        userId: targetActor.localUserId,
        followerActorUrl: actorUrl,
        followerInbox: `${actorUrl}/inbox`,
        accepted: true
      }).onConflictDoNothing()

      // Mark as not pending
      await db.update(following)
        .set({ pending: false })
        .where(and(
          eq(following.userId, userId),
          eq(following.targetActorUrl, targetActor.actorUrl)
        ))
    } else {
      // Send Follow activity to remote user
      const delivered = await deliverActivity(
        { id: user.id, username: user.username, publicKey: user.publicKey, privateKey: user.privateKey },
        targetActor.inbox,
        followActivity
      )

      if (!delivered) {
        // Rollback the follow if delivery failed
        await db.delete(following).where(and(
          eq(following.userId, userId),
          eq(following.targetActorUrl, targetActor.actorUrl)
        ))
        res.status(500).json({ error: 'Failed to send follow request. The remote server may be unavailable.' })
        return
      }
    }

    res.json({
      message: targetActor.isLocal ? 'Now following user' : 'Follow request sent',
      following: {
        actorUrl: targetActor.actorUrl,
        pending: !targetActor.isLocal,
        displayName: targetActor.displayName,
        username: targetActor.username
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to follow user:', error)
    res.status(500).json({ error: 'Failed to follow user' })
  }
})

// DELETE /api/federation/follow - Unfollow a user
federationRouter.delete('/follow', async (req, res) => {
  try {
    const userId = req.user!.userId
    const actorUrl = req.query.actorUrl as string

    if (!actorUrl) {
      res.status(400).json({ error: 'actorUrl query parameter is required' })
      return
    }

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user || !user.username || !user.privateKey) {
      res.status(400).json({ error: 'Federation not set up' })
      return
    }

    // Check if following
    const existingFollow = await db.query.following.findFirst({
      where: and(
        eq(following.userId, userId),
        eq(following.targetActorUrl, actorUrl)
      )
    })

    if (!existingFollow) {
      res.status(404).json({ error: 'Not following this user' })
      return
    }

    // Remove the follow relationship
    await db.delete(following).where(and(
      eq(following.userId, userId),
      eq(following.targetActorUrl, actorUrl)
    ))

    // Check if this is a local user
    const localMatch = actorUrl.match(new RegExp(`^${env.SERVER_URL}/users/([^/]+)$`))
    if (localMatch) {
      // Remove from local user's followers
      const myActorUrl = `${env.SERVER_URL}/users/${user.username}`
      await db.delete(followers).where(
        eq(followers.followerActorUrl, myActorUrl)
      )
    } else {
      // Send Undo Follow activity to remote user
      try {
        const targetInbox = `${actorUrl}/inbox`
        const myActorUrl = `${env.SERVER_URL}/users/${user.username}`

        const undoActivity = {
          '@context': 'https://www.w3.org/ns/activitystreams',
          id: `${env.SERVER_URL}/activities/${randomUUID()}`,
          type: 'Undo',
          actor: myActorUrl,
          object: {
            type: 'Follow',
            actor: myActorUrl,
            object: actorUrl
          }
        }

        await deliverActivity(
          { id: user.id, username: user.username, publicKey: user.publicKey, privateKey: user.privateKey },
          targetInbox,
          undoActivity
        )
      } catch (err) {
        console.warn('Failed to send Undo Follow activity:', err)
        // Continue anyway - the local state is already updated
      }
    }

    res.json({ message: 'Unfollowed successfully' })
  } catch (error) {
    console.error('Failed to unfollow user:', error)
    res.status(500).json({ error: 'Failed to unfollow user' })
  }
})

// GET /api/federation/feed - Get feed of entries from followed users and own posts
// Supports cursor-based pagination with query params:
// - cursor: ISO timestamp string (optional, entries older than this)
// - limit: number (default 20, max 50)
federationRouter.get('/feed', async (req, res) => {
  try {
    const userId = req.user!.userId
    const cursor = req.query.cursor as string | undefined
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50)

    // Get current user for their own posts
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    // Get the list of users we follow (ActivityPub following)
    const followingList = await db.query.following.findMany({
      where: eq(following.userId, userId)
    })

    // Get local users we follow (from localFollowers where we are the follower)
    const localFollowingList = await db.query.localFollowers.findMany({
      where: and(
        eq(localFollowers.followerId, userId),
        eq(localFollowers.accepted, true)
      ),
      with: {
        user: true
      }
    })

    const feedEntries: FeedEntry[] = []

    // Track local user IDs we've already processed (to avoid duplicates)
    const processedLocalUserIds = new Set<number>()

    // Include current user's own posts first
    if (currentUser && currentUser.username) {
      processedLocalUserIds.add(currentUser.id)

      const ownEntries = await db.query.publicEntries.findMany({
        where: eq(publicEntries.userId, userId),
        orderBy: (entries, { desc }) => [desc(entries.published)],
        limit: 50
      })

      for (const entry of ownEntries) {
        feedEntries.push({
          id: entry.activityId,
          title: entry.title,
          content: entry.content,
          visibility: entry.visibility as 'public' | 'followers' | 'private',
          published: entry.published.toISOString(),
          author: {
            username: currentUser.username,
            displayName: currentUser.displayName || currentUser.username,
            actorUrl: `${env.SERVER_URL}/users/${currentUser.username}`,
            isLocal: true,
            isOwnPost: true
          }
        })
      }
    }

    // Process local followers first (direct database query is faster)
    for (const localFollow of localFollowingList) {
      const localUser = localFollow.user
      if (!localUser || processedLocalUserIds.has(localUser.id)) continue
      processedLocalUserIds.add(localUser.id)

      const entries = await db.query.publicEntries.findMany({
        where: and(
          eq(publicEntries.userId, localUser.id),
          inArray(publicEntries.visibility, ['public', 'followers'])
        ),
        orderBy: (entries, { desc }) => [desc(entries.published)],
        limit: 20
      })

      for (const entry of entries) {
        feedEntries.push({
          id: entry.activityId,
          title: entry.title,
          content: entry.content,
          visibility: entry.visibility as 'public' | 'followers' | 'private',
          published: entry.published.toISOString(),
          author: {
            username: localUser.username!,
            displayName: localUser.displayName || localUser.username!,
            actorUrl: `${env.SERVER_URL}/users/${localUser.username}`,
            isLocal: true
          }
        })
      }
    }

    // Process ActivityPub following
    for (const follow of followingList) {
      try {
        // Check if this is a local user
        const localMatch = follow.targetActorUrl.match(new RegExp(`^${env.SERVER_URL}/users/([^/]+)$`))

        if (localMatch) {
          // Local user - fetch from database directly
          const localUsername = localMatch[1]
          const localUser = await db.query.users.findFirst({
            where: eq(users.username, localUsername)
          })

          if (localUser && !processedLocalUserIds.has(localUser.id)) {
            processedLocalUserIds.add(localUser.id)

            const entries = await db.query.publicEntries.findMany({
              where: and(
                eq(publicEntries.userId, localUser.id),
                inArray(publicEntries.visibility, ['public', 'followers'])
              ),
              orderBy: (entries, { desc }) => [desc(entries.published)],
              limit: 20
            })

            for (const entry of entries) {
              feedEntries.push({
                id: entry.activityId,
                title: entry.title,
                content: entry.content,
                visibility: entry.visibility as 'public' | 'followers' | 'private',
                published: entry.published.toISOString(),
                author: {
                  username: localUser.username!,
                  displayName: localUser.displayName || localUser.username!,
                  actorUrl: follow.targetActorUrl,
                  isLocal: true
                }
              })
            }
          }
        } else {
          // Remote user - fetch their outbox
          try {
            const outboxUrl = `${follow.targetActorUrl}/outbox?page=true`
            const outboxResponse = await fetch(outboxUrl, {
              headers: { Accept: 'application/activity+json' },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            })

            if (outboxResponse.ok) {
              const outboxData = await outboxResponse.json()
              const items = outboxData.orderedItems || []

              // Extract username from actor URL
              const usernameMatch = follow.targetActorUrl.match(/\/users\/([^/]+)$/)
              const username = usernameMatch ? usernameMatch[1] : 'unknown'

              for (const item of items.slice(0, 20)) {
                if (item.type === 'Create' && item.object) {
                  const obj = item.object
                  // Extract title from content if it starts with <h1>
                  let title = 'Untitled'
                  let content = obj.content || ''

                  const titleMatch = content.match(/<h1>([^<]+)<\/h1>/)
                  if (titleMatch) {
                    title = titleMatch[1]
                    content = content.replace(/<h1>[^<]+<\/h1>\n?/, '')
                  }

                  feedEntries.push({
                    id: item.id || obj.id,
                    title,
                    content,
                    visibility: 'public', // Remote entries are always public in ActivityPub
                    published: obj.published || item.published,
                    author: {
                      username,
                      displayName: username,
                      actorUrl: follow.targetActorUrl,
                      isLocal: false
                    }
                  })
                }
              }
            }
          } catch (err) {
            console.warn(`[Federation] Failed to fetch outbox for ${follow.targetActorUrl}:`, err)
            // Continue with other users
          }
        }
      } catch (err) {
        console.warn(`[Federation] Error processing followed user ${follow.targetActorUrl}:`, err)
      }
    }

    // Sort by published date (newest first)
    feedEntries.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())

    // Apply cursor-based pagination (filter entries older than cursor)
    let filteredEntries = feedEntries
    if (cursor) {
      const cursorDate = new Date(cursor).getTime()
      filteredEntries = feedEntries.filter(e => new Date(e.published).getTime() < cursorDate)
    }

    // Get one more than limit to check if there are more entries
    const paginatedEntries = filteredEntries.slice(0, limit + 1)
    const hasMore = paginatedEntries.length > limit
    const resultEntries = paginatedEntries.slice(0, limit)

    // Calculate next cursor (published date of last entry)
    const nextCursor = resultEntries.length > 0 && hasMore
      ? resultEntries[resultEntries.length - 1].published
      : null

    res.json({
      entries: resultEntries,
      nextCursor,
      hasMore
    })
  } catch (error) {
    console.error('Failed to get feed:', error)
    res.status(500).json({ error: 'Failed to get feed' })
  }
})

interface FeedEntry {
  id: string
  title: string
  content: string
  visibility: 'public' | 'followers' | 'private'
  published: string
  author: {
    username: string
    displayName: string
    actorUrl: string
    isLocal: boolean
    isOwnPost?: boolean
  }
}

// GET /api/federation/lookup - Look up a user by handle
federationRouter.get('/lookup', async (req, res) => {
  try {
    const handle = req.query.handle as string

    if (!handle) {
      res.status(400).json({ error: 'handle query parameter is required' })
      return
    }

    const { username, domain } = parseHandle(handle)

    if (!username) {
      res.status(400).json({ error: 'Invalid handle format' })
      return
    }

    const actor = await resolveHandle(username, domain)

    if (!actor) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      user: {
        actorUrl: actor.actorUrl,
        username: actor.username,
        displayName: actor.displayName,
        bio: actor.bio,
        isLocal: actor.isLocal
      }
    })
  } catch (error) {
    console.error('Failed to lookup user:', error)
    res.status(500).json({ error: 'Failed to lookup user' })
  }
})

// ============================================
// Helper Functions
// ============================================

/**
 * Parse a handle in various formats: @user@domain, user@domain, @user
 */
function parseHandle(handle: string): { username: string | null; domain: string | null } {
  // Remove leading @ if present
  const cleaned = handle.startsWith('@') ? handle.slice(1) : handle

  // Check for @-separated format: user@domain
  if (cleaned.includes('@')) {
    const parts = cleaned.split('@')
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { username: parts[0].toLowerCase(), domain: parts[1].toLowerCase() }
    }
  }

  // Just a username (local user)
  if (/^[a-zA-Z0-9_]{3,30}$/.test(cleaned)) {
    return { username: cleaned.toLowerCase(), domain: null }
  }

  return { username: null, domain: null }
}

interface ResolvedActor {
  actorUrl: string
  inbox: string
  username: string
  displayName: string | null
  bio: string | null
  isLocal: boolean
  localUserId?: number
}

/**
 * Resolve a handle to an ActivityPub actor
 * Only allows following users from other Caderno instances (not Mastodon, Pleroma, etc.)
 */
async function resolveHandle(username: string, domain: string | null): Promise<ResolvedActor | null> {
  // If no domain or domain matches this server, look up locally
  if (!domain || domain === env.FEDERATION_DOMAIN) {
    const localUser = await db.query.users.findFirst({
      where: eq(users.username, username)
    })

    if (localUser && localUser.federationEnabled) {
      return {
        actorUrl: `${env.SERVER_URL}/users/${username}`,
        inbox: `${env.SERVER_URL}/users/${username}/inbox`,
        username: localUser.username!,
        displayName: localUser.displayName,
        bio: localUser.bio,
        isLocal: true,
        localUserId: localUser.id
      }
    }

    return null
  }

  // Remote user - use WebFinger to discover
  try {
    const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`
    console.log(`[Federation] Looking up: ${webfingerUrl}`)

    const webfingerResponse = await fetch(webfingerUrl, {
      headers: { Accept: 'application/jrd+json' }
    })

    if (!webfingerResponse.ok) {
      console.warn(`[Federation] WebFinger lookup failed: ${webfingerResponse.status}`)
      return null
    }

    const webfingerData = await webfingerResponse.json()

    // Check if this is a Caderno instance by looking for our identifier link
    const cadernoLink = webfingerData.links?.find((link: any) =>
      link.rel === 'https://caderno.app/ns/instance'
    )

    if (!cadernoLink) {
      console.warn(`[Federation] ${domain} is not a Caderno instance - federation not allowed`)
      return null
    }

    // Find the ActivityPub actor URL from links
    const actorLink = webfingerData.links?.find((link: any) =>
      link.rel === 'self' && link.type === 'application/activity+json'
    )

    if (!actorLink?.href) {
      console.warn('[Federation] No ActivityPub link in WebFinger response')
      return null
    }

    // Fetch the actor
    const actorResponse = await fetch(actorLink.href, {
      headers: { Accept: 'application/activity+json' }
    })

    if (!actorResponse.ok) {
      console.warn(`[Federation] Actor fetch failed: ${actorResponse.status}`)
      return null
    }

    const actorData = await actorResponse.json()

    return {
      actorUrl: actorData.id,
      inbox: actorData.inbox,
      username: actorData.preferredUsername || username,
      displayName: actorData.name || null,
      bio: actorData.summary || null,
      isLocal: false
    }
  } catch (error) {
    console.error('[Federation] Handle resolution error:', error)
    return null
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  return markdown
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}
