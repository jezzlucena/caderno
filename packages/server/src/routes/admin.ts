import { Router, type Router as RouterType } from 'express'
import { eq, and, lte, gt, or, isNotNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, publicEntries, platformSettings } from '../db/schema.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { asyncHandler, notFound, badRequest, forbidden } from '../middleware/errorHandler.js'
import { parseId, verifyExists } from '../utils/validation.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('Admin')

export const adminRouter: RouterType = Router()

// All admin routes require authentication
adminRouter.use(authMiddleware)

// --- NOTES MODERATION ---

// GET /api/admin/notes/banned - List banned notes (moderator+)
adminRouter.get('/notes/banned', requireRole('admin', 'moderator'), asyncHandler(async (_req, res) => {
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
}))

// POST /api/admin/notes/:id/ban - Ban a note (moderator+)
adminRouter.post('/notes/:id/ban', requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const noteId = parseId(req.params.id, 'note')

  const note = await db.query.publicEntries.findFirst({
    where: eq(publicEntries.id, noteId)
  })
  verifyExists(note, 'Note')

  if (note.bannedOn) {
    throw badRequest('Note is already banned')
  }

  await db.update(publicEntries)
    .set({ bannedOn: new Date() })
    .where(eq(publicEntries.id, noteId))

  logger.debug('Note banned', { noteId })
  res.json({ message: 'Note banned successfully' })
}))

// POST /api/admin/notes/:id/unban - Unban a note (moderator+)
adminRouter.post('/notes/:id/unban', requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const noteId = parseId(req.params.id, 'note')

  const note = await db.query.publicEntries.findFirst({
    where: eq(publicEntries.id, noteId)
  })
  verifyExists(note, 'Note')

  if (!note.bannedOn) {
    throw badRequest('Note is not banned')
  }

  await db.update(publicEntries)
    .set({ bannedOn: null })
    .where(eq(publicEntries.id, noteId))

  logger.debug('Note unbanned', { noteId })
  res.json({ message: 'Note unbanned successfully' })
}))

// --- USER MODERATION ---

// GET /api/admin/users/banned - List banned users (moderator+)
adminRouter.get('/users/banned', requireRole('admin', 'moderator'), asyncHandler(async (_req, res) => {
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
}))

// GET /api/admin/users/suspended - List suspended users (moderator+)
adminRouter.get('/users/suspended', requireRole('admin', 'moderator'), asyncHandler(async (_req, res) => {
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
}))

// GET /api/admin/users/search - Search user by username or email (moderator+)
adminRouter.get('/users/search', requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const { q } = req.query

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    throw badRequest('Search query required')
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
}))

// POST /api/admin/users/ban - Ban a user (admin only)
adminRouter.post('/users/ban', requireRole('admin'), asyncHandler(async (req, res) => {
  const { identifier } = req.body

  if (!identifier || typeof identifier !== 'string') {
    throw badRequest('User identifier (username or email) required')
  }

  const searchTerm = identifier.trim().toLowerCase()

  const user = await db.query.users.findFirst({
    where: or(
      eq(users.username, searchTerm),
      eq(users.email, searchTerm)
    )
  })

  if (!user) {
    throw notFound('User')
  }

  if (user.role === 'admin') {
    throw forbidden('Cannot ban admin users')
  }

  const now = new Date()
  if (user.bannedOn && user.bannedOn <= now) {
    throw badRequest('User is already banned')
  }

  await db.update(users)
    .set({ bannedOn: now })
    .where(eq(users.id, user.id))

  logger.info('User banned', { userId: user.id, username: user.username })
  res.json({ message: `User ${user.username || user.email} banned successfully` })
}))

// POST /api/admin/users/unban - Unban a user (admin only)
adminRouter.post('/users/unban', requireRole('admin'), asyncHandler(async (req, res) => {
  const { identifier } = req.body

  if (!identifier || typeof identifier !== 'string') {
    throw badRequest('User identifier (username or email) required')
  }

  const searchTerm = identifier.trim().toLowerCase()

  const user = await db.query.users.findFirst({
    where: or(
      eq(users.username, searchTerm),
      eq(users.email, searchTerm)
    )
  })

  if (!user) {
    throw notFound('User')
  }

  if (!user.bannedOn) {
    throw badRequest('User is not banned')
  }

  await db.update(users)
    .set({ bannedOn: null })
    .where(eq(users.id, user.id))

  logger.info('User unbanned', { userId: user.id, username: user.username })
  res.json({ message: `User ${user.username || user.email} unbanned successfully` })
}))

// POST /api/admin/users/suspend - Suspend a user (moderator+)
adminRouter.post('/users/suspend', requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const { identifier, suspendedUntil } = req.body

  if (!identifier || typeof identifier !== 'string') {
    throw badRequest('User identifier (username or email) required')
  }

  if (!suspendedUntil || typeof suspendedUntil !== 'string') {
    throw badRequest('Suspension end date required')
  }

  const suspendedUntilDate = new Date(suspendedUntil)
  if (isNaN(suspendedUntilDate.getTime())) {
    throw badRequest('Invalid suspension end date')
  }

  if (suspendedUntilDate <= new Date()) {
    throw badRequest('Suspension end date must be in the future')
  }

  const searchTerm = identifier.trim().toLowerCase()

  const user = await db.query.users.findFirst({
    where: or(
      eq(users.username, searchTerm),
      eq(users.email, searchTerm)
    )
  })

  if (!user) {
    throw notFound('User')
  }

  if (user.role === 'admin') {
    throw forbidden('Cannot suspend admin users')
  }

  const now = new Date()
  if (user.bannedOn && user.bannedOn <= now) {
    throw badRequest('Cannot suspend a banned user. Unban first.')
  }

  await db.update(users)
    .set({ suspendedUntil: suspendedUntilDate })
    .where(eq(users.id, user.id))

  logger.info('User suspended', { userId: user.id, username: user.username, until: suspendedUntilDate.toISOString() })
  res.json({ message: `User ${user.username || user.email} suspended until ${suspendedUntilDate.toISOString()}` })
}))

// POST /api/admin/users/unsuspend - Unsuspend a user (moderator+)
adminRouter.post('/users/unsuspend', requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const { identifier } = req.body

  if (!identifier || typeof identifier !== 'string') {
    throw badRequest('User identifier (username or email) required')
  }

  const searchTerm = identifier.trim().toLowerCase()

  const user = await db.query.users.findFirst({
    where: or(
      eq(users.username, searchTerm),
      eq(users.email, searchTerm)
    )
  })

  if (!user) {
    throw notFound('User')
  }

  if (!user.suspendedUntil) {
    throw badRequest('User is not suspended')
  }

  await db.update(users)
    .set({ suspendedUntil: null })
    .where(eq(users.id, user.id))

  logger.info('User unsuspended', { userId: user.id, username: user.username })
  res.json({ message: `User ${user.username || user.email} unsuspended successfully` })
}))

// --- PLATFORM SETTINGS ---

// PUT /api/admin/platform - Update platform settings (admin only)
adminRouter.put('/platform', requireRole('admin'), asyncHandler(async (req, res) => {
  const { displayName } = req.body

  if (!displayName || typeof displayName !== 'string') {
    throw badRequest('Display name is required')
  }

  const trimmedName = displayName.trim()

  if (trimmedName.length > 30) {
    throw badRequest('Display name must be 30 characters or less')
  }

  if (trimmedName.length < 1) {
    throw badRequest('Display name cannot be empty')
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
    throw badRequest('Display name can only contain letters, numbers, and spaces')
  }

  const existing = await db.query.platformSettings.findFirst()

  if (existing) {
    await db.update(platformSettings)
      .set({ displayName: trimmedName, updatedAt: new Date() })
      .where(eq(platformSettings.id, existing.id))
  } else {
    await db.insert(platformSettings).values({
      displayName: trimmedName
    })
  }

  logger.info('Platform settings updated', { displayName: trimmedName })
  res.json({ message: 'Platform settings updated successfully', displayName: trimmedName })
}))
