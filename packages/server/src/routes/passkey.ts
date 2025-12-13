import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  listUserPasskeys,
  deletePasskey,
  renamePasskey,
  userHasPasskeys,
  storeEncryptedMasterKey
} from '../services/passkey.service.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { asyncHandler, unauthorized, notFound } from '../middleware/errorHandler.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('Passkey')

export const passkeyRouter: RouterType = Router()

// Apply rate limiting
passkeyRouter.use(authLimiter)

// POST /api/passkey/register/options - Get registration options (protected - adding passkey to existing account)
passkeyRouter.post('/register/options', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const { options, challengeKey, prfSalt } = await generatePasskeyRegistrationOptions(req.user.userId)
  logger.debug('Registration options generated', { userId: req.user.userId })
  res.json({ options, challengeKey, prfSalt })
}))

// POST /api/passkey/register/verify - Verify registration and save passkey (protected)
passkeyRouter.post('/register/verify', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const schema = z.object({
    challengeKey: z.string(),
    response: z.any(), // WebAuthn response object
    name: z.string().max(50).optional()
  })

  const { challengeKey, response, name } = schema.parse(req.body)
  const result = await verifyPasskeyRegistration(req.user.userId, challengeKey, response, name)

  logger.debug('Passkey registered', { userId: req.user.userId, passkeyId: result.passkey?.id, prfSupported: result.prfSupported })
  res.json({
    success: true,
    passkey: result.passkey ? {
      id: result.passkey.id,
      name: result.passkey.name,
      deviceType: result.passkey.deviceType,
      backedUp: result.passkey.backedUp,
      createdAt: result.passkey.createdAt,
      prfSupported: result.prfSupported
    } : null,
    prfSupported: result.prfSupported,
    prfSalt: result.prfSalt
  })
}))

// POST /api/passkey/authenticate/options - Get authentication options (public)
passkeyRouter.post('/authenticate/options', asyncHandler(async (req, res) => {
  const schema = z.object({
    emailOrUsername: z.string().optional()
  })

  const { emailOrUsername } = schema.parse(req.body)
  const { options, challengeKey, prfSalts } = await generatePasskeyAuthenticationOptions(emailOrUsername)

  logger.debug('Authentication options generated', { hasPrfSalts: !!prfSalts })
  res.json({ options, challengeKey, prfSalts })
}))

// POST /api/passkey/authenticate/verify - Verify authentication (public - login with passkey)
passkeyRouter.post('/authenticate/verify', asyncHandler(async (req, res) => {
  const schema = z.object({
    challengeKey: z.string(),
    response: z.any() // WebAuthn response object
  })

  const { challengeKey, response } = schema.parse(req.body)
  const result = await verifyPasskeyAuthentication(challengeKey, response)

  logger.debug('Passkey authentication successful', { userId: result.user.id })
  res.json(result)
}))

// GET /api/passkey/check/:emailOrUsername - Check if user has passkeys (public)
passkeyRouter.get('/check/:emailOrUsername', asyncHandler(async (req, res) => {
  const { emailOrUsername } = req.params
  const hasPasskeys = await userHasPasskeys(emailOrUsername)
  res.json({ hasPasskeys })
}))

// GET /api/passkey/list - List user's passkeys (protected)
passkeyRouter.get('/list', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const passkeys = await listUserPasskeys(req.user.userId)
  res.json({ passkeys })
}))

// DELETE /api/passkey/:id - Delete a passkey (protected)
passkeyRouter.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const passkeyId = parseInt(req.params.id, 10)
  if (isNaN(passkeyId)) {
    throw notFound('Passkey')
  }

  await deletePasskey(req.user.userId, passkeyId)
  logger.debug('Passkey deleted', { userId: req.user.userId, passkeyId })
  res.json({ success: true, message: 'Passkey deleted' })
}))

// PUT /api/passkey/:id - Rename a passkey (protected)
passkeyRouter.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const passkeyId = parseInt(req.params.id, 10)
  if (isNaN(passkeyId)) {
    throw notFound('Passkey')
  }

  const schema = z.object({
    name: z.string().min(1).max(50)
  })

  const { name } = schema.parse(req.body)
  const passkey = await renamePasskey(req.user.userId, passkeyId, name)

  logger.debug('Passkey renamed', { userId: req.user.userId, passkeyId })
  res.json({
    passkey: {
      id: passkey.id,
      name: passkey.name,
      deviceType: passkey.deviceType,
      backedUp: passkey.backedUp,
      createdAt: passkey.createdAt,
      lastUsedAt: passkey.lastUsedAt
    }
  })
}))

// POST /api/passkey/:id/encrypted-key - Store encrypted master key for a passkey (protected)
passkeyRouter.post('/:id/encrypted-key', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const passkeyId = parseInt(req.params.id, 10)
  if (isNaN(passkeyId)) {
    throw notFound('Passkey')
  }

  const schema = z.object({
    encryptedMasterKey: z.string(),
    masterKeyIv: z.string()
  })

  const { encryptedMasterKey, masterKeyIv } = schema.parse(req.body)
  await storeEncryptedMasterKey(req.user.userId, passkeyId, encryptedMasterKey, masterKeyIv)

  logger.debug('Encrypted master key stored', { userId: req.user.userId, passkeyId })
  res.json({ success: true })
}))
