import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { env } from '../config/env.js'

export interface TokenPayload extends JWTPayload {
  userId: number
  email: string
  role: string
}

const getSecret = () => new TextEncoder().encode(env.JWT_SECRET)

export async function signToken(payload: { userId: number; email: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as TokenPayload
  } catch {
    return null
  }
}
