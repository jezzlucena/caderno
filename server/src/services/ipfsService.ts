import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import { createLibp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { CID } from 'multiformats/cid';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ipfs-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/ipfs-combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Bootstrap nodes for connecting to the IPFS network
const BOOTSTRAP_NODES = [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
];

class IPFSService {
  private helia: any = null;
  private fs: any = null;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      logger.info('Initializing IPFS node...');

      // Create libp2p node
      const libp2p = await createLibp2p({
        datastore: new MemoryDatastore(),
        addresses: {
          listen: []
        },
        transports: [],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
          bootstrap({
            list: BOOTSTRAP_NODES
          })
        ],
        services: {
          identify: identify()
        }
      });

      // Create Helia node
      this.helia = await createHelia({
        libp2p,
        blockstore: new MemoryBlockstore(),
        datastore: new MemoryDatastore()
      });

      this.fs = unixfs(this.helia);
      this.initialized = true;

      logger.info('IPFS node initialized successfully', {
        peerId: this.helia.libp2p.peerId.toString()
      });
    } catch (error) {
      logger.error('Failed to initialize IPFS node', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async upload(data: string): Promise<string> {
    try {
      await this.initialize();

      logger.info('Uploading data to IPFS', {
        dataSize: data.length
      });

      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);

      // Add file to IPFS
      const cid = await this.fs.addBytes(bytes);

      const cidString = cid.toString();

      logger.info('Data uploaded to IPFS successfully', {
        cid: cidString,
        size: bytes.length
      });

      return cidString;
    } catch (error) {
      logger.error('Failed to upload to IPFS', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('Failed to upload to IPFS: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async download(cidString: string): Promise<string> {
    try {
      await this.initialize();

      logger.info('Downloading data from IPFS', { cid: cidString });

      const cid = CID.parse(cidString);

      // Get file from IPFS
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.fs.cat(cid)) {
        chunks.push(chunk);
      }

      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      const decoder = new TextDecoder();
      const data = decoder.decode(result);

      logger.info('Data downloaded from IPFS successfully', {
        cid: cidString,
        size: data.length
      });

      return data;
    } catch (error) {
      logger.error('Failed to download from IPFS', {
        cid: cidString,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('Failed to download from IPFS: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getStatus(cidString: string): Promise<{ exists: boolean; size: number }> {
    try {
      await this.initialize();

      const cid = CID.parse(cidString);
      const stat = await this.fs.stat(cid);

      return {
        exists: true,
        size: stat.fileSize || 0
      };
    } catch (error) {
      logger.warn('Failed to get IPFS status', {
        cid: cidString,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        exists: false,
        size: 0
      };
    }
  }

  async shutdown(): Promise<void> {
    if (this.helia) {
      try {
        logger.info('Shutting down IPFS node...');
        await this.helia.stop();
        this.initialized = false;
        this.helia = null;
        this.fs = null;
        this.initPromise = null;
        logger.info('IPFS node shut down successfully');
      } catch (error) {
        logger.error('Error shutting down IPFS node', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
