/**
 * Export/Import utilities for journal entries
 * - Compression: gzip via CompressionStream API
 * - Encryption: AES-256-GCM with PBKDF2 key derivation
 */

import type { DecryptedEntry } from '../stores/entriesStore'

const EXPORT_FORMAT_VERSION = 1
const PBKDF2_ITERATIONS = 100000

// ============================================
// Types
// ============================================

export interface ExportedEntry {
  title: string
  content: string
  createdAt: string
  updatedAt: string
  contentHash: string
}

export interface ExportMetadata {
  version: number
  exportDate: string
  entryCount: number
  applicationName: string
}

export interface ExportPayload {
  metadata: ExportMetadata
  entries: ExportedEntry[]
}

export interface EncryptedExportPayload {
  encrypted: true
  metadata: {
    version: number
    exportDate: string
    entryCount: number
  }
  data: string   // Base64 encrypted+compressed payload
  iv: string     // Base64 IV
  salt: string   // Base64 PBKDF2 salt
}

// ============================================
// Buffer/Base64 utilities
// ============================================

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

// ============================================
// Compression utilities (gzip)
// ============================================

async function compressData(data: string): Promise<Uint8Array> {
  const blob = new Blob([data])
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'))
  const compressedBlob = await new Response(stream).blob()
  return new Uint8Array(await compressedBlob.arrayBuffer())
}

async function decompressData(data: Uint8Array): Promise<string> {
  const blob = new Blob([data.buffer as ArrayBuffer])
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'))
  const decompressedBlob = await new Response(stream).blob()
  return await decompressedBlob.text()
}

// ============================================
// Content hashing for deduplication
// ============================================

export async function hashContent(title: string, content: string): Promise<string> {
  const data = new TextEncoder().encode(`${title}:${content}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return bufferToBase64(hashBuffer)
}

// ============================================
// Export encryption key derivation
// ============================================

async function deriveExportKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ============================================
// Export function
// ============================================

export async function exportEntries(
  entries: DecryptedEntry[],
  passphrase?: string
): Promise<Blob> {
  // Create export payload with content hashes
  const exportedEntries: ExportedEntry[] = await Promise.all(
    entries.map(async (entry) => ({
      title: entry.title,
      content: entry.content,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      contentHash: await hashContent(entry.title, entry.content)
    }))
  )

  const payload: ExportPayload = {
    metadata: {
      version: EXPORT_FORMAT_VERSION,
      exportDate: new Date().toISOString(),
      entryCount: entries.length,
      applicationName: 'Caderno'
    },
    entries: exportedEntries
  }

  const jsonString = JSON.stringify(payload)

  if (passphrase) {
    // Encrypt the payload
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveExportKey(passphrase, salt)

    // Compress first, then encrypt
    const compressedData = await compressData(jsonString)
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      compressedData.buffer as ArrayBuffer
    )

    const encryptedPayload: EncryptedExportPayload = {
      encrypted: true,
      metadata: {
        version: EXPORT_FORMAT_VERSION,
        exportDate: payload.metadata.exportDate,
        entryCount: entries.length
      },
      data: bufferToBase64(encryptedData),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt)
    }

    // Compress the encrypted JSON wrapper as well
    const encryptedJsonString = JSON.stringify(encryptedPayload)
    const compressedEncrypted = await compressData(encryptedJsonString)
    return new Blob([compressedEncrypted.buffer as ArrayBuffer], { type: 'application/gzip' })
  } else {
    // Compress without encryption
    const compressedData = await compressData(jsonString)
    return new Blob([compressedData.buffer as ArrayBuffer], { type: 'application/gzip' })
  }
}

// ============================================
// Import function
// ============================================

export interface ImportResult {
  payload: ExportPayload
  wasEncrypted: boolean
}

export async function importEntries(
  file: File,
  passphrase?: string
): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer()

  // Step 1: Decompress the .journal file (gzip format)
  let jsonString: string
  try {
    jsonString = await decompressData(new Uint8Array(arrayBuffer))
  } catch {
    throw new Error('Invalid file format. Please select a valid .journal file.')
  }

  // Step 2: Parse the JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid file format. Please select a valid .journal file.')
  }

  // Step 3: Check if it's encrypted
  if (typeof parsed === 'object' && parsed !== null && 'encrypted' in parsed && (parsed as EncryptedExportPayload).encrypted === true) {
    const encryptedPayload = parsed as EncryptedExportPayload

    if (!passphrase) {
      throw new Error('This file is encrypted. Please provide a passphrase.')
    }

    const salt = new Uint8Array(base64ToBuffer(encryptedPayload.salt))
    const iv = new Uint8Array(base64ToBuffer(encryptedPayload.iv))
    const encryptedData = new Uint8Array(base64ToBuffer(encryptedPayload.data))
    const key = await deriveExportKey(passphrase, salt)

    try {
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      )

      const decompressedString = await decompressData(new Uint8Array(decryptedData))
      return {
        payload: JSON.parse(decompressedString),
        wasEncrypted: true
      }
    } catch {
      throw new Error('Decryption failed. Please check your passphrase.')
    }
  }

  // Step 4: Not encrypted - should be plain payload
  if (typeof parsed === 'object' && parsed !== null && 'metadata' in parsed && 'entries' in parsed) {
    return {
      payload: parsed as ExportPayload,
      wasEncrypted: false
    }
  }

  throw new Error('Invalid file format. Please select a valid .journal file.')
}

// ============================================
// Check if file appears encrypted
// ============================================

export async function isFileEncrypted(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const jsonString = await decompressData(new Uint8Array(arrayBuffer))
    const parsed = JSON.parse(jsonString)
    return parsed.encrypted === true
  } catch {
    return false
  }
}
