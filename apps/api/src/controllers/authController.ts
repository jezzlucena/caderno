import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginWithPassword,
  refreshSession,
  logout,
  createMagicLink,
  verifyMagicLink,
  getAuthMethods,
} from '../services/authService.js';
import { sendMagicLinkEmail } from '../services/emailService.js';
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

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await registerUser(
      req.body,
      req.headers['user-agent'],
      req.ip
    );

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await loginWithPassword(
      req.body,
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

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token provided',
        },
      });
      return;
    }

    const result = await refreshSession(
      refreshToken,
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
    clearRefreshTokenCookie(res);
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await logout(refreshToken);
    }

    clearRefreshTokenCookie(res);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function requestMagicLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;
    const token = await createMagicLink(email);

    // Send email (don't reveal if user exists)
    await sendMagicLinkEmail(email, token);

    res.json({
      success: true,
      message: 'If an account exists with this email, a magic link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyMagicLinkHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.body;

    const result = await verifyMagicLink(
      token,
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

export async function getAuthMethodsHandler(
  req: Request,
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

    const methods = await getAuthMethods(email);
    res.json(methods);
  } catch (error) {
    next(error);
  }
}
