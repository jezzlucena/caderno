import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { register, login, verifyEmail, getUserById, updateProfile, checkUsernameAvailability, checkEmailAvailability, updateEmail, resendVerificationEmail, verifyUserPassword } from '../services/auth.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { authLimiter, emailLimiter } from '../middleware/rateLimit.js'
import { db } from '../db/index.js'
import { users, followers, localFollowers } from '../db/schema.js'
import { sendAcceptActivity } from './activitypub.js'
import { env } from '../config/env.js'

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

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, username, profileVisibility } = registerSchema.parse(req.body)
    const result = await register(email, password, username, profileVisibility)
    res.status(201).json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Registration failed' })
  }
})

// GET /api/auth/username-available/:username (public) - Check username availability for registration
authRouter.get('/username-available/:username', async (req, res) => {
  try {
    const { username } = req.params
    const result = await checkUsernameAvailability(username)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to check username' })
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    console.log('[Auth] Login attempt for:', req.body.emailOrUsername)
    const { emailOrUsername, password } = loginSchema.parse(req.body)
    const result = await login(emailOrUsername, password)
    console.log('[Auth] Login successful for user:', result.user.id)
    res.json(result)
  } catch (error) {
    console.error('[Auth] Login error:', error)
    if (error instanceof z.ZodError) {
      console.error('[Auth] Validation error:', error.issues)
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    if (error instanceof Error) {
      console.error('[Auth] Error message:', error.message)
      res.status(401).json({ error: error.message })
      return
    }
    console.error('[Auth] Unknown error type:', typeof error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// GET /api/auth/verify-email/:token
authRouter.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params
    await verifyEmail(token)
    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Verification failed' })
  }
})

// GET /api/auth/me (protected)
authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const user = await getUserById(req.user.userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Validation schema for profile update
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

// PUT /api/auth/profile (protected) - Update user profile
authRouter.put('/profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
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
      console.log(`[Auth] Profile visibility changed to public for user ${currentUser.username}, auto-accepting pending followers`)

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
          // Update to accepted
          await db.update(followers)
            .set({ accepted: true })
            .where(eq(followers.id, follower.id))

          // Send Accept activity
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
          ).catch(err => console.error(`Failed to send Accept to ${follower.followerActorUrl}:`, err))
        }
      }
    }

    res.json({ user, message: 'Profile updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// GET /api/auth/check-username/:username (protected) - Check username availability
authRouter.get('/check-username/:username', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { username } = req.params
    const result = await checkUsernameAvailability(username, req.user.userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to check username' })
  }
})

// GET /api/auth/check-email/:email (protected) - Check email availability
authRouter.get('/check-email/:email', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { email } = req.params
    const result = await checkEmailAvailability(email, req.user.userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to check email' })
  }
})

// PUT /api/auth/email (protected) - Update user email
authRouter.put('/email', authMiddleware, emailLimiter, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { email } = z.object({ email: z.string().email() }).parse(req.body)
    const user = await updateEmail(req.user.userId, email)
    res.json({ user, message: 'Email updated. Please check your inbox to verify your new email address.' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to update email' })
  }
})

// POST /api/auth/resend-verification (protected) - Resend email verification
authRouter.post('/resend-verification', authMiddleware, emailLimiter, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    await resendVerificationEmail(req.user.userId)
    res.json({ message: 'Verification email sent' })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to send verification email' })
  }
})

// POST /api/auth/verify-password (protected) - Verify user's password
authRouter.post('/verify-password', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { password } = z.object({ password: z.string().min(1) }).parse(req.body)
    const isValid = await verifyUserPassword(req.user.userId, password)

    if (!isValid) {
      res.status(401).json({ error: 'Invalid password' })
      return
    }

    res.json({ valid: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to verify password' })
  }
})
