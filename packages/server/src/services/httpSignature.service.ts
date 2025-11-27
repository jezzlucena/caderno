import { createSign, createVerify, createHash } from 'crypto'

/**
 * HTTP Signatures for ActivityPub
 * Implements draft-cavage-http-signatures-12 spec
 * Used for server-to-server authentication in the fediverse
 */

export interface SignatureParams {
  keyId: string      // URL to the actor's public key (e.g., https://example.com/users/alice#main-key)
  privateKey: string // PEM-encoded private key
  method: string     // HTTP method (GET, POST, etc.)
  path: string       // Request path (e.g., /users/bob/inbox)
  host: string       // Target host (e.g., remote.example.com)
  date?: string      // Date header value (defaults to now)
  digest?: string    // Digest header value (for POST requests with body)
  body?: string      // Request body (for computing digest)
}

export interface SignedHeaders {
  Host: string
  Date: string
  Digest?: string
  Signature: string
  'Content-Type'?: string
}

export interface VerifyParams {
  signature: string        // The Signature header value
  method: string           // HTTP method
  path: string             // Request path
  headers: Record<string, string | string[] | undefined>  // All request headers
}

/**
 * Generate a SHA-256 digest of the request body
 * Returns in the format: SHA-256=base64digest
 */
export function generateDigest(body: string): string {
  const hash = createHash('sha256').update(body).digest('base64')
  return `SHA-256=${hash}`
}

/**
 * Build the signature string from headers according to the spec
 * This is the string that gets signed
 */
function buildSignatureString(
  headers: string[],
  values: Record<string, string>
): string {
  return headers
    .map(header => {
      if (header === '(request-target)') {
        return `(request-target): ${values['(request-target)']}`
      }
      return `${header}: ${values[header.toLowerCase()]}`
    })
    .join('\n')
}

/**
 * Sign an outgoing HTTP request for ActivityPub delivery
 * Returns the headers that should be added to the request
 */
export function signRequest(params: SignatureParams): SignedHeaders {
  const {
    keyId,
    privateKey,
    method,
    path,
    host,
    body
  } = params

  // Generate current date in HTTP date format
  const date = params.date || new Date().toUTCString()

  // Build the headers to sign
  const headersToSign = ['(request-target)', 'host', 'date']
  const headerValues: Record<string, string> = {
    '(request-target)': `${method.toLowerCase()} ${path}`,
    host: host,
    date: date
  }

  // Add digest for POST requests with body
  let digest: string | undefined
  if (body && method.toUpperCase() === 'POST') {
    digest = params.digest || generateDigest(body)
    headersToSign.push('digest')
    headerValues.digest = digest
  }

  // Build the signature string
  const signatureString = buildSignatureString(headersToSign, headerValues)

  // Sign with RSA-SHA256
  const signer = createSign('RSA-SHA256')
  signer.update(signatureString)
  signer.end()
  const signature = signer.sign(privateKey, 'base64')

  // Build the Signature header value
  const signatureHeader = [
    `keyId="${keyId}"`,
    `algorithm="rsa-sha256"`,
    `headers="${headersToSign.join(' ')}"`,
    `signature="${signature}"`
  ].join(',')

  const result: SignedHeaders = {
    Host: host,
    Date: date,
    Signature: signatureHeader
  }

  if (digest) {
    result.Digest = digest
    result['Content-Type'] = 'application/activity+json'
  }

  return result
}

/**
 * Parse a Signature header value into its components
 */
export function parseSignatureHeader(signatureHeader: string): {
  keyId: string
  algorithm: string
  headers: string[]
  signature: string
} | null {
  try {
    const params: Record<string, string> = {}

    // Parse key="value" pairs
    // Handle both comma-separated and space-separated formats
    const regex = /(\w+)="([^"]+)"/g
    let match
    while ((match = regex.exec(signatureHeader)) !== null) {
      params[match[1]] = match[2]
    }

    if (!params.keyId || !params.signature) {
      return null
    }

    return {
      keyId: params.keyId,
      algorithm: params.algorithm || 'rsa-sha256',
      headers: params.headers ? params.headers.split(' ') : ['date'],
      signature: params.signature
    }
  } catch {
    return null
  }
}

/**
 * Verify an incoming HTTP signature
 * Returns true if the signature is valid
 */
export function verifySignature(
  params: VerifyParams,
  publicKey: string
): boolean {
  try {
    const parsed = parseSignatureHeader(params.signature)
    if (!parsed) {
      console.error('[HTTP Signature] Failed to parse signature header')
      return false
    }

    // Build header values for signature verification
    const headerValues: Record<string, string> = {
      '(request-target)': `${params.method.toLowerCase()} ${params.path}`
    }

    // Extract header values (normalize to lowercase keys)
    for (const [key, value] of Object.entries(params.headers)) {
      if (value !== undefined) {
        headerValues[key.toLowerCase()] = Array.isArray(value) ? value[0] : value
      }
    }

    // Build the signature string that was signed
    const signatureString = buildSignatureString(parsed.headers, headerValues)

    // Verify the signature
    const verifier = createVerify('RSA-SHA256')
    verifier.update(signatureString)
    verifier.end()

    return verifier.verify(publicKey, parsed.signature, 'base64')
  } catch (error) {
    console.error('[HTTP Signature] Verification error:', error)
    return false
  }
}

/**
 * Verify the digest header matches the body
 */
export function verifyDigest(digest: string, body: string): boolean {
  const expectedDigest = generateDigest(body)
  return digest === expectedDigest
}

/**
 * Fetch an actor's public key from their keyId URL
 * The keyId typically points to the actor document or a key document
 */
export async function fetchPublicKey(keyId: string): Promise<string | null> {
  try {
    // The keyId might be the actor URL with a fragment (e.g., /users/alice#main-key)
    // or a separate key document URL
    const url = keyId.split('#')[0]

    const response = await fetch(url, {
      headers: {
        Accept: 'application/activity+json, application/ld+json'
      }
    })

    if (!response.ok) {
      console.error(`[HTTP Signature] Failed to fetch key: ${response.status}`)
      return null
    }

    const data = await response.json()

    // Handle different key locations
    // 1. Direct key document
    if (data.publicKeyPem) {
      return data.publicKeyPem
    }

    // 2. Actor document with publicKey property
    if (data.publicKey) {
      if (typeof data.publicKey === 'string') {
        // publicKey is a URL, fetch it
        return fetchPublicKey(data.publicKey)
      }
      if (data.publicKey.publicKeyPem) {
        return data.publicKey.publicKeyPem
      }
    }

    console.error('[HTTP Signature] Could not find public key in response')
    return null
  } catch (error) {
    console.error('[HTTP Signature] Error fetching public key:', error)
    return null
  }
}
