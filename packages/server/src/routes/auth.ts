import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import { register, login, verifyEmail, getUserById, updateProfile, checkUsernameAvailability } from '../services/auth.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'

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
  profilePublic: z.boolean().default(false)
})

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
})

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, username, profilePublic } = registerSchema.parse(req.body)
    const result = await register(email, password, username, profilePublic)
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
  profilePublic: z.boolean().optional(),
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
    const user = await updateProfile(req.user.userId, data)
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
