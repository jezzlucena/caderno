import { db } from '../config/database.js';
import { randomBytes, createHash } from 'crypto';

export interface User {
  id: string;
  api_key: string;
  created_at: number;
  last_active?: number;
}

export class UserModel {
  static generateApiKey(): string {
    // Generate a secure random API key
    return randomBytes(32).toString('hex');
  }

  static hashApiKey(apiKey: string): string {
    const salt = process.env.API_KEY_SALT || 'default-salt-change-in-production';
    return createHash('sha256').update(apiKey + salt).digest('hex');
  }

  static create(): { user: User; plainApiKey: string } {
    const id = randomBytes(16).toString('hex');
    const plainApiKey = this.generateApiKey();
    const hashedApiKey = this.hashApiKey(plainApiKey);
    const now = Date.now();

    const user: User = {
      id,
      api_key: hashedApiKey,
      created_at: now,
    };

    const stmt = db.prepare(`
      INSERT INTO users (id, api_key, created_at)
      VALUES (?, ?, ?)
    `);

    stmt.run(user.id, user.api_key, user.created_at);

    return { user, plainApiKey };
  }

  static findByApiKey(apiKey: string): User | null {
    const hashedApiKey = this.hashApiKey(apiKey);
    const stmt = db.prepare('SELECT * FROM users WHERE api_key = ?');
    const user = stmt.get(hashedApiKey) as User | undefined;
    
    if (user) {
      // Update last active timestamp
      this.updateLastActive(user.id);
    }

    return user || null;
  }

  static findById(id: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  static updateLastActive(id: string): void {
    const stmt = db.prepare('UPDATE users SET last_active = ? WHERE id = ?');
    stmt.run(Date.now(), id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static list(): User[] {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  }
}
