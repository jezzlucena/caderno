import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, type User } from '../db/schema.js'
import { hashPassword, generateSalt, generateToken } from '../utils/crypto.js'
import { signToken } from '../utils/jwt.js'
import { sendVerificationEmail } from './email.service.js'
import type { AuthResult } from './auth.service.js'

// Reserved usernames that match system routes
const RESERVED_USERNAMES = [
  'login', 'register', 'verify-email', 'unlock', 'about', 'terms', 'privacy', 'support',
  'dashboard', 'switches', 'federation', 'api', 'admin', 'settings', 'profile', 'user', 'users',
  'setup', 'compare', 'feed', 'platform'
]

/**
 * Check if any admin user exists in the database
 */
export async function hasAdminUser(): Promise<boolean> {
  const admin = await db.query.users.findFirst({
    where: eq(users.role, 'admin')
  })
  return !!admin
}

/**
 * Create the first admin user. This function will only succeed if no admin exists.
 * This is used for initial setup when the app is first installed.
 */
export async function createFirstAdmin(
  email: string,
  password: string,
  username: string
): Promise<AuthResult> {
  // SECURITY: Double-check no admin exists (race condition protection)
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.role, 'admin')
  })

  if (existingAdmin) {
    throw new Error('An admin account already exists')
  }

  // Normalize username
  const normalizedUsername = username.toLowerCase().trim()

  // Check for reserved usernames
  if (RESERVED_USERNAMES.includes(normalizedUsername)) {
    throw new Error('This username is reserved')
  }

  // Check if email already exists
  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase())
  })

  if (existingEmail) {
    throw new Error('Email already registered')
  }

  // Check if username already exists
  const existingUsername = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername)
  })

  if (existingUsername) {
    throw new Error('Username already taken')
  }

  // Hash password and generate salts/tokens
  const passwordHash = await hashPassword(password)
  const keySalt = generateSalt()
  const emailVerificationToken = generateToken()
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Create admin user with role: 'admin'
  const [newUser] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    keySalt,
    username: normalizedUsername,
    role: 'admin', // Key difference from regular registration
    profileVisibility: 'private',
    emailVerificationToken,
    emailVerificationExpires
  }).returning()

  // Send verification email - rollback user creation if it fails
  try {
    await sendVerificationEmail(newUser.email, emailVerificationToken)
  } catch (error) {
    // Delete the user we just created
    await db.delete(users).where(eq(users.id, newUser.id))
    console.error('[Setup] Failed to send verification email, rolled back admin creation:', error)
    throw new Error('Failed to send verification email. Please try again.')
  }

  // Generate JWT with admin role
  const token = await signToken({ userId: newUser.id, email: newUser.email, role: newUser.role })

  // Return user without sensitive fields
  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = newUser
  return { user: safeUser, token }
}
