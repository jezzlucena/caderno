import { Router, type Router as RouterType } from 'express'
import { eq, sql, and, or, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, entries, deadManSwitches, publicEntries, followers } from '../db/schema.js'
import { optionalAuthMiddleware } from '../middleware/auth.js'
import { env } from '../config/env.js'

export const profileRouter: RouterType = Router()

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

    // Return 404 if profile is private AND not the owner viewing it
    if (!user.profilePublic && !isOwnProfile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    // Count entries for this user
    const entryCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(entries)
      .where(eq(entries.userId, user.id))
    const entryCount = entryCountResult[0]?.count ?? 0

    // Count switches for this user
    const switchCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deadManSwitches)
      .where(eq(deadManSwitches.userId, user.id))
    const switchCount = switchCountResult[0]?.count ?? 0

    res.json({
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      entryCount,
      switchCount,
      createdAt: user.createdAt,
      isOwnProfile,
      isPrivate: !user.profilePublic
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
    let isFollower = false

    if (req.user && !isOwner) {
      // Check if the viewer follows this user
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
