import { eq, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, type User } from '../db/schema.js'
import { hashPassword, verifyPassword, generateSalt, generateToken } from '../utils/crypto.js'
import { signToken } from '../utils/jwt.js'
import { sendVerificationEmail } from './email.service.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('AuthService')

export interface AuthResult {
  user: Omit<User, 'passwordHash' | 'emailVerificationToken'>
  token: string
}

// Reserved usernames that match system routes
const RESERVED_USERNAMES = [
  'login', 'register', 'verify-email', 'unlock', 'about', 'terms', 'privacy', 'support',
  'dashboard', 'switches', 'federation', 'api', 'admin', 'settings', 'profile', 'user', 'users',
  'setup', 'compare', 'feed', 'platform'
]

export async function register(
  email: string,
  password: string,
  username: string,
  profileVisibility: 'public' | 'restricted' | 'private' = 'private'
): Promise<AuthResult> {
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

  // Create user
  const [newUser] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    keySalt,
    username: normalizedUsername,
    profileVisibility,
    emailVerificationToken,
    emailVerificationExpires
  }).returning()

  // Send verification email - rollback user creation if it fails
  try {
    await sendVerificationEmail(newUser.email, emailVerificationToken)
  } catch (error) {
    // Delete the user we just created
    await db.delete(users).where(eq(users.id, newUser.id))
    logger.error('Failed to send verification email, rolled back user creation', error)
    throw new Error('Failed to send verification email. Please try again.')
  }

  // Generate JWT
  const token = await signToken({ userId: newUser.id, email: newUser.email, role: newUser.role })

  logger.debug('User registered', { userId: newUser.id, username: normalizedUsername })

  // Return user without sensitive fields
  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = newUser
  return { user: safeUser, token }
}

export async function login(emailOrUsername: string, password: string): Promise<AuthResult> {
  const normalized = emailOrUsername.toLowerCase().trim()
  logger.debug('Login attempt', { identifier: normalized })

  // Find user by email or username
  const user = await db.query.users.findFirst({
    where: or(
      eq(users.email, normalized),
      eq(users.username, normalized)
    )
  })

  if (!user) {
    logger.debug('User not found')
    throw new Error('Invalid email/username or password')
  }

  // Check if user is banned
  if (user.bannedOn) {
    logger.debug('User is banned', { userId: user.id })
    throw new Error('This account has been permanently banned')
  }

  // Check if user is suspended
  if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
    logger.debug('User is suspended', { userId: user.id, until: user.suspendedUntil })
    const suspendedDate = new Date(user.suspendedUntil).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    throw new Error(`This account is suspended until ${suspendedDate}`)
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash)

  if (!isValid) {
    logger.debug('Invalid password', { userId: user.id })
    throw new Error('Invalid email/username or password')
  }

  // Generate JWT
  const token = await signToken({ userId: user.id, email: user.email, role: user.role })

  logger.debug('Login successful', { userId: user.id })

  // Return user without sensitive fields
  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = user
  return { user: safeUser, token }
}

export class VerificationError extends Error {
  constructor(message: string, public code: 'ALREADY_VERIFIED' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN') {
    super(message)
    this.name = 'VerificationError'
  }
}

export async function verifyEmail(token: string): Promise<User> {
  // Find user by verification token
  const user = await db.query.users.findFirst({
    where: eq(users.emailVerificationToken, token)
  })

  if (!user) {
    // Token not found - could be already used (email verified) or invalid
    throw new VerificationError(
      'This verification link is invalid or has already been used. Your email may already be verified - try logging in!',
      'ALREADY_VERIFIED'
    )
  }

  // Check if token has expired
  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    throw new VerificationError('Verification link has expired. Please request a new one.', 'EXPIRED_TOKEN')
  }

  // Mark email as verified
  const [updatedUser] = await db.update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id))
    .returning()

  logger.debug('Email verified', { userId: user.id })
  return updatedUser
}

export async function getUserById(id: number): Promise<Omit<User, 'passwordHash' | 'emailVerificationToken'> | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  })

  if (!user) {
    return null
  }

  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = user
  return safeUser
}

export interface UpdateProfileData {
  username?: string
  profileVisibility?: 'public' | 'restricted' | 'private'
  displayName?: string | null
  bio?: string | null
}

export async function updateProfile(
  userId: number,
  data: UpdateProfileData
): Promise<Omit<User, 'passwordHash' | 'emailVerificationToken'>> {
  // If updating username, validate and check availability
  if (data.username !== undefined) {
    const normalizedUsername = data.username.toLowerCase().trim()

    // Check for reserved usernames
    if (RESERVED_USERNAMES.includes(normalizedUsername)) {
      throw new Error('This username is reserved')
    }

    // Check if username is already taken by another user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername)
    })

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Username already taken')
    }

    data.username = normalizedUsername
  }

  // Update user
  const [updatedUser] = await db.update(users)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updatedUser) {
    throw new Error('User not found')
  }

  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = updatedUser
  return safeUser
}

export async function checkUsernameAvailability(
  username: string,
  currentUserId?: number
): Promise<{ available: boolean; reason?: string }> {
  const normalizedUsername = username.toLowerCase().trim()

  // Check for reserved usernames
  if (RESERVED_USERNAMES.includes(normalizedUsername)) {
    return { available: false, reason: 'This username is reserved' }
  }

  // Check if username is already taken
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername)
  })

  if (existingUser && existingUser.id !== currentUserId) {
    return { available: false, reason: 'Username already taken' }
  }

  return { available: true }
}

export async function resendVerificationEmail(userId: number): Promise<void> {
  // Get user by ID
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Check if already verified
  if (user.emailVerified) {
    throw new Error('Email is already verified')
  }

  // Generate new verification token and expiration
  const emailVerificationToken = generateToken()
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Update user with new token
  await db.update(users)
    .set({
      emailVerificationToken,
      emailVerificationExpires,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))

  // Send verification email
  await sendVerificationEmail(user.email, emailVerificationToken)
}

export async function checkEmailAvailability(
  email: string,
  currentUserId?: number
): Promise<{ available: boolean; reason?: string }> {
  const normalizedEmail = email.toLowerCase().trim()

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return { available: false, reason: 'Invalid email format' }
  }

  // Check if email is already taken
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail)
  })

  if (existingUser && existingUser.id !== currentUserId) {
    return { available: false, reason: 'Email already registered' }
  }

  return { available: true }
}

export async function verifyUserPassword(userId: number, password: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user) {
    throw new Error('User not found')
  }

  return verifyPassword(password, user.passwordHash)
}

export async function updateEmail(
  userId: number,
  newEmail: string
): Promise<Omit<User, 'passwordHash' | 'emailVerificationToken'>> {
  const normalizedEmail = newEmail.toLowerCase().trim()

  // Check if email is already taken by another user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail)
  })

  if (existingUser && existingUser.id !== userId) {
    throw new Error('Email already registered')
  }

  // Get current user
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!currentUser) {
    throw new Error('User not found')
  }

  // If email is the same, no need to update
  if (currentUser.email === normalizedEmail) {
    const { passwordHash: _, emailVerificationToken: __, ...safeUser } = currentUser
    return safeUser
  }

  // Generate new verification token
  const emailVerificationToken = generateToken()
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Update user with new email, mark as unverified
  const [updatedUser] = await db.update(users)
    .set({
      email: normalizedEmail,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning()

  // Send verification email to new address
  try {
    await sendVerificationEmail(normalizedEmail, emailVerificationToken)
  } catch (error) {
    // Rollback email change if verification email fails
    await db.update(users)
      .set({
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        emailVerificationToken: currentUser.emailVerificationToken,
        emailVerificationExpires: currentUser.emailVerificationExpires,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
    throw new Error('Failed to send verification email. Email not updated.')
  }

  logger.debug('Email updated', { userId })

  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = updatedUser
  return safeUser
}
