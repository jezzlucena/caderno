import argon2 from 'argon2'
import { randomBytes } from 'crypto'

// Argon2id configuration - OWASP recommended settings
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4     // 4 parallel threads
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

export function generateSalt(): string {
  return randomBytes(32).toString('base64')
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}
