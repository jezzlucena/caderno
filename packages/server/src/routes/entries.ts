import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { entries } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

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
entriesRouter.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId

    const userEntries = await db.query.entries.findMany({
      where: eq(entries.userId, userId),
      orderBy: [desc(entries.updatedAt)]
    })

    res.json({ entries: userEntries })
  } catch (error) {
    console.error('Failed to list entries:', error)
    res.status(500).json({ error: 'Failed to list entries' })
  }
})

// GET /api/entries/:id - Get single entry
entriesRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const entryId = parseInt(req.params.id)

    if (isNaN(entryId)) {
      res.status(400).json({ error: 'Invalid entry ID' })
      return
    }

    const entry = await db.query.entries.findFirst({
      where: and(eq(entries.id, entryId), eq(entries.userId, userId))
    })

    if (!entry) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }

    res.json({ entry })
  } catch (error) {
    console.error('Failed to get entry:', error)
    res.status(500).json({ error: 'Failed to get entry' })
  }
})

// POST /api/entries - Create new entry
entriesRouter.post('/', async (req, res) => {
  try {
    const userId = req.user!.userId
    const { encryptedTitle, encryptedContent, iv } = createEntrySchema.parse(req.body)

    const [newEntry] = await db.insert(entries).values({
      userId,
      encryptedTitle,
      encryptedContent,
      iv
    }).returning()

    res.status(201).json({ entry: newEntry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to create entry:', error)
    res.status(500).json({ error: 'Failed to create entry' })
  }
})

// PUT /api/entries/:id - Update entry
entriesRouter.put('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const entryId = parseInt(req.params.id)

    if (isNaN(entryId)) {
      res.status(400).json({ error: 'Invalid entry ID' })
      return
    }

    const { encryptedTitle, encryptedContent, iv } = updateEntrySchema.parse(req.body)

    // Verify ownership
    const existing = await db.query.entries.findFirst({
      where: and(eq(entries.id, entryId), eq(entries.userId, userId))
    })

    if (!existing) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }

    const [updatedEntry] = await db.update(entries)
      .set({
        encryptedTitle,
        encryptedContent,
        iv,
        updatedAt: new Date()
      })
      .where(eq(entries.id, entryId))
      .returning()

    res.json({ entry: updatedEntry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to update entry:', error)
    res.status(500).json({ error: 'Failed to update entry' })
  }
})

// DELETE /api/entries/:id - Delete entry
entriesRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const entryId = parseInt(req.params.id)

    if (isNaN(entryId)) {
      res.status(400).json({ error: 'Invalid entry ID' })
      return
    }

    // Verify ownership
    const existing = await db.query.entries.findFirst({
      where: and(eq(entries.id, entryId), eq(entries.userId, userId))
    })

    if (!existing) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }

    await db.delete(entries).where(eq(entries.id, entryId))

    res.json({ message: 'Entry deleted' })
  } catch (error) {
    console.error('Failed to delete entry:', error)
    res.status(500).json({ error: 'Failed to delete entry' })
  }
})
