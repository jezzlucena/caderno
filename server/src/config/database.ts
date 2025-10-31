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

export const db: Database.Database = new Database(dbPath);
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
      execution_time INTEGER NOT NULL,
      executed INTEGER DEFAULT 0,
      original_duration_ms INTEGER,
      entry_selection_type TEXT NOT NULL,
      entry_ids TEXT,
      date_range_start INTEGER,
      date_range_end INTEGER,
      entry_count INTEGER,
      passphrase TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      executed_at INTEGER,
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
    CREATE INDEX IF NOT EXISTS idx_schedules_executed ON schedules(executed);
    CREATE INDEX IF NOT EXISTS idx_recipients_schedule ON recipients(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_schedule ON execution_logs(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_encrypted_entries_user ON encrypted_entries(user_id);
  `);

  console.log('Database initialized successfully');
  
  // Run migrations
  migrateDatabase();
}

// Migration function to handle schema changes
function migrateDatabase() {
  try {
    // Check if schedules table has old schema (cron_expression column)
    const tableInfo = db.pragma('table_info(schedules)') as Array<{ name: string }>;
    const columns = tableInfo.map(col => col.name);
    
    if (columns.includes('cron_expression')) {
      console.log('Migrating schedules table to new schema...');
      
      // Create new table with updated schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS schedules_new (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          execution_time INTEGER NOT NULL,
          executed INTEGER DEFAULT 0,
          original_duration_ms INTEGER,
          entry_selection_type TEXT NOT NULL,
          entry_ids TEXT,
          date_range_start INTEGER,
          date_range_end INTEGER,
          entry_count INTEGER,
          passphrase TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          executed_at INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      
      // Migrate existing data
      // Note: Old schedules will be marked as executed since they were recurring
      db.exec(`
        INSERT INTO schedules_new (
          id, user_id, name, execution_time, executed, entry_selection_type,
          entry_ids, date_range_start, date_range_end, entry_count, passphrase,
          created_at, updated_at, executed_at
        )
        SELECT 
          id, user_id, name, 
          COALESCE(next_run, created_at + 60000) as execution_time,
          1 as executed,
          entry_selection_type, entry_ids, date_range_start, date_range_end,
          NULL as entry_count,
          passphrase, created_at, updated_at, last_run as executed_at
        FROM schedules;
      `);
      
      // Drop old table and rename new one
      db.exec(`
        DROP TABLE schedules;
        ALTER TABLE schedules_new RENAME TO schedules;
        
        CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_executed ON schedules(executed);
      `);
      
      console.log('Migration completed successfully');
    }

    // Check if schedules table has original_duration_ms column
    const currentColumns = db.pragma('table_info(schedules)') as Array<{ name: string }>;
    const currentColumnNames = currentColumns.map(col => col.name);
    
    if (!currentColumnNames.includes('original_duration_ms')) {
      console.log('Adding original_duration_ms column to schedules table...');
      db.exec(`ALTER TABLE schedules ADD COLUMN original_duration_ms INTEGER;`);
      console.log('Added original_duration_ms column successfully');
    }
  } catch (error) {
    console.error('Migration error:', error);
    // Non-fatal - continue with database operations
  }
}

export function closeDatabase() {
  db.close();
}
