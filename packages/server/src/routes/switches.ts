import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { deadManSwitches, switchRecipients } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, notFound, badRequest, forbidden } from '../middleware/errorHandler.js'
import { parseId, verifyOwnership, verifyExists } from '../utils/validation.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('Switches')

export const switchesRouter: RouterType = Router()

// PUBLIC ROUTES (no authentication required)

// GET /api/switches/:id/payload - Get encrypted payload for triggered switch (PUBLIC)
// This endpoint is used by recipients to download the encrypted PDF
switchesRouter.get('/:id/payload', asyncHandler(async (req, res) => {
  const switchId = parseId(req.params.id, 'switch')

  const switchData = await db.query.deadManSwitches.findFirst({
    where: eq(deadManSwitches.id, switchId)
  })
  verifyExists(switchData, 'Switch')

  // Only allow access to triggered switches with payload
  if (!switchData.hasTriggered) {
    throw forbidden('This switch has not been triggered yet')
  }

  if (!switchData.encryptedPayload || !switchData.payloadIv) {
    throw notFound('No payload available for this switch')
  }

  res.json({
    encryptedPayload: switchData.encryptedPayload,
    payloadIv: switchData.payloadIv,
    switchId: switchData.id,
    triggeredAt: switchData.triggeredAt
  })
}))

// PROTECTED ROUTES (authentication required)
switchesRouter.use(authMiddleware)

// Base64 regex pattern for validation
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/

// Validation schemas
const createSwitchSchema = z.object({
  encryptedName: z.string().min(1).max(500).regex(BASE64_REGEX, 'Invalid encrypted name format'),
  iv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format'),
  timerMs: z.number().int().min(60000).max(31536000000).default(604800000),
  triggerMessage: z.string().max(5000).optional(),
  recipients: z.array(z.object({
    email: z.string().email().max(320),
    name: z.string().max(100).optional()
  })).min(1).max(10),
  encryptedPayload: z.string().max(70000000).regex(BASE64_REGEX, 'Invalid payload format').optional(),
  payloadIv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format').optional(),
  payloadKey: z.string().min(40).max(50).regex(BASE64_REGEX, 'Invalid key format').optional()
})

const updateSwitchSchema = z.object({
  encryptedName: z.string().min(1).max(500).regex(BASE64_REGEX, 'Invalid encrypted name format').optional(),
  iv: z.string().min(16).max(24).regex(BASE64_REGEX, 'Invalid IV format').optional(),
  timerMs: z.number().int().min(60000).max(31536000000).optional(),
  triggerMessage: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
  recipients: z.array(z.object({
    email: z.string().email().max(320),
    name: z.string().max(100).optional()
  })).min(1).max(10).optional()
})

// GET /api/switches - List all switches for current user
switchesRouter.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.userId

  const switches = await db.query.deadManSwitches.findMany({
    where: eq(deadManSwitches.userId, userId),
    with: {
      recipients: true
    },
    orderBy: (switches, { desc }) => [desc(switches.createdAt)]
  })

  res.json({ switches })
}))

// GET /api/switches/:id - Get single switch
switchesRouter.get('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const switchId = parseId(req.params.id, 'switch')

  const switchData = await db.query.deadManSwitches.findFirst({
    where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId)),
    with: {
      recipients: true
    }
  })

  if (!switchData) {
    throw notFound('Switch')
  }

  res.json({ switch: switchData })
}))

// POST /api/switches - Create new switch
switchesRouter.post('/', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const { encryptedName, iv, timerMs, triggerMessage, recipients, encryptedPayload, payloadIv, payloadKey } = createSwitchSchema.parse(req.body)

  const [newSwitch] = await db.insert(deadManSwitches).values({
    userId,
    encryptedName,
    iv,
    timerMs,
    triggerMessage,
    encryptedPayload,
    payloadIv,
    payloadKey,
    lastCheckIn: new Date()
  }).returning()

  if (recipients.length > 0) {
    await db.insert(switchRecipients).values(
      recipients.map(r => ({
        switchId: newSwitch.id,
        email: r.email,
        name: r.name
      }))
    )
  }

  const completeSwitch = await db.query.deadManSwitches.findFirst({
    where: eq(deadManSwitches.id, newSwitch.id),
    with: {
      recipients: true
    }
  })

  logger.debug('Switch created', { switchId: newSwitch.id, userId })
  res.status(201).json({ switch: completeSwitch })
}))

// PUT /api/switches/:id - Update switch
switchesRouter.put('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const switchId = parseId(req.params.id, 'switch')
  const { encryptedName, iv, timerMs, triggerMessage, isActive, recipients } = updateSwitchSchema.parse(req.body)

  const existing = await db.query.deadManSwitches.findFirst({
    where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId))
  })
  verifyOwnership(existing, userId, 'Switch')

  if (existing.hasTriggered) {
    throw badRequest('Cannot update a triggered switch')
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (encryptedName !== undefined && iv !== undefined) {
    updateData.encryptedName = encryptedName
    updateData.iv = iv
  }
  if (timerMs !== undefined) updateData.timerMs = timerMs
  if (triggerMessage !== undefined) updateData.triggerMessage = triggerMessage
  if (isActive !== undefined) updateData.isActive = isActive

  await db.update(deadManSwitches)
    .set(updateData)
    .where(eq(deadManSwitches.id, switchId))

  if (recipients !== undefined) {
    await db.delete(switchRecipients).where(eq(switchRecipients.switchId, switchId))
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

  const updatedSwitch = await db.query.deadManSwitches.findFirst({
    where: eq(deadManSwitches.id, switchId),
    with: {
      recipients: true
    }
  })

  logger.debug('Switch updated', { switchId, userId })
  res.json({ switch: updatedSwitch })
}))

// DELETE /api/switches/:id - Delete switch
switchesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const switchId = parseId(req.params.id, 'switch')

  const existing = await db.query.deadManSwitches.findFirst({
    where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId))
  })
  verifyOwnership(existing, userId, 'Switch')

  await db.delete(deadManSwitches).where(eq(deadManSwitches.id, switchId))

  logger.debug('Switch deleted', { switchId, userId })
  res.json({ message: 'Switch deleted' })
}))

// POST /api/switches/:id/check-in - Reset the timer (user is alive!)
switchesRouter.post('/:id/check-in', asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const switchId = parseId(req.params.id, 'switch')

  const existing = await db.query.deadManSwitches.findFirst({
    where: and(eq(deadManSwitches.id, switchId), eq(deadManSwitches.userId, userId))
  })
  verifyOwnership(existing, userId, 'Switch')

  if (existing.hasTriggered) {
    throw badRequest('Switch has already triggered')
  }

  if (!existing.isActive) {
    throw badRequest('Switch is not active')
  }

  await db.update(deadManSwitches)
    .set({
      lastCheckIn: new Date(),
      updatedAt: new Date()
    })
    .where(eq(deadManSwitches.id, switchId))

  const updatedSwitch = await db.query.deadManSwitches.findFirst({
    where: eq(deadManSwitches.id, switchId),
    with: {
      recipients: true
    }
  })

  logger.debug('Switch check-in', { switchId, userId })
  res.json({
    switch: updatedSwitch,
    message: 'Check-in successful. Timer has been reset.',
    nextDeadline: new Date(updatedSwitch!.lastCheckIn.getTime() + updatedSwitch!.timerMs)
  })
}))

// POST /api/switches/check-in-all - Check in to all active switches at once
switchesRouter.post('/check-in-all', asyncHandler(async (req, res) => {
  const userId = req.user!.userId

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

  logger.debug('All switches checked in', { userId, count: result.length })
  res.json({
    message: `Checked in to ${result.length} switch(es)`,
    switches: result
  })
}))
