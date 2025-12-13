import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { entries } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, notFound } from '../middleware/errorHandler.js'
import { parseId, verifyOwnership } from '../utils/validation.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('Entries')

export const entriesRouter: RouterType = Router()

// All routes require authentication
entriesRouter.use(authMiddleware)

// Base64 regex pattern for validation
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/

// Validation schemas - server only validates structure, not content (it's encrypted)
// Max sizes: title ~50KB encrypted, content ~10MB encrypted, IV 16 bytes base64
const createEntrySchema = z.object({
  encryptedTitle: z.string().min(1).max(70000).regex(BASE64_REGEX, 'Invalid encrypted data format'),
  encryptedContent: z.string().min(1).max(15000000).regex(BASE64_REGEX, 'Invalid encrypted data format'),
  iv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format')
})

const updateEntrySchema = z.object({
  encryptedTitle: z.string().min(1).max(70000).regex(BASE64_REGEX, 'Invalid encrypted data format'),
  encryptedContent: z.string().min(1).max(15000000).regex(BASE64_REGEX, 'Invalid encrypted data format'),
  iv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format')
})

// GET /api/entries - List all entries for current user
entriesRouter.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.userId

  const userEntries = await db.query.entries.findMany({
    where: eq(entries.userId, userId),
    orderBy: [desc(entries.updatedAt)]
  })

  res.json({ entries: userEntries })
}))

// GET /api/entries/:id - Get single entry
entriesRouter.get('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const entryId = parseId(req.params.id, 'entry')

  const entry = await db.query.entries.findFirst({
    where: and(eq(entries.id, entryId), eq(entries.userId, userId))
  })

  if (!entry) {
    throw notFound('Entry')
  }

  res.json({ entry })
}))

// POST /api/entries - Create new entry
entriesRouter.post('/', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const { encryptedTitle, encryptedContent, iv } = createEntrySchema.parse(req.body)

  const [newEntry] = await db.insert(entries).values({
    userId,
    encryptedTitle,
    encryptedContent,
    iv
  }).returning()

  logger.debug('Entry created', { entryId: newEntry.id, userId })
  res.status(201).json({ entry: newEntry })
}))

// PUT /api/entries/:id - Update entry
entriesRouter.put('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const entryId = parseId(req.params.id, 'entry')
  const { encryptedTitle, encryptedContent, iv } = updateEntrySchema.parse(req.body)

  // Verify ownership
  const existing = await db.query.entries.findFirst({
    where: and(eq(entries.id, entryId), eq(entries.userId, userId))
  })
  verifyOwnership(existing, userId, 'Entry')

  const [updatedEntry] = await db.update(entries)
    .set({
      encryptedTitle,
      encryptedContent,
      iv,
      updatedAt: new Date()
    })
    .where(eq(entries.id, entryId))
    .returning()

  logger.debug('Entry updated', { entryId, userId })
  res.json({ entry: updatedEntry })
}))

// DELETE /api/entries/:id - Delete entry
entriesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const entryId = parseId(req.params.id, 'entry')

  // Verify ownership
  const existing = await db.query.entries.findFirst({
    where: and(eq(entries.id, entryId), eq(entries.userId, userId))
  })
  verifyOwnership(existing, userId, 'Entry')

  await db.delete(entries).where(eq(entries.id, entryId))

  logger.debug('Entry deleted', { entryId, userId })
  res.json({ message: 'Entry deleted' })
}))
