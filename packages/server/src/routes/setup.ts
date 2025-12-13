import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { hasAdminUser, createFirstAdmin } from '../services/setup.service.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { asyncHandler, forbidden } from '../middleware/errorHandler.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('Setup')

export const setupRouter: RouterType = Router()

// Apply stricter rate limiting to setup routes
setupRouter.use(authLimiter)

// Validation schema for admin creation
const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
})

// GET /api/setup/status - Check if setup is needed (public)
setupRouter.get('/status', asyncHandler(async (_req, res) => {
  const adminExists = await hasAdminUser()
  res.json({ needsSetup: !adminExists })
}))

// POST /api/setup/admin - Create the first admin account (public, but guarded)
setupRouter.post('/admin', asyncHandler(async (req, res) => {
  // First check if an admin already exists
  const adminExists = await hasAdminUser()
  if (adminExists) {
    throw forbidden('Setup has already been completed. An admin account already exists.')
  }

  const { email, password, username } = createAdminSchema.parse(req.body)
  const result = await createFirstAdmin(email, password, username)
  logger.info('First admin account created', { username })
  res.status(201).json(result)
}))
