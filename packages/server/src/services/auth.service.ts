import { eq, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, type User } from '../db/schema.js'
import { hashPassword, verifyPassword, generateSalt, generateToken } from '../utils/crypto.js'
import { signToken } from '../utils/jwt.js'
import { sendVerificationEmail } from './email.service.js'

export interface AuthResult {
  user: Omit<User, 'passwordHash' | 'emailVerificationToken'>
  token: string
}

// Reserved usernames that match system routes
const RESERVED_USERNAMES = [
  'login', 'register', 'verify-email', 'unlock', 'about', 'terms', 'privacy',
  'switches', 'federation', 'api', 'admin', 'settings', 'profile', 'user', 'users'
]

export async function register(
  email: string,
  password: string,
  username: string,
  profilePublic: boolean = false
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
    profilePublic,
    emailVerificationToken,
    emailVerificationExpires
  }).returning()

  // Send verification email
  await sendVerificationEmail(newUser.email, emailVerificationToken)

  // Generate JWT
  const token = await signToken({ userId: newUser.id, email: newUser.email, role: newUser.role })

  // Return user without sensitive fields
  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = newUser
  return { user: safeUser, token }
}

export async function login(emailOrUsername: string, password: string): Promise<AuthResult> {
  const normalized = emailOrUsername.toLowerCase().trim()
  console.log('[AuthService] login() called for:', normalized)

  // Find user by email or username
  console.log('[AuthService] Querying database for user...')
  const user = await db.query.users.findFirst({
    where: or(
      eq(users.email, normalized),
      eq(users.username, normalized)
    )
  })
  console.log('[AuthService] User found:', user ? `ID ${user.id}` : 'null')

  if (!user) {
    console.log('[AuthService] User not found, throwing error')
    throw new Error('Invalid email/username or password')
  }

  // Verify password
  console.log('[AuthService] Verifying password...')
  const isValid = await verifyPassword(password, user.passwordHash)
  console.log('[AuthService] Password valid:', isValid)

  if (!isValid) {
    throw new Error('Invalid email/username or password')
  }

  // Generate JWT
  console.log('[AuthService] Generating JWT...')
  const token = await signToken({ userId: user.id, email: user.email, role: user.role })
  console.log('[AuthService] JWT generated successfully')

  // Return user without sensitive fields
  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = user
  console.log('[AuthService] Returning safe user object with keys:', Object.keys(safeUser))
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
  profilePublic?: boolean
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
