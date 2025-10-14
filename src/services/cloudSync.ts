import lighthouse from '@lighthouse-web3/sdk';
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
 * Uploads encrypted journal entries to IPFS via Lighthouse
 */
export const uploadToIPFS = async (
  entries: JournalEntry[],
  passphrase: string,
  apiKey: string
): Promise<SyncMetadata> => {
  try {
    const syncData: CloudSyncData = {
      entries,
      timestamp: Date.now(),
      version: '1.0.0',
    };

    // Encrypt the data
    const encryptedData = encryptData(syncData, passphrase);

    // Create a File object from the encrypted data
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const file = new File([blob], 'agenda-backup.encrypted', {
      type: 'application/octet-stream',
    });

    // Upload to IPFS via Lighthouse
    const response = await lighthouse.upload([file], apiKey);

    if (!response || !response.data || !response.data.Hash) {
      throw new Error('Upload failed: No CID returned from Lighthouse');
    }

    const metadata: SyncMetadata = {
      cid: response.data.Hash,
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
 * Downloads and decrypts journal entries from IPFS
 */
export const downloadFromIPFS = async (
  cid: string,
  passphrase: string
): Promise<CloudSyncData> => {
  try {
    // Download from IPFS via public gateway
    const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;

    const response = await fetch(gatewayUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const encryptedData = await response.text();

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
 * Gets the storage status from Lighthouse (file info)
 */
export const getStorageStatus = async (
  cid: string,
  apiKey: string
): Promise<{ size: number; status: string }> => {
  try {
    // This is a placeholder - Lighthouse API might have different methods
    // to check file status. For now, we'll just verify the file exists
    const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    const response = await fetch(gatewayUrl, { method: 'HEAD' });

    return {
      size: parseInt(response.headers.get('content-length') || '0'),
      status: response.ok ? 'active' : 'unavailable',
    };
  } catch (error) {
    console.error('Error checking storage status:', error);
    return { size: 0, status: 'error' };
  }
};
