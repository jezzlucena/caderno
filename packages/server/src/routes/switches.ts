import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { deadManSwitches, switchRecipients } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

export const switchesRouter: RouterType = Router()

// PUBLIC ROUTES (no authentication required)

// GET /api/switches/:id/payload - Get encrypted payload for triggered switch (PUBLIC)
// This endpoint is used by recipients to download the encrypted PDF
switchesRouter.get('/:id/payload', async (req, res) => {
  try {
    const switchId = parseInt(req.params.id)

    if (isNaN(switchId)) {
      res.status(400).json({ error: 'Invalid switch ID' })
      return
    }

    const switchData = await db.query.deadManSwitches.findFirst({
      where: eq(deadManSwitches.id, switchId)
    })

    if (!switchData) {
      res.status(404).json({ error: 'Switch not found' })
      return
    }

    // Only allow access to triggered switches with payload
    if (!switchData.hasTriggered) {
      res.status(403).json({ error: 'This switch has not been triggered yet' })
      return
    }

    if (!switchData.encryptedPayload || !switchData.payloadIv) {
      res.status(404).json({ error: 'No payload available for this switch' })
      return
    }

    res.json({
      encryptedPayload: switchData.encryptedPayload,
      payloadIv: switchData.payloadIv,
      // Note: switchName is E2EE encrypted and cannot be decrypted without user's key
      switchId: switchData.id,
      triggeredAt: switchData.triggeredAt
    })
  } catch (error) {
    console.error('Failed to get payload:', error)
    res.status(500).json({ error: 'Failed to get payload' })
  }
})

// PROTECTED ROUTES (authentication required)
switchesRouter.use(authMiddleware)

// Base64 regex pattern for validation
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/

// Validation schemas
const createSwitchSchema = z.object({
  // E2EE encrypted name fields
  encryptedName: z.string().min(1).max(500).regex(BASE64_REGEX, 'Invalid encrypted name format'),
  iv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format'),
  timerDays: z.number().int().min(1).max(365).default(7),
  triggerMessage: z.string().max(5000).optional(),
  recipients: z.array(z.object({
    email: z.string().email().max(320),
    name: z.string().max(100).optional()
  })).min(1).max(10),
  // PDF payload fields (encrypted client-side) - max ~50MB encrypted
  encryptedPayload: z.string().max(70000000).regex(BASE64_REGEX, 'Invalid payload format').optional(),
  payloadIv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format').optional(),
  payloadKey: z.string().min(40).max(50).regex(BASE64_REGEX, 'Invalid key format').optional()
})

const updateSwitchSchema = z.object({
  // E2EE encrypted name fields (must be provided together)
  encryptedName: z.string().min(1).max(500).regex(BASE64_REGEX, 'Invalid encrypted name format').optional(),
  iv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format').optional(),
  timerDays: z.number().int().min(1).max(365).optional(),
  triggerMessage: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
  recipients: z.array(z.object({
    email: z.string().email().max(320),
    name: z.string().max(100).optional()
  })).min(1).max(10).optional()
})

// GET /api/switches - List all switches for current user
switchesRouter.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId

    const switches = await db.query.deadManSwitches.findMany({
      where: eq(deadManSwitches.userId, userId),
      with: {
        recipients: true
      },
      orderBy: (switches, { desc }) => [desc(switches.createdAt)]
    })

    res.json({ switches })
  } catch (error) {
    console.error('Failed to list switches:', error)
    res.status(500).json({ error: 'Failed to list switches' })
  }
})

// GET /api/switches/:id - Get single switch
switchesRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const switchId = parseInt(req.params.id)

    if (isNaN(switchId)) {
      res.status(400).json({ error: 'Invalid switch ID' })
      return
    }

    const switchData = await db.query.deadManSwitches.findFirst({
      where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId)),
      with: {
        recipients: true
      }
    })

    if (!switchData) {
      res.status(404).json({ error: 'Switch not found' })
      return
    }

    res.json({ switch: switchData })
  } catch (error) {
    console.error('Failed to get switch:', error)
    res.status(500).json({ error: 'Failed to get switch' })
  }
})

// POST /api/switches - Create new switch
switchesRouter.post('/', async (req, res) => {
  try {
    const userId = req.user!.userId
    const { encryptedName, iv, timerDays, triggerMessage, recipients, encryptedPayload, payloadIv, payloadKey } = createSwitchSchema.parse(req.body)

    // Create the switch with E2EE encrypted name
    const [newSwitch] = await db.insert(deadManSwitches).values({
      userId,
      encryptedName,
      iv,
      timerDays,
      triggerMessage,
      encryptedPayload,
      payloadIv,
      payloadKey,
      lastCheckIn: new Date()
    }).returning()

    // Add recipients
    if (recipients.length > 0) {
      await db.insert(switchRecipients).values(
        recipients.map(r => ({
          switchId: newSwitch.id,
          email: r.email,
          name: r.name
        }))
      )
    }

    // Fetch complete switch with recipients
    const completeSwitch = await db.query.deadManSwitches.findFirst({
      where: eq(deadManSwitches.id, newSwitch.id),
      with: {
        recipients: true
      }
    })

    res.status(201).json({ switch: completeSwitch })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to create switch:', error)
    res.status(500).json({ error: 'Failed to create switch' })
  }
})

// PUT /api/switches/:id - Update switch
switchesRouter.put('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const switchId = parseInt(req.params.id)

    if (isNaN(switchId)) {
      res.status(400).json({ error: 'Invalid switch ID' })
      return
    }

    const { encryptedName, iv, timerDays, triggerMessage, isActive, recipients } = updateSwitchSchema.parse(req.body)

    // Verify ownership
    const existing = await db.query.deadManSwitches.findFirst({
      where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId))
    })

    if (!existing) {
      res.status(404).json({ error: 'Switch not found' })
      return
    }

    // Don't allow updates to triggered switches
    if (existing.hasTriggered) {
      res.status(400).json({ error: 'Cannot update a triggered switch' })
      return
    }

    // Update the switch
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    // E2EE encrypted name - both fields must be provided together
    if (encryptedName !== undefined && iv !== undefined) {
      updateData.encryptedName = encryptedName
      updateData.iv = iv
    }
    if (timerDays !== undefined) updateData.timerDays = timerDays
    if (triggerMessage !== undefined) updateData.triggerMessage = triggerMessage
    if (isActive !== undefined) updateData.isActive = isActive

    await db.update(deadManSwitches)
      .set(updateData)
      .where(eq(deadManSwitches.id, switchId))

    // Update recipients if provided
    if (recipients !== undefined) {
      // Delete existing recipients
      await db.delete(switchRecipients).where(eq(switchRecipients.switchId, switchId))

      // Add new recipients
      if (recipients.length > 0) {
        await db.insert(switchRecipients).values(
          recipients.map(r => ({
            switchId,
            email: r.email,
            name: r.name
          }))
        )
      }
    }

    // Fetch updated switch
    const updatedSwitch = await db.query.deadManSwitches.findFirst({
      where: eq(deadManSwitches.id, switchId),
      with: {
        recipients: true
      }
    })

    res.json({ switch: updatedSwitch })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    console.error('Failed to update switch:', error)
    res.status(500).json({ error: 'Failed to update switch' })
  }
})

// DELETE /api/switches/:id - Delete switch
switchesRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const switchId = parseInt(req.params.id)

    if (isNaN(switchId)) {
      res.status(400).json({ error: 'Invalid switch ID' })
      return
    }

    // Verify ownership
    const existing = await db.query.deadManSwitches.findFirst({
      where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId))
    })

    if (!existing) {
      res.status(404).json({ error: 'Switch not found' })
      return
    }

    // Delete switch (recipients cascade)
    await db.delete(deadManSwitches).where(eq(deadManSwitches.id, switchId))

    res.json({ message: 'Switch deleted' })
  } catch (error) {
    console.error('Failed to delete switch:', error)
    res.status(500).json({ error: 'Failed to delete switch' })
  }
})

// POST /api/switches/:id/check-in - Reset the timer (user is alive!)
switchesRouter.post('/:id/check-in', async (req, res) => {
  try {
    const userId = req.user!.userId
    const switchId = parseInt(req.params.id)

    if (isNaN(switchId)) {
      res.status(400).json({ error: 'Invalid switch ID' })
      return
    }

    // Verify ownership
    const existing = await db.query.deadManSwitches.findFirst({
      where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId))
    })

    if (!existing) {
      res.status(404).json({ error: 'Switch not found' })
      return
    }

    if (existing.hasTriggered) {
      res.status(400).json({ error: 'Switch has already triggered' })
      return
    }

    if (!existing.isActive) {
      res.status(400).json({ error: 'Switch is not active' })
      return
    }

    // Update lastCheckIn
    await db.update(deadManSwitches)
      .set({
        lastCheckIn: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deadManSwitches.id, switchId))

    // Fetch updated switch with recipients
    const updatedSwitch = await db.query.deadManSwitches.findFirst({
      where: eq(deadManSwitches.id, switchId),
      with: {
        recipients: true
      }
    })

    res.json({
      switch: updatedSwitch,
      message: 'Check-in successful. Timer has been reset.',
      nextDeadline: new Date(updatedSwitch!.lastCheckIn.getTime() + updatedSwitch!.timerDays * 24 * 60 * 60 * 1000)
    })
  } catch (error) {
    console.error('Failed to check in:', error)
    res.status(500).json({ error: 'Failed to check in' })
  }
})

// POST /api/switches/check-in-all - Check in to all active switches at once
switchesRouter.post('/check-in-all', async (req, res) => {
  try {
    const userId = req.user!.userId

    // Update all active, non-triggered switches
    const result = await db.update(deadManSwitches)
      .set({
        lastCheckIn: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(deadManSwitches.userId, userId),
          eq(deadManSwitches.isActive, true),
          eq(deadManSwitches.hasTriggered, false)
        )
      )
      .returning()

    res.json({
      message: `Checked in to ${result.length} switch(es)`,
      switches: result
    })
  } catch (error) {
    console.error('Failed to check in all:', error)
    res.status(500).json({ error: 'Failed to check in' })
  }
})
