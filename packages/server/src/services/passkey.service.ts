import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialDescriptorFuture
} from '@simplewebauthn/server'
import crypto from 'crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, passkeys, type User, type Passkey } from '../db/schema.js'
import { signToken } from '../utils/jwt.js'
import { createLogger } from '../utils/logger.js'

// Generate a random salt for PRF evaluation
function generatePrfSalt(): string {
  return crypto.randomBytes(32).toString('base64url')
}

const logger = createLogger('PasskeyService')

// Get RP (Relying Party) configuration from environment
const getRpConfig = () => {
  const rpId = process.env.WEBAUTHN_RP_ID || 'localhost'
  const rpName = process.env.WEBAUTHN_RP_NAME || 'Caderno'
  const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173'

  return { rpId, rpName, origin }
}

// In-memory challenge store (in production, use Redis or similar)
const challengeStore = new Map<string, { challenge: string; expiresAt: number }>()

// Clean expired challenges periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of challengeStore.entries()) {
    if (value.expiresAt < now) {
      challengeStore.delete(key)
    }
  }
}, 60000) // Clean every minute

function storeChallenge(key: string, challenge: string): void {
  // Challenges expire after 5 minutes
  challengeStore.set(key, {
    challenge,
    expiresAt: Date.now() + 5 * 60 * 1000
  })
}

function getAndDeleteChallenge(key: string): string | null {
  const stored = challengeStore.get(key)
  if (!stored) return null
  if (stored.expiresAt < Date.now()) {
    challengeStore.delete(key)
    return null
  }
  challengeStore.delete(key)
  return stored.challenge
}

// Get user's existing passkeys for excludeCredentials
async function getUserPasskeys(userId: number): Promise<Passkey[]> {
  return db.query.passkeys.findMany({
    where: eq(passkeys.userId, userId)
  })
}

// Get passkey by credential ID
async function getPasskeyByCredentialId(credentialId: string): Promise<(Passkey & { user: User }) | null> {
  const result = await db.query.passkeys.findFirst({
    where: eq(passkeys.credentialId, credentialId),
    with: {
      user: true
    }
  })
  return result as (Passkey & { user: User }) | null
}

export interface RegistrationOptionsResult {
  options: Awaited<ReturnType<typeof generateRegistrationOptions>> & { extensions?: { prf?: Record<string, never> } }
  challengeKey: string
  prfSalt: string
}

// Generate registration options for a logged-in user adding a passkey
export async function generatePasskeyRegistrationOptions(userId: number): Promise<RegistrationOptionsResult> {
  const { rpId, rpName } = getRpConfig()

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user) {
    throw new Error('User not found')
  }

  const userPasskeys = await getUserPasskeys(userId)

  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpId,
    userName: user.username || user.email,
    userDisplayName: user.displayName || user.username || user.email,
    userID: new TextEncoder().encode(String(userId)),
    attestationType: 'none',
    excludeCredentials: userPasskeys.map(pk => ({
      id: pk.credentialId,
      transports: pk.transports ? JSON.parse(pk.transports) as AuthenticatorTransportFuture[] : undefined
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform'
    }
  })

  // Add PRF extension to check if supported
  const optionsWithPrf = {
    ...options,
    extensions: {
      ...options.extensions,
      prf: {}
    }
  }

  // Generate PRF salt for this passkey
  const prfSalt = generatePrfSalt()

  // Store challenge with unique key
  const challengeKey = `reg_${userId}_${Date.now()}`
  storeChallenge(challengeKey, options.challenge)

  // Also store the PRF salt temporarily
  challengeStore.set(`prf_${challengeKey}`, {
    challenge: prfSalt,
    expiresAt: Date.now() + 5 * 60 * 1000
  })

  logger.debug('Generated registration options with PRF', { userId, challengeKey })

  return { options: optionsWithPrf, challengeKey, prfSalt }
}

export interface VerifyRegistrationResult {
  success: boolean
  passkey?: Passkey
  prfSupported: boolean
  prfSalt?: string
}

// Extended response type with PRF extension results
interface RegistrationResponseWithPrf extends RegistrationResponseJSON {
  clientExtensionResults?: {
    prf?: {
      enabled?: boolean
    }
  }
}

// Verify registration response and save passkey
export async function verifyPasskeyRegistration(
  userId: number,
  challengeKey: string,
  response: RegistrationResponseWithPrf,
  name?: string
): Promise<VerifyRegistrationResult> {
  const { rpId, origin } = getRpConfig()

  const expectedChallenge = getAndDeleteChallenge(challengeKey)
  if (!expectedChallenge) {
    throw new Error('Challenge expired or not found')
  }

  // Get the stored PRF salt
  const prfSaltStored = challengeStore.get(`prf_${challengeKey}`)
  const prfSalt = prfSaltStored?.challenge
  challengeStore.delete(`prf_${challengeKey}`)

  let verification: VerifiedRegistrationResponse
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpId
    })
  } catch (error) {
    logger.error('Registration verification failed', error)
    throw new Error('Registration verification failed')
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Registration verification failed')
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

  // Check if PRF is supported from client extension results
  const prfSupported = response.clientExtensionResults?.prf?.enabled === true

  // Save the passkey with PRF info
  const [newPasskey] = await db.insert(passkeys).values({
    userId,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: response.response.transports
      ? JSON.stringify(response.response.transports)
      : null,
    name: name || 'Passkey',
    prfSupported,
    prfSalt: prfSupported ? prfSalt : null
  }).returning()

  logger.debug('Passkey registered', { userId, passkeyId: newPasskey.id, prfSupported })

  return { success: true, passkey: newPasskey, prfSupported, prfSalt: prfSupported ? prfSalt : undefined }
}

// Store encrypted master key for a passkey (called after PRF-based encryption on client)
export async function storeEncryptedMasterKey(
  userId: number,
  passkeyId: number,
  encryptedMasterKey: string,
  masterKeyIv: string
): Promise<void> {
  const [updated] = await db.update(passkeys)
    .set({
      encryptedMasterKey,
      masterKeyIv
    })
    .where(and(
      eq(passkeys.id, passkeyId),
      eq(passkeys.userId, userId)
    ))
    .returning()

  if (!updated) {
    throw new Error('Passkey not found')
  }

  logger.debug('Stored encrypted master key for passkey', { userId, passkeyId })
}

export interface AuthenticationOptionsResult {
  options: Awaited<ReturnType<typeof generateAuthenticationOptions>> & { extensions?: { prf?: { eval?: { first: ArrayBuffer } } } }
  challengeKey: string
  prfSalts?: { [credentialId: string]: string }
}

// Generate authentication options (for login)
export async function generatePasskeyAuthenticationOptions(
  emailOrUsername?: string
): Promise<AuthenticationOptionsResult> {
  const { rpId } = getRpConfig()

  let allowCredentials: PublicKeyCredentialDescriptorFuture[] | undefined
  let prfSalts: { [credentialId: string]: string } = {}

  // If email/username provided, only allow that user's passkeys
  if (emailOrUsername) {
    const normalized = emailOrUsername.toLowerCase().trim()
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalized)
    }) || await db.query.users.findFirst({
      where: eq(users.username, normalized)
    })

    if (user) {
      const userPasskeys = await getUserPasskeys(user.id)
      if (userPasskeys.length > 0) {
        allowCredentials = userPasskeys.map(pk => ({
          id: pk.credentialId,
          transports: pk.transports ? JSON.parse(pk.transports) as AuthenticatorTransportFuture[] : undefined
        }))

        // Collect PRF salts for passkeys that support it
        for (const pk of userPasskeys) {
          if (pk.prfSupported && pk.prfSalt) {
            prfSalts[pk.credentialId] = pk.prfSalt
          }
        }
      }
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    userVerification: 'preferred',
    allowCredentials
  })

  // Store challenge
  const challengeKey = `auth_${Date.now()}_${Math.random().toString(36).slice(2)}`
  storeChallenge(challengeKey, options.challenge)

  logger.debug('Generated authentication options', { challengeKey, hasPrfSalts: Object.keys(prfSalts).length > 0 })

  return { options, challengeKey, prfSalts: Object.keys(prfSalts).length > 0 ? prfSalts : undefined }
}

export interface AuthResult {
  user: Omit<User, 'passwordHash' | 'emailVerificationToken'>
  token: string
  // PRF-based encryption data (if passkey supports PRF and has encrypted key)
  encryptedMasterKey?: string
  masterKeyIv?: string
  prfSalt?: string
}

// Verify authentication response
export async function verifyPasskeyAuthentication(
  challengeKey: string,
  response: AuthenticationResponseJSON
): Promise<AuthResult> {
  const { rpId, origin } = getRpConfig()

  const expectedChallenge = getAndDeleteChallenge(challengeKey)
  if (!expectedChallenge) {
    throw new Error('Challenge expired or not found')
  }

  // Find the passkey by credential ID
  const passkey = await getPasskeyByCredentialId(response.id)
  if (!passkey) {
    throw new Error('Passkey not found')
  }

  // Check if user is banned/suspended
  if (passkey.user.bannedOn) {
    throw new Error('This account has been permanently banned')
  }

  if (passkey.user.suspendedUntil && new Date(passkey.user.suspendedUntil) > new Date()) {
    const suspendedDate = new Date(passkey.user.suspendedUntil).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    throw new Error(`This account is suspended until ${suspendedDate}`)
  }

  let verification: VerifiedAuthenticationResponse
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64url'),
        counter: passkey.counter,
        transports: passkey.transports
          ? JSON.parse(passkey.transports) as AuthenticatorTransportFuture[]
          : undefined
      }
    })
  } catch (error) {
    logger.error('Authentication verification failed', error)
    throw new Error('Authentication failed')
  }

  if (!verification.verified) {
    throw new Error('Authentication failed')
  }

  // Update counter and last used
  await db.update(passkeys)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date()
    })
    .where(eq(passkeys.id, passkey.id))

  // Generate JWT
  const token = await signToken({
    userId: passkey.user.id,
    email: passkey.user.email,
    role: passkey.user.role
  })

  logger.debug('Passkey authentication successful', { userId: passkey.user.id, prfSupported: passkey.prfSupported })

  // Return user without sensitive fields
  const { passwordHash: _, emailVerificationToken: __, ...safeUser } = passkey.user

  // Include PRF encryption data if available
  const result: AuthResult = { user: safeUser, token }

  if (passkey.prfSupported && passkey.encryptedMasterKey && passkey.masterKeyIv && passkey.prfSalt) {
    result.encryptedMasterKey = passkey.encryptedMasterKey
    result.masterKeyIv = passkey.masterKeyIv
    result.prfSalt = passkey.prfSalt
  }

  return result
}

// List user's passkeys
export async function listUserPasskeys(userId: number): Promise<Omit<Passkey, 'publicKey'>[]> {
  const userPasskeys = await getUserPasskeys(userId)
  return userPasskeys.map(({ publicKey, ...rest }) => rest)
}

// Delete a passkey
export async function deletePasskey(userId: number, passkeyId: number): Promise<void> {
  const result = await db.delete(passkeys)
    .where(and(
      eq(passkeys.id, passkeyId),
      eq(passkeys.userId, userId)
    ))

  logger.debug('Passkey deleted', { userId, passkeyId })
}

// Rename a passkey
export async function renamePasskey(userId: number, passkeyId: number, name: string): Promise<Passkey> {
  const [updated] = await db.update(passkeys)
    .set({ name })
    .where(and(
      eq(passkeys.id, passkeyId),
      eq(passkeys.userId, userId)
    ))
    .returning()

  if (!updated) {
    throw new Error('Passkey not found')
  }

  return updated
}

// Check if user has any passkeys
export async function userHasPasskeys(emailOrUsername: string): Promise<boolean> {
  const normalized = emailOrUsername.toLowerCase().trim()

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalized)
  }) || await db.query.users.findFirst({
    where: eq(users.username, normalized)
  })

  if (!user) return false

  const count = await db.query.passkeys.findFirst({
    where: eq(passkeys.userId, user.id)
  })

  return !!count
}
