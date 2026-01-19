import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  generateRegistrationOptionsForUser,
  verifyRegistrationForUser,
  generateAuthenticationOptionsForUser,
  verifyAuthenticationForUser,
  getPasskeysForUser,
  deletePasskey,
} from '../services/passkeyService.js';
import { env } from '../config/env.js';

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    maxAge: env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export async function getRegistrationOptions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const options = await generateRegistrationOptionsForUser(
      req.userId!,
      req.body.name
    );
    res.json(options);
  } catch (error) {
    next(error);
  }
}

export async function verifyRegistration(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const passkey = await verifyRegistrationForUser(
      req.userId!,
      req.body.response,
      req.body.name
    );

    res.status(201).json({
      id: passkey._id.toString(),
      name: passkey.name,
      createdAt: passkey.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLoginOptions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = req.query.email as string;

    if (!email) {
      res.status(400).json({
        error: {
          code: 'EMAIL_REQUIRED',
          message: 'Email is required',
        },
      });
      return;
    }

    const options = await generateAuthenticationOptionsForUser(email);
    res.json(options);
  } catch (error) {
    next(error);
  }
}

export async function verifyLogin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, response } = req.body;

    const result = await verifyAuthenticationForUser(
      email,
      response,
      req.headers['user-agent'],
      req.ip
    );

    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function listPasskeys(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const passkeys = await getPasskeysForUser(req.userId!);

    res.json({
      passkeys: passkeys.map((pk) => ({
        id: pk._id.toString(),
        name: pk.name,
        createdAt: pk.createdAt,
        lastUsedAt: pk.lastUsedAt,
        deviceType: pk.deviceType,
        backedUp: pk.backedUp,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function removePasskey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deletePasskey(req.userId!, req.params.id as string);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
