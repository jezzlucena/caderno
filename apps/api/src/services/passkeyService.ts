import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';

// Type definitions for WebAuthn JSON objects
type PublicKeyCredentialCreationOptionsJSON = Awaited<ReturnType<typeof generateRegistrationOptions>>;
type PublicKeyCredentialRequestOptionsJSON = Awaited<ReturnType<typeof generateAuthenticationOptions>>;
type RegistrationResponseJSON = Parameters<typeof verifyRegistrationResponse>[0]['response'];
type AuthenticationResponseJSON = Parameters<typeof verifyAuthenticationResponse>[0]['response'];
import { User, IUser } from '../models/User.js';
import { Passkey, IPasskey } from '../models/Passkey.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthResult } from './authService.js';
import { generateAccessToken } from '../middleware/auth.js';
import { Session } from '../models/Session.js';
import { hashToken, generateToken } from '../config/encryption.js';

// In-memory challenge store (in production, use Redis or similar)
const challenges = new Map<string, { challenge: string; expiresAt: number }>();

function storeChallenge(userId: string, challenge: string): void {
  challenges.set(userId, {
    challenge,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
}

function getAndRemoveChallenge(userId: string): string | null {
  const data = challenges.get(userId);
  if (!data) return null;

  challenges.delete(userId);

  if (data.expiresAt < Date.now()) return null;

  return data.challenge;
}

export async function generateRegistrationOptionsForUser(
  userId: string,
  passkeyName?: string
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Get existing passkeys for exclusion
  const existingPasskeys = await Passkey.find({ userId: user._id });
  const excludeCredentials = existingPasskeys.map((pk) => ({
    id: pk.credentialId,
    transports: pk.transports as AuthenticatorTransport[] | undefined,
  }));

  const options = await generateRegistrationOptions({
    rpName: env.RP_NAME,
    rpID: env.RP_ID,
    userName: user.email,
    userDisplayName: user.email,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  });

  storeChallenge(userId, options.challenge);

  return options;
}

export async function verifyRegistrationForUser(
  userId: string,
  response: RegistrationResponseJSON,
  passkeyName = 'My Passkey'
): Promise<IPasskey> {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const expectedChallenge = getAndRemoveChallenge(userId);
  if (!expectedChallenge) {
    throw new AppError(400, 'CHALLENGE_EXPIRED', 'Registration challenge expired');
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: env.ORIGIN,
      expectedRPID: env.RP_ID,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('Passkey registration verification failed:', detail);
    throw new AppError(400, 'VERIFICATION_FAILED', `Passkey verification failed: ${detail}`);
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new AppError(400, 'VERIFICATION_FAILED', 'Passkey verification failed');
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  // Create passkey record
  const passkey = await Passkey.create({
    userId: user._id,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64'),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: response.response.transports,
    name: passkeyName,
  });

  // Add passkey to auth methods if not present
  if (!user.authMethods.includes('passkey')) {
    user.authMethods.push('passkey');
    await user.save();
  }

  return passkey;
}

export async function generateAuthenticationOptionsForUser(
  email: string
): Promise<PublicKeyCredentialRequestOptionsJSON & { userId?: string }> {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Return generic options that will fail verification
    // This prevents user enumeration
    const options = await generateAuthenticationOptions({
      rpID: env.RP_ID,
      userVerification: 'preferred',
    });
    return options;
  }

  const passkeys = await Passkey.find({ userId: user._id });

  if (passkeys.length === 0) {
    throw new AppError(400, 'NO_PASSKEYS', 'No passkeys registered for this account');
  }

  const allowCredentials = passkeys.map((pk) => ({
    id: pk.credentialId,
    transports: pk.transports as AuthenticatorTransport[] | undefined,
  }));

  const options = await generateAuthenticationOptions({
    rpID: env.RP_ID,
    allowCredentials,
    userVerification: 'preferred',
  });

  storeChallenge(user._id.toString(), options.challenge);

  return { ...options, userId: user._id.toString() };
}

export async function verifyAuthenticationForUser(
  email: string,
  response: AuthenticationResponseJSON,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Authentication failed');
  }

  const expectedChallenge = getAndRemoveChallenge(user._id.toString());
  if (!expectedChallenge) {
    throw new AppError(400, 'CHALLENGE_EXPIRED', 'Authentication challenge expired');
  }

  const passkey = await Passkey.findOne({ credentialId: response.id });

  if (!passkey || passkey.userId.toString() !== user._id.toString()) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Authentication failed');
  }

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: env.ORIGIN,
      expectedRPID: env.RP_ID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64'),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransport[] | undefined,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('Passkey login verification failed:', detail);
    throw new AppError(401, 'VERIFICATION_FAILED', `Passkey verification failed: ${detail}`);
  }

  if (!verification.verified) {
    throw new AppError(401, 'VERIFICATION_FAILED', 'Passkey verification failed');
  }

  // Update counter
  passkey.counter = verification.authenticationInfo.newCounter;
  passkey.lastUsedAt = new Date();
  await passkey.save();

  // Create session
  const refreshToken = generateToken(32);
  const tokenHash = hashToken(refreshToken);

  await Session.create({
    userId: user._id,
    refreshTokenHash: tokenHash,
    userAgent,
    ipAddress,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  });

  const accessToken = generateAccessToken(user._id.toString(), user.email);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60,
    user: {
      id: user._id.toString(),
      email: user.email,
      preferences: user.preferences,
      authMethods: user.authMethods,
    },
  };
}

export async function getPasskeysForUser(userId: string): Promise<IPasskey[]> {
  return Passkey.find({ userId }).sort({ createdAt: -1 });
}

export async function deletePasskey(userId: string, passkeyId: string): Promise<void> {
  const passkey = await Passkey.findOneAndDelete({ _id: passkeyId, userId });

  if (!passkey) {
    throw new AppError(404, 'PASSKEY_NOT_FOUND', 'Passkey not found');
  }

  // Check if user has any remaining passkeys
  const remaining = await Passkey.countDocuments({ userId });

  if (remaining === 0) {
    // Remove passkey from auth methods
    await User.updateOne(
      { _id: userId },
      { $pull: { authMethods: 'passkey' } }
    );
  }
}
