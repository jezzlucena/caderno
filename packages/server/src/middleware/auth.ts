import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type TokenPayload } from '../utils/jwt.js'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' })
    return
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  const payload = await verifyToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.user = payload
  next()
}

// Optional auth middleware - doesn't require auth but sets req.user if valid token provided
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth header - continue without user
    next()
    return
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  const payload = await verifyToken(token)
  if (payload) {
    req.user = payload
  }
  // Continue regardless of whether token was valid
  next()
}

// Role-based access control middleware factory
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}
