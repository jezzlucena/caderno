import { Router, type Router as RouterType } from 'express'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, entries, deadManSwitches } from '../db/schema.js'

export const profileRouter: RouterType = Router()

// GET /api/profile/:username - Get public profile
profileRouter.get('/:username', async (req, res) => {
  try {
    const { username } = req.params
    const normalizedUsername = username.toLowerCase().trim()

    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername)
    })

    // Return 404 if user not found OR profile is private
    if (!user || !user.profilePublic) {
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
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error('Failed to get profile:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})
