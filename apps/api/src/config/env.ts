import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const SECRETS_FILE = path.join(DATA_DIR, '.secrets');

interface Secrets {
  sessionSecret: string;
  encryptionKey: string;
}

function generateSecrets(): Secrets {
  return {
    sessionSecret: crypto.randomBytes(64).toString('hex'),
    encryptionKey: crypto.randomBytes(32).toString('hex'),
  };
}

function loadOrCreateSecrets(): Secrets {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(SECRETS_FILE)) {
      const data = fs.readFileSync(SECRETS_FILE, 'utf-8');
      return JSON.parse(data) as Secrets;
    }

    const secrets = generateSecrets();
    fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2), {
      mode: 0o600,
    });
    return secrets;
  } catch (error) {
    console.error('Failed to load/create secrets, using environment variables or defaults');
    return {
      sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
      encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    };
  }
}

const secrets = loadOrCreateSecrets();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/caderno',

  // Auto-generated secrets
  SESSION_SECRET: process.env.SESSION_SECRET || secrets.sessionSecret,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || secrets.encryptionKey,

  // JWT settings
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 7,

  // WebAuthn settings
  RP_NAME: process.env.RP_NAME || 'Caderno',
  RP_ID: process.env.RP_ID || 'localhost',
  ORIGIN: process.env.ORIGIN || 'http://localhost:5173',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,

  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export type Env = typeof env;
