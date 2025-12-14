/**
 * Client-side E2EE encryption using Web Crypto API
 * - Key derivation: PBKDF2 with user's password + keySalt
 * - Encryption: AES-256-GCM
 * - The server NEVER sees plaintext or the derived key
 */

const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH = 256

// Convert string to Uint8Array
function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

// Convert ArrayBuffer to string
function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

// Convert ArrayBuffer or Uint8Array to base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convert base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

/**
 * Derive an encryption key from password and salt using PBKDF2
 * Key is extractable so it can be encrypted with passkey PRF
 */
export async function deriveKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const salt = base64ToBuffer(saltBase64)
  const passwordBuffer = stringToBuffer(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive AES-GCM key (extractable for passkey encryption)
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true, // Extractable for passkey encryption
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt plaintext using AES-GCM
 * Returns { ciphertext, iv } both as base64 strings
 */
export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintextBuffer = stringToBuffer(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBuffer.buffer as ArrayBuffer
  )

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv)
  }
}

/**
 * Decrypt ciphertext using AES-GCM
 */
export async function decrypt(
  key: CryptoKey,
  ciphertextBase64: string,
  ivBase64: string
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64)
  const iv = base64ToBuffer(ivBase64)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return bufferToString(plaintext)
}

/**
 * Derive a unique IV for content from the base IV
 * This ensures title and content use different IVs while only storing one
 * XOR the base IV with a constant to create a distinct IV
 */
function deriveContentIV(baseIV: Uint8Array): Uint8Array {
  const contentIV = new Uint8Array(baseIV.length)
  for (let i = 0; i < baseIV.length; i++) {
    // XOR with 0xFF to create a distinct IV
    contentIV[i] = baseIV[i] ^ 0xFF
  }
  return contentIV
}

/**
 * Encrypt an entry (title + content) with unique IVs
 * Title uses the base IV, content uses a derived IV
 * This is critical for AES-GCM security - reusing IVs is dangerous
 */
export async function encryptEntry(
  key: CryptoKey,
  title: string,
  content: string
): Promise<{ encryptedTitle: string; encryptedContent: string; iv: string }> {
  // Generate random base IV (12 bytes for AES-GCM)
  const titleIV = crypto.getRandomValues(new Uint8Array(12))
  // Derive a unique IV for content
  const contentIV = deriveContentIV(titleIV)

  const titleBuffer = stringToBuffer(title)
  const contentBuffer = stringToBuffer(content)

  const [encryptedTitleBuffer, encryptedContentBuffer] = await Promise.all([
    crypto.subtle.encrypt({ name: 'AES-GCM', iv: titleIV }, key, titleBuffer.buffer as ArrayBuffer),
    crypto.subtle.encrypt({ name: 'AES-GCM', iv: contentIV.buffer as ArrayBuffer }, key, contentBuffer.buffer as ArrayBuffer)
  ])

  return {
    encryptedTitle: bufferToBase64(encryptedTitleBuffer),
    encryptedContent: bufferToBase64(encryptedContentBuffer),
    iv: bufferToBase64(titleIV) // Store the base IV
  }
}

/**
 * Decrypt an entry (title + content)
 * Title uses the stored IV, content uses a derived IV
 */
export async function decryptEntry(
  key: CryptoKey,
  encryptedTitle: string,
  encryptedContent: string,
  ivBase64: string
): Promise<{ title: string; content: string }> {
  const titleIV = new Uint8Array(base64ToBuffer(ivBase64))
  const contentIV = deriveContentIV(titleIV)

  const [titleBuffer, contentBuffer] = await Promise.all([
    crypto.subtle.decrypt({ name: 'AES-GCM', iv: titleIV }, key, base64ToBuffer(encryptedTitle)),
    crypto.subtle.decrypt({ name: 'AES-GCM', iv: contentIV.buffer as ArrayBuffer }, key, base64ToBuffer(encryptedContent))
  ])

  return {
    title: bufferToString(titleBuffer),
    content: bufferToString(contentBuffer)
  }
}

/**
 * Legacy decrypt for entries encrypted with the same IV for title and content
 * Used for backwards compatibility with existing entries
 */
export async function decryptEntryLegacy(
  key: CryptoKey,
  encryptedTitle: string,
  encryptedContent: string,
  ivBase64: string
): Promise<{ title: string; content: string }> {
  const iv = base64ToBuffer(ivBase64)

  const [titleBuffer, contentBuffer] = await Promise.all([
    crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBuffer(encryptedTitle)),
    crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBuffer(encryptedContent))
  ])

  return {
    title: bufferToString(titleBuffer),
    content: bufferToString(contentBuffer)
  }
}

/**
 * Smart decrypt that tries the new method first, falls back to legacy
 * This ensures backwards compatibility with existing encrypted entries
 */
export async function decryptEntryCompat(
  key: CryptoKey,
  encryptedTitle: string,
  encryptedContent: string,
  ivBase64: string
): Promise<{ title: string; content: string }> {
  try {
    // Try new method first (derived IV for content)
    return await decryptEntry(key, encryptedTitle, encryptedContent, ivBase64)
  } catch {
    // Fall back to legacy method (same IV for both)
    return await decryptEntryLegacy(key, encryptedTitle, encryptedContent, ivBase64)
  }
}

// ============================================
// Payload Encryption (for Dead Man's Switch)
// ============================================

/**
 * Generate a random encryption key for payload encryption
 * Returns the key as a base64 string (for storage/transmission)
 */
export async function generatePayloadKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32)) // 256-bit key
  return bufferToBase64(key)
}

/**
 * Import a base64 key string as a CryptoKey for payload operations
 */
async function importPayloadKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(keyBase64)
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a blob (e.g., PDF) with a payload key
 * Returns { encryptedData, iv } as base64 strings
 */
export async function encryptPayload(
  keyBase64: string,
  data: ArrayBuffer
): Promise<{ encryptedData: string; iv: string }> {
  const key = await importPayloadKey(keyBase64)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return {
    encryptedData: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv)
  }
}

/**
 * Decrypt an encrypted payload with the key
 * Returns the decrypted data as ArrayBuffer
 */
export async function decryptPayload(
  keyBase64: string,
  encryptedDataBase64: string,
  ivBase64: string
): Promise<ArrayBuffer> {
  const key = await importPayloadKey(keyBase64)
  const encryptedData = base64ToBuffer(encryptedDataBase64)
  const iv = base64ToBuffer(ivBase64)

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  )
}

/**
 * Encrypt a Blob and return encrypted data as base64
 */
export async function encryptBlob(
  keyBase64: string,
  blob: Blob
): Promise<{ encryptedData: string; iv: string }> {
  const arrayBuffer = await blob.arrayBuffer()
  return encryptPayload(keyBase64, arrayBuffer)
}

/**
 * Decrypt encrypted data back to a Blob
 */
export async function decryptToBlob(
  keyBase64: string,
  encryptedDataBase64: string,
  ivBase64: string,
  mimeType: string = 'application/pdf'
): Promise<Blob> {
  const decryptedBuffer = await decryptPayload(keyBase64, encryptedDataBase64, ivBase64)
  return new Blob([decryptedBuffer], { type: mimeType })
}

// ============================================
// PRF-based Key Derivation (for Passkey Encryption)
// ============================================

/**
 * Derive an encryption key from PRF output using HKDF
 * PRF output is the raw bytes from WebAuthn PRF extension
 */
export async function deriveKeyFromPrf(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  // Import PRF output as key material for HKDF
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    prfOutput,
    'HKDF',
    false,
    ['deriveKey']
  )

  // Derive AES-GCM key using HKDF
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new ArrayBuffer(0), // No additional salt needed - PRF output is already unique
      info: stringToBuffer('caderno-master-key-encryption').buffer as ArrayBuffer
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  )
}

/**
 * Export the master encryption key as raw bytes
 * This is used to encrypt the key with PRF-derived key
 */
export async function exportMasterKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key)
}

/**
 * Import raw key bytes as a CryptoKey (for decrypted master keys)
 */
export async function importMasterKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true, // Extractable so it can be re-exported if needed
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt the master key with a PRF-derived key
 * Returns { encryptedKey, iv } as base64 strings
 */
export async function encryptMasterKeyWithPrf(
  masterKey: CryptoKey,
  prfKey: CryptoKey
): Promise<{ encryptedKey: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Export and encrypt the master key
  const masterKeyBytes = await exportMasterKey(masterKey)
  const encryptedBytes = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    prfKey,
    masterKeyBytes
  )

  return {
    encryptedKey: bufferToBase64(encryptedBytes),
    iv: bufferToBase64(iv)
  }
}

/**
 * Decrypt the master key with a PRF-derived key
 * Returns the decrypted master key as a CryptoKey
 */
export async function decryptMasterKeyWithPrf(
  encryptedKeyBase64: string,
  ivBase64: string,
  prfKey: CryptoKey
): Promise<CryptoKey> {
  const encryptedBytes = base64ToBuffer(encryptedKeyBase64)
  const iv = base64ToBuffer(ivBase64)

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    prfKey,
    encryptedBytes
  )

  return importMasterKey(decryptedBytes)
}

/**
 * Convert base64url to ArrayBuffer (for PRF salt)
 */
export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  // Convert base64url to base64
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - base64url.length % 4) % 4, '=')
  return base64ToBuffer(base64)
}

/**
 * Convert ArrayBuffer to base64url string
 */
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const base64 = bufferToBase64(buffer)
  // Convert base64 to base64url
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
