import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/caderno.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      api_key TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL,
      last_active INTEGER
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      entry_selection_type TEXT NOT NULL,
      entry_ids TEXT,
      date_range_start INTEGER,
      date_range_end INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_run INTEGER,
      next_run INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipients (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      entry_count INTEGER,
      recipients_sent INTEGER,
      error_message TEXT,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS encrypted_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
    CREATE INDEX IF NOT EXISTS idx_recipients_schedule ON recipients(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_schedule ON execution_logs(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_encrypted_entries_user ON encrypted_entries(user_id);
  `);

  console.log('Database initialized successfully');
}

export function closeDatabase() {
  db.close();
}
