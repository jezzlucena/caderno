import { Router, type Router as RouterType } from 'express'
import { eq, and, lte, gt, or, isNotNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, publicEntries, platformSettings } from '../db/schema.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

export const adminRouter: RouterType = Router()

// All admin routes require authentication
adminRouter.use(authMiddleware)

// --- NOTES MODERATION ---

// GET /api/admin/notes/banned - List banned notes (moderator+)
adminRouter.get('/notes/banned', requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    const now = new Date()

    const bannedNotes = await db
      .select({
        id: publicEntries.id,
        title: publicEntries.title,
        content: publicEntries.content,
        bannedOn: publicEntries.bannedOn,
        userId: publicEntries.userId,
        published: publicEntries.published
      })
      .from(publicEntries)
      .where(
        and(
          isNotNull(publicEntries.bannedOn),
          lte(publicEntries.bannedOn, now)
        )
      )
      .orderBy(publicEntries.bannedOn)

    // Fetch author info for each note
    const notesWithAuthors = await Promise.all(
      bannedNotes.map(async (note) => {
        const author = await db.query.users.findFirst({
          where: eq(users.id, note.userId)
        })
        return {
          ...note,
          bannedOn: note.bannedOn?.toISOString() || null,
          published: note.published?.toISOString() || null,
          author: {
            username: author?.username || null,
            displayName: author?.displayName || null,
            email: author?.email || ''
          }
        }
      })
    )

    res.json({ notes: notesWithAuthors.reverse() })
  } catch (error) {
    console.error('Failed to get banned notes:', error)
    res.status(500).json({ error: 'Failed to get banned notes' })
  }
})

// POST /api/admin/notes/:id/ban - Ban a note (moderator+)
adminRouter.post('/notes/:id/ban', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { id } = req.params
    const noteId = parseInt(id, 10)

    if (isNaN(noteId)) {
      res.status(400).json({ error: 'Invalid note ID' })
      return
    }

    const note = await db.query.publicEntries.findFirst({
      where: eq(publicEntries.id, noteId)
    })

    if (!note) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    if (note.bannedOn) {
      res.status(400).json({ error: 'Note is already banned' })
      return
    }

    await db.update(publicEntries)
      .set({ bannedOn: new Date() })
      .where(eq(publicEntries.id, noteId))

    res.json({ message: 'Note banned successfully' })
  } catch (error) {
    console.error('Failed to ban note:', error)
    res.status(500).json({ error: 'Failed to ban note' })
  }
})

// POST /api/admin/notes/:id/unban - Unban a note (moderator+)
adminRouter.post('/notes/:id/unban', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { id } = req.params
    const noteId = parseInt(id, 10)

    if (isNaN(noteId)) {
      res.status(400).json({ error: 'Invalid note ID' })
      return
    }

    const note = await db.query.publicEntries.findFirst({
      where: eq(publicEntries.id, noteId)
    })

    if (!note) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    if (!note.bannedOn) {
      res.status(400).json({ error: 'Note is not banned' })
      return
    }

    await db.update(publicEntries)
      .set({ bannedOn: null })
      .where(eq(publicEntries.id, noteId))

    res.json({ message: 'Note unbanned successfully' })
  } catch (error) {
    console.error('Failed to unban note:', error)
    res.status(500).json({ error: 'Failed to unban note' })
  }
})

// --- USER MODERATION ---

// GET /api/admin/users/banned - List banned users (moderator+)
adminRouter.get('/users/banned', requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    const now = new Date()

    const bannedUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        bannedOn: users.bannedOn,
        suspendedUntil: users.suspendedUntil,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        and(
          isNotNull(users.bannedOn),
          lte(users.bannedOn, now)
        )
      )
      .orderBy(users.bannedOn)

    res.json({
      users: bannedUsers.reverse().map(u => ({
        ...u,
        bannedOn: u.bannedOn?.toISOString() || null,
        suspendedUntil: u.suspendedUntil?.toISOString() || null,
        createdAt: u.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Failed to get banned users:', error)
    res.status(500).json({ error: 'Failed to get banned users' })
  }
})

// GET /api/admin/users/suspended - List suspended users (moderator+)
adminRouter.get('/users/suspended', requireRole('admin', 'moderator'), async (_req, res) => {
  try {
    const now = new Date()

    const suspendedUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        bannedOn: users.bannedOn,
        suspendedUntil: users.suspendedUntil,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        and(
          isNotNull(users.suspendedUntil),
          gt(users.suspendedUntil, now)
        )
      )
      .orderBy(users.suspendedUntil)

    res.json({
      users: suspendedUsers.reverse().map(u => ({
        ...u,
        bannedOn: u.bannedOn?.toISOString() || null,
        suspendedUntil: u.suspendedUntil?.toISOString() || null,
        createdAt: u.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Failed to get suspended users:', error)
    res.status(500).json({ error: 'Failed to get suspended users' })
  }
})

// GET /api/admin/users/search - Search user by username or email (moderator+)
adminRouter.get('/users/search', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({ error: 'Search query required' })
      return
    }

    const searchTerm = q.trim().toLowerCase()

    const user = await db.query.users.findFirst({
      where: or(
        eq(users.username, searchTerm),
        eq(users.email, searchTerm)
      )
    })

    if (!user) {
      res.json({ user: null })
      return
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        bannedOn: user.bannedOn?.toISOString() || null,
        suspendedUntil: user.suspendedUntil?.toISOString() || null,
        createdAt: user.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to search user:', error)
    res.status(500).json({ error: 'Failed to search user' })
  }
})

// POST /api/admin/users/ban - Ban a user (admin only)
adminRouter.post('/users/ban', requireRole('admin'), async (req, res) => {
  try {
    const { identifier } = req.body

    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ error: 'User identifier (username or email) required' })
      return
    }

    const searchTerm = identifier.trim().toLowerCase()

    const user = await db.query.users.findFirst({
      where: or(
        eq(users.username, searchTerm),
        eq(users.email, searchTerm)
      )
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Prevent banning admins
    if (user.role === 'admin') {
      res.status(403).json({ error: 'Cannot ban admin users' })
      return
    }

    // Check if already banned
    const now = new Date()
    if (user.bannedOn && user.bannedOn <= now) {
      res.status(400).json({ error: 'User is already banned' })
      return
    }

    await db.update(users)
      .set({ bannedOn: now })
      .where(eq(users.id, user.id))

    res.json({ message: `User ${user.username || user.email} banned successfully` })
  } catch (error) {
    console.error('Failed to ban user:', error)
    res.status(500).json({ error: 'Failed to ban user' })
  }
})

// POST /api/admin/users/unban - Unban a user (admin only)
adminRouter.post('/users/unban', requireRole('admin'), async (req, res) => {
  try {
    const { identifier } = req.body

    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ error: 'User identifier (username or email) required' })
      return
    }

    const searchTerm = identifier.trim().toLowerCase()

    const user = await db.query.users.findFirst({
      where: or(
        eq(users.username, searchTerm),
        eq(users.email, searchTerm)
      )
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (!user.bannedOn) {
      res.status(400).json({ error: 'User is not banned' })
      return
    }

    await db.update(users)
      .set({ bannedOn: null })
      .where(eq(users.id, user.id))

    res.json({ message: `User ${user.username || user.email} unbanned successfully` })
  } catch (error) {
    console.error('Failed to unban user:', error)
    res.status(500).json({ error: 'Failed to unban user' })
  }
})

// POST /api/admin/users/suspend - Suspend a user (moderator+)
adminRouter.post('/users/suspend', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { identifier, suspendedUntil } = req.body

    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ error: 'User identifier (username or email) required' })
      return
    }

    if (!suspendedUntil || typeof suspendedUntil !== 'string') {
      res.status(400).json({ error: 'Suspension end date required' })
      return
    }

    const suspendedUntilDate = new Date(suspendedUntil)
    if (isNaN(suspendedUntilDate.getTime())) {
      res.status(400).json({ error: 'Invalid suspension end date' })
      return
    }

    if (suspendedUntilDate <= new Date()) {
      res.status(400).json({ error: 'Suspension end date must be in the future' })
      return
    }

    const searchTerm = identifier.trim().toLowerCase()

    const user = await db.query.users.findFirst({
      where: or(
        eq(users.username, searchTerm),
        eq(users.email, searchTerm)
      )
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Prevent suspending admins
    if (user.role === 'admin') {
      res.status(403).json({ error: 'Cannot suspend admin users' })
      return
    }

    // Check if user is already banned (banned takes precedence)
    const now = new Date()
    if (user.bannedOn && user.bannedOn <= now) {
      res.status(400).json({ error: 'Cannot suspend a banned user. Unban first.' })
      return
    }

    await db.update(users)
      .set({ suspendedUntil: suspendedUntilDate })
      .where(eq(users.id, user.id))

    res.json({ message: `User ${user.username || user.email} suspended until ${suspendedUntilDate.toISOString()}` })
  } catch (error) {
    console.error('Failed to suspend user:', error)
    res.status(500).json({ error: 'Failed to suspend user' })
  }
})

// POST /api/admin/users/unsuspend - Unsuspend a user (moderator+)
adminRouter.post('/users/unsuspend', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { identifier } = req.body

    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ error: 'User identifier (username or email) required' })
      return
    }

    const searchTerm = identifier.trim().toLowerCase()

    const user = await db.query.users.findFirst({
      where: or(
        eq(users.username, searchTerm),
        eq(users.email, searchTerm)
      )
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (!user.suspendedUntil) {
      res.status(400).json({ error: 'User is not suspended' })
      return
    }

    await db.update(users)
      .set({ suspendedUntil: null })
      .where(eq(users.id, user.id))

    res.json({ message: `User ${user.username || user.email} unsuspended successfully` })
  } catch (error) {
    console.error('Failed to unsuspend user:', error)
    res.status(500).json({ error: 'Failed to unsuspend user' })
  }
})

// --- PLATFORM SETTINGS ---

// PUT /api/admin/platform - Update platform settings (admin only)
adminRouter.put('/platform', requireRole('admin'), async (req, res) => {
  try {
    const { displayName } = req.body

    if (!displayName || typeof displayName !== 'string') {
      res.status(400).json({ error: 'Display name is required' })
      return
    }

    const trimmedName = displayName.trim()

    // Validate length (max 30 characters)
    if (trimmedName.length > 30) {
      res.status(400).json({ error: 'Display name must be 30 characters or less' })
      return
    }

    if (trimmedName.length < 1) {
      res.status(400).json({ error: 'Display name cannot be empty' })
      return
    }

    // Validate alphanumeric and spaces only
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
      res.status(400).json({ error: 'Display name can only contain letters, numbers, and spaces' })
      return
    }

    // Check if settings exist
    const existing = await db.query.platformSettings.findFirst()

    if (existing) {
      // Update existing settings
      await db.update(platformSettings)
        .set({ displayName: trimmedName, updatedAt: new Date() })
        .where(eq(platformSettings.id, existing.id))
    } else {
      // Create settings
      await db.insert(platformSettings).values({
        displayName: trimmedName
      })
    }

    res.json({ message: 'Platform settings updated successfully', displayName: trimmedName })
  } catch (error) {
    console.error('Failed to update platform settings:', error)
    res.status(500).json({ error: 'Failed to update platform settings' })
  }
})
