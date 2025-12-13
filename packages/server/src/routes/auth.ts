import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { register, login, verifyEmail, getUserById, updateProfile, checkUsernameAvailability, checkEmailAvailability, updateEmail, resendVerificationEmail, verifyUserPassword } from '../services/auth.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { authLimiter, emailLimiter } from '../middleware/rateLimit.js'
import { asyncHandler, notFound, unauthorized } from '../middleware/errorHandler.js'
import { createLogger } from '../utils/logger.js'
import { db } from '../db/index.js'
import { users, followers, localFollowers } from '../db/schema.js'
import { sendAcceptActivity } from './activitypub.js'
import { env } from '../config/env.js'

const logger = createLogger('Auth')

export const authRouter: RouterType = Router()

// Apply stricter rate limiting to auth routes
authRouter.use(authLimiter)

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  profileVisibility: z.enum(['public', 'restricted', 'private']).default('private')
})

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
})

const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .optional(),
  profileVisibility: z.enum(['public', 'restricted', 'private']).optional(),
  displayName: z.string().max(50, 'Display name must be at most 50 characters').nullable().optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').nullable().optional()
})

// POST /api/auth/register
authRouter.post('/register', asyncHandler(async (req, res) => {
  const { email, password, username, profileVisibility } = registerSchema.parse(req.body)
  const result = await register(email, password, username, profileVisibility)
  logger.debug('User registered', { userId: result.user.id, username })
  res.status(201).json(result)
}))

// GET /api/auth/username-available/:username (public) - Check username availability for registration
authRouter.get('/username-available/:username', asyncHandler(async (req, res) => {
  const { username } = req.params
  const result = await checkUsernameAvailability(username)
  res.json(result)
}))

// POST /api/auth/login
authRouter.post('/login', asyncHandler(async (req, res) => {
  logger.debug('Login attempt', { identifier: req.body.emailOrUsername })
  const { emailOrUsername, password } = loginSchema.parse(req.body)
  const result = await login(emailOrUsername, password)
  logger.debug('Login successful', { userId: result.user.id })
  res.json(result)
}))

// GET /api/auth/verify-email/:token
authRouter.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params
  await verifyEmail(token)
  logger.debug('Email verified', { token: token.substring(0, 8) + '...' })
  res.json({ message: 'Email verified successfully' })
}))

// GET /api/auth/me (protected)
authRouter.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const user = await getUserById(req.user.userId)
  if (!user) {
    throw notFound('User')
  }

  res.json({ user })
}))

// PUT /api/auth/profile (protected) - Update user profile
authRouter.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const data = updateProfileSchema.parse(req.body)

  // Get current user to check if visibility is changing
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, req.user.userId)
  })

  const oldVisibility = currentUser?.profileVisibility
  const newVisibility = data.profileVisibility

  const user = await updateProfile(req.user.userId, data)

  // Handle visibility change from private/restricted to public
  if (newVisibility === 'public' && oldVisibility !== 'public' && currentUser) {
    logger.debug('Profile visibility changed to public, auto-accepting pending followers', { username: currentUser.username })

    // Auto-accept all pending local followers
    await db.update(localFollowers)
      .set({ accepted: true })
      .where(eq(localFollowers.userId, currentUser.id))

    // Auto-accept all pending remote followers and send Accept activities
    const pendingRemoteFollowers = await db.query.followers.findMany({
      where: eq(followers.userId, currentUser.id)
    })

    for (const follower of pendingRemoteFollowers) {
      if (!follower.accepted && currentUser.privateKey && currentUser.username && follower.followActivityId) {
        await db.update(followers)
          .set({ accepted: true })
          .where(eq(followers.id, follower.id))

        const originalFollowActivity = {
          '@context': 'https://www.w3.org/ns/activitystreams',
          id: follower.followActivityId,
          type: 'Follow',
          actor: follower.followerActorUrl,
          object: `${env.SERVER_URL}/users/${currentUser.username}`
        }

        sendAcceptActivity(
          { id: currentUser.id, username: currentUser.username, publicKey: currentUser.publicKey, privateKey: currentUser.privateKey },
          follower.followerActorUrl,
          follower.followerInbox,
          originalFollowActivity
        ).catch(err => logger.error(`Failed to send Accept to ${follower.followerActorUrl}`, err))
      }
    }
  }

  logger.debug('Profile updated', { userId: req.user.userId })
  res.json({ user, message: 'Profile updated successfully' })
}))

// GET /api/auth/check-username/:username (protected) - Check username availability
authRouter.get('/check-username/:username', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const { username } = req.params
  const result = await checkUsernameAvailability(username, req.user.userId)
  res.json(result)
}))

// GET /api/auth/check-email/:email (protected) - Check email availability
authRouter.get('/check-email/:email', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const { email } = req.params
  const result = await checkEmailAvailability(email, req.user.userId)
  res.json(result)
}))

// PUT /api/auth/email (protected) - Update user email
authRouter.put('/email', authMiddleware, emailLimiter, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const { email } = z.object({ email: z.string().email() }).parse(req.body)
  const user = await updateEmail(req.user.userId, email)
  logger.debug('Email updated', { userId: req.user.userId })
  res.json({ user, message: 'Email updated. Please check your inbox to verify your new email address.' })
}))

// POST /api/auth/resend-verification (protected) - Resend email verification
authRouter.post('/resend-verification', authMiddleware, emailLimiter, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  await resendVerificationEmail(req.user.userId)
  logger.debug('Verification email resent', { userId: req.user.userId })
  res.json({ message: 'Verification email sent' })
}))

// POST /api/auth/verify-password (protected) - Verify user's password
authRouter.post('/verify-password', authMiddleware, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized('Not authenticated')
  }

  const { password } = z.object({ password: z.string().min(1) }).parse(req.body)
  const isValid = await verifyUserPassword(req.user.userId, password)

  if (!isValid) {
    throw unauthorized('Invalid password')
  }

  res.json({ valid: true })
}))
