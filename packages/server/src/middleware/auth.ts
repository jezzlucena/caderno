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
