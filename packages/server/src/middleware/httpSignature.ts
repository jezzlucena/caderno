import { Request, Response, NextFunction } from 'express'
import {
  parseSignatureHeader,
  verifySignature,
  verifyDigest,
  fetchPublicKey
} from '../services/httpSignature.service.js'

// Cache for public keys (simple in-memory cache)
const keyCache = new Map<string, { key: string; expires: number }>()
const KEY_CACHE_TTL = 3600000 // 1 hour

async function getCachedPublicKey(keyId: string): Promise<string | null> {
  const cached = keyCache.get(keyId)
  if (cached && cached.expires > Date.now()) {
    return cached.key
  }

  const key = await fetchPublicKey(keyId)
  if (key) {
    keyCache.set(keyId, {
      key,
      expires: Date.now() + KEY_CACHE_TTL
    })
  }

  return key
}

/**
 * Middleware to verify HTTP Signatures on incoming ActivityPub requests
 * This is required for server-to-server authentication in the fediverse
 *
 * Options:
 * - required: If true, reject requests without valid signatures (default: true)
 * - allowUnsigned: If true, allow requests without signatures but still verify if present
 */
export function verifyHttpSignature(options: { required?: boolean } = {}) {
  const { required = true } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    const signatureHeader = req.headers.signature as string | undefined

    // Check if signature is present
    if (!signatureHeader) {
      if (required) {
        console.warn('[HTTP Signature] Missing Signature header')
        res.status(401).json({ error: 'Missing HTTP Signature' })
        return
      }
      // Allow unsigned requests if not required
      return next()
    }

    try {
      // Parse the signature header
      const parsed = parseSignatureHeader(signatureHeader)
      if (!parsed) {
        console.warn('[HTTP Signature] Invalid signature header format')
        res.status(401).json({ error: 'Invalid HTTP Signature format' })
        return
      }

      // Verify digest if present (required for POST requests)
      const digestHeader = req.headers.digest as string | undefined
      if (digestHeader && req.body) {
        const bodyString = typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)

        if (!verifyDigest(digestHeader, bodyString)) {
          console.warn('[HTTP Signature] Digest mismatch')
          res.status(401).json({ error: 'Digest verification failed' })
          return
        }
      }

      // Fetch the public key from the keyId URL
      const publicKey = await getCachedPublicKey(parsed.keyId)
      if (!publicKey) {
        console.warn(`[HTTP Signature] Could not fetch public key: ${parsed.keyId}`)
        res.status(401).json({ error: 'Could not fetch signing key' })
        return
      }

      // Build the request path
      const path = req.originalUrl || req.url

      // Verify the signature
      const isValid = verifySignature(
        {
          signature: signatureHeader,
          method: req.method,
          path,
          headers: req.headers as Record<string, string | string[] | undefined>
        },
        publicKey
      )

      if (!isValid) {
        console.warn('[HTTP Signature] Signature verification failed')
        res.status(401).json({ error: 'HTTP Signature verification failed' })
        return
      }

      // Attach the verified actor info to the request
      (req as any).verifiedActor = {
        keyId: parsed.keyId,
        // Extract actor URL from keyId (remove the #key-fragment)
        actorUrl: parsed.keyId.split('#')[0]
      }

      console.log(`[HTTP Signature] Verified request from: ${parsed.keyId}`)
      next()
    } catch (error) {
      console.error('[HTTP Signature] Verification error:', error)
      res.status(500).json({ error: 'Signature verification error' })
    }
  }
}

/**
 * Optional middleware that verifies signatures if present but doesn't require them
 * Useful for endpoints that support both authenticated and unauthenticated access
 */
export const optionalHttpSignature = verifyHttpSignature({ required: false })

/**
 * Strict middleware that requires valid HTTP signatures
 * Use this for inbox endpoints
 */
export const requireHttpSignature = verifyHttpSignature({ required: true })
