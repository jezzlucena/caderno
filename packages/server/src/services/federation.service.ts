import { generateKeyPairSync } from 'crypto'

/**
 * Generate RSA key pair for ActivityPub HTTP Signatures
 * Returns PEM-encoded public and private keys
 */
export function generateRSAKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })

  return { publicKey, privateKey }
}

/**
 * Validate username format for federation
 * Must be alphanumeric with underscores, 3-30 characters
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

/**
 * Normalize username (lowercase)
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase()
}
