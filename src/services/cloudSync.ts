import CryptoJS from 'crypto-js';
import type { JournalEntry } from '../store/useStore';

export interface CloudSyncData {
  entries: JournalEntry[];
  timestamp: number;
  version: string;
}

export interface SyncMetadata {
  cid: string;
  timestamp: number;
  entryCount: number;
}

// Get server URL from environment or default
const getServerUrl = (): string => {
  return import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
};

/**
 * Encrypts journal data before uploading to IPFS
 */
export const encryptData = (data: CloudSyncData, passphrase: string): string => {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, passphrase).toString();
};

/**
 * Decrypts journal data after downloading from IPFS
 */
export const decryptData = (encryptedData: string, passphrase: string): CloudSyncData => {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, passphrase);
  const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

  if (!jsonString) {
    throw new Error('Decryption failed. Invalid passphrase or corrupted data.');
  }

  return JSON.parse(jsonString);
};

/**
 * Uploads encrypted journal entries to IPFS via self-hosted server
 */
export const uploadToIPFS = async (
  entries: JournalEntry[],
  passphrase: string
): Promise<SyncMetadata> => {
  try {
    const syncData: CloudSyncData = {
      entries,
      timestamp: Date.now(),
      version: '1.0.0',
    };

    // Encrypt the data
    const encryptedData = encryptData(syncData, passphrase);

    // Upload to IPFS via server
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/ipfs/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();

    if (!result.success || !result.data || !result.data.cid) {
      throw new Error('Upload failed: No CID returned from server');
    }

    const metadata: SyncMetadata = {
      cid: result.data.cid,
      timestamp: Date.now(),
      entryCount: entries.length,
    };

    return metadata;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to upload to IPFS'
    );
  }
};

/**
 * Downloads and decrypts journal entries from IPFS via self-hosted server
 */
export const downloadFromIPFS = async (
  cid: string,
  passphrase: string
): Promise<CloudSyncData> => {
  try {
    // Download from IPFS via server
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/ipfs/download/${cid}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Download failed: No data returned from server');
    }

    const encryptedData = result.data;

    // Decrypt the data
    const syncData = decryptData(encryptedData, passphrase);

    // Validate the data structure
    if (!syncData.entries || !Array.isArray(syncData.entries)) {
      throw new Error('Invalid sync data structure');
    }

    return syncData;
  } catch (error) {
    console.error('Error downloading from IPFS:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to download from IPFS'
    );
  }
};

/**
 * Gets the storage status from IPFS via self-hosted server
 */
export const getStorageStatus = async (
  cid: string,
): Promise<{ size: number; status: string }> => {
  try {
    const serverUrl = getServerUrl();
    const response = await fetch(`${serverUrl}/api/ipfs/status/${cid}`);

    if (!response.ok) {
      return { size: 0, status: 'unavailable' };
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return { size: 0, status: 'unavailable' };
    }

    return {
      size: result.data.size,
      status: result.data.exists ? 'active' : 'unavailable',
    };
  } catch (error) {
    console.error('Error checking storage status:', error);
    return { size: 0, status: 'error' };
  }
};
