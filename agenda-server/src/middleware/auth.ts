import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    api_key: string;
    created_at: number;
    last_active?: number;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Include it in the X-API-Key header.',
    });
  }

  const user = UserModel.findByApiKey(apiKey);

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key.',
    });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (apiKey) {
    const user = UserModel.findByApiKey(apiKey);
    if (user) {
      req.user = user;
    }
  }

  next();
}
