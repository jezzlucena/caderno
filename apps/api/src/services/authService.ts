import argon2 from 'argon2';
import { User, IUser } from '../models/User.js';
import { Session } from '../models/Session.js';
import { MagicLink } from '../models/MagicLink.js';
import { getAppSettings } from '../models/AppSettings.js';
import { generateAccessToken } from '../middleware/auth.js';
import { hashToken, generateToken } from '../config/encryption.js';
import { env } from '../config/env.js';
import { isSystemSmtpConfigured } from './emailService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { RegisterUserInput, LoginUserInput } from '@caderno/shared';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64MB
  timeCost: 3,
  parallelism: 4,
};

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    preferences: IUser['preferences'];
    authMethods: IUser['authMethods'];
  };
}

export async function registerUser(
  input: RegisterUserInput,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  if (!env.REGISTRATION_ENABLED) {
    throw new AppError(403, 'REGISTRATION_DISABLED', 'Registration is disabled');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new AppError(409, 'EMAIL_EXISTS', 'A user with this email already exists');
  }

  // Hash password
  const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);

  // Create user
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    authMethods: ['password'],
  });

  // Create session
  return createSession(user, userAgent, ipAddress);
}

export async function loginWithPassword(
  input: LoginUserInput,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email.toLowerCase() });

  if (!user || !user.passwordHash) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isValid = await argon2.verify(user.passwordHash, input.password);

  if (!isValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  return createSession(user, userAgent, ipAddress);
}

export async function refreshSession(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  const tokenHash = hashToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash });

  if (!session) {
    throw new AppError(401, 'INVALID_SESSION', 'Invalid or expired session');
  }

  if (session.expiresAt < new Date()) {
    await session.deleteOne();
    throw new AppError(401, 'SESSION_EXPIRED', 'Session has expired');
  }

  const user = await User.findById(session.userId);
  if (!user) {
    await session.deleteOne();
    throw new AppError(401, 'USER_NOT_FOUND', 'User no longer exists');
  }

  // Rotate refresh token
  const newRefreshToken = generateToken(32);
  const newTokenHash = hashToken(newRefreshToken);

  session.refreshTokenHash = newTokenHash;
  session.rotatedAt = new Date();
  session.userAgent = userAgent;
  session.ipAddress = ipAddress;
  session.expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await session.save();

  const accessToken = generateAccessToken(user._id.toString(), user.email);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    user: {
      id: user._id.toString(),
      email: user.email,
      preferences: user.preferences,
      authMethods: user.authMethods,
    },
  };
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await Session.deleteOne({ refreshTokenHash: tokenHash });
}

export async function logoutAll(userId: string): Promise<void> {
  await Session.deleteMany({ userId });
}

async function createSession(
  user: IUser,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
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

// Magic Link
export async function createMagicLink(email: string): Promise<string> {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal whether user exists
    return generateToken(32);
  }

  // Delete any existing magic links for this user
  await MagicLink.deleteMany({ email: email.toLowerCase() });

  const token = generateToken(32);
  const tokenHash = hashToken(token);

  await MagicLink.create({
    email: email.toLowerCase(),
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  });

  // Add magic-link to auth methods if not already present
  if (!user.authMethods.includes('magic-link')) {
    user.authMethods.push('magic-link');
    await user.save();
  }

  return token;
}

export async function verifyMagicLink(
  token: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthResult> {
  const tokenHash = hashToken(token);
  const magicLink = await MagicLink.findOne({ tokenHash, usedAt: null });

  if (!magicLink) {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired magic link');
  }

  if (magicLink.expiresAt < new Date()) {
    await magicLink.deleteOne();
    throw new AppError(401, 'TOKEN_EXPIRED', 'Magic link has expired');
  }

  const user = await User.findOne({ email: magicLink.email });

  if (!user) {
    throw new AppError(401, 'USER_NOT_FOUND', 'User not found');
  }

  // Mark magic link as used
  magicLink.usedAt = new Date();
  await magicLink.save();

  return createSession(user, userAgent, ipAddress);
}

export async function getAuthMethods(email: string): Promise<{
  password: boolean;
  passkey: boolean;
  magicLink: boolean;
}> {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Return default for non-existent user (don't reveal existence)
    return { password: true, passkey: false, magicLink: false };
  }

  return {
    password: user.authMethods.includes('password'),
    passkey: user.authMethods.includes('passkey'),
    magicLink: user.authMethods.includes('magic-link') || !!user.smtpConfig || isSystemSmtpConfigured(),
  };
}
