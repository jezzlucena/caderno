import { db } from '../config/database.js';
import { randomBytes } from 'crypto';

export interface Schedule {
  id: string;
  user_id: string;
  name: string;
  execution_time: number;
  executed: boolean;
  original_duration_ms?: number;
  entry_selection_type: 'all' | 'specific' | 'date_range';
  entry_ids?: string[];
  date_range_start?: number;
  date_range_end?: number;
  entry_count?: number;
  passphrase: string;
  created_at: number;
  updated_at: number;
  executed_at?: number;
}

export interface Recipient {
  id: string;
  schedule_id: string;
  type: 'email' | 'sms';
  value: string;
  created_at: number;
}

export interface ExecutionLog {
  id: string;
  schedule_id: string;
  status: 'running' | 'success' | 'failed';
  started_at: number;
  completed_at?: number;
  entry_count?: number;
  recipients_sent?: number;
  error_message?: string;
}

export class ScheduleModel {
  static create(userId: string, data: Partial<Schedule>): Schedule {
    const id = randomBytes(16).toString('hex');
    const now = Date.now();

    if (!data.passphrase) {
      throw new Error('Passphrase is required');
    }

    if (!data.execution_time) {
      throw new Error('Execution time is required');
    }

    const schedule: Schedule = {
      id,
      user_id: userId,
      name: data.name || 'Untitled Schedule',
      execution_time: data.execution_time,
      executed: false,
      original_duration_ms: data.original_duration_ms,
      entry_selection_type: data.entry_selection_type || 'all',
      entry_ids: data.entry_ids,
      date_range_start: data.date_range_start,
      date_range_end: data.date_range_end,
      entry_count: data.entry_count,
      passphrase: data.passphrase,
      created_at: now,
      updated_at: now,
      executed_at: undefined,
    };

    const stmt = db.prepare(`
      INSERT INTO schedules (
        id, user_id, name, execution_time, executed, original_duration_ms, entry_selection_type,
        entry_ids, date_range_start, date_range_end, entry_count, passphrase, created_at, updated_at,
        executed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      schedule.id,
      schedule.user_id,
      schedule.name,
      schedule.execution_time,
      schedule.executed ? 1 : 0,
      schedule.original_duration_ms || null,
      schedule.entry_selection_type,
      schedule.entry_ids ? JSON.stringify(schedule.entry_ids) : null,
      schedule.date_range_start || null,
      schedule.date_range_end || null,
      schedule.entry_count || null,
      schedule.passphrase,
      schedule.created_at,
      schedule.updated_at,
      schedule.executed_at || null
    );

    return schedule;
  }

  static findById(id: string): Schedule | null {
    const stmt = db.prepare('SELECT * FROM schedules WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToSchedule(row) : null;
  }

  static findByUserId(userId: string): Schedule[] {
    const stmt = db.prepare('SELECT * FROM schedules WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId) as any[];
    return rows.map(row => this.rowToSchedule(row));
  }

  static findPending(): Schedule[] {
    const stmt = db.prepare('SELECT * FROM schedules WHERE executed = 0');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToSchedule(row));
  }

  static update(id: string, data: Partial<Schedule>): boolean {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.execution_time !== undefined) {
      updates.push('execution_time = ?');
      values.push(data.execution_time);
    }
    if (data.executed !== undefined) {
      updates.push('executed = ?');
      values.push(data.executed ? 1 : 0);
    }
    if (data.original_duration_ms !== undefined) {
      updates.push('original_duration_ms = ?');
      values.push(data.original_duration_ms || null);
    }
    if (data.entry_selection_type !== undefined) {
      updates.push('entry_selection_type = ?');
      values.push(data.entry_selection_type);
    }
    if (data.entry_ids !== undefined) {
      updates.push('entry_ids = ?');
      values.push(data.entry_ids ? JSON.stringify(data.entry_ids) : null);
    }
    if (data.date_range_start !== undefined) {
      updates.push('date_range_start = ?');
      values.push(data.date_range_start || null);
    }
    if (data.date_range_end !== undefined) {
      updates.push('date_range_end = ?');
      values.push(data.date_range_end || null);
    }
    if (data.entry_count !== undefined) {
      updates.push('entry_count = ?');
      values.push(data.entry_count || null);
    }
    if (data.executed_at !== undefined) {
      updates.push('executed_at = ?');
      values.push(data.executed_at);
    }

    updates.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    const stmt = db.prepare(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private static rowToSchedule(row: any): Schedule {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      execution_time: row.execution_time,
      executed: row.executed === 1,
      original_duration_ms: row.original_duration_ms || undefined,
      entry_selection_type: row.entry_selection_type,
      entry_ids: row.entry_ids ? JSON.parse(row.entry_ids) : undefined,
      date_range_start: row.date_range_start || undefined,
      date_range_end: row.date_range_end || undefined,
      entry_count: row.entry_count || undefined,
      passphrase: row.passphrase,
      created_at: row.created_at,
      updated_at: row.updated_at,
      executed_at: row.executed_at || undefined,
    };
  }
}

export class RecipientModel {
  static create(scheduleId: string, type: 'email' | 'sms', value: string): Recipient {
    const id = randomBytes(16).toString('hex');
    const now = Date.now();

    const recipient: Recipient = {
      id,
      schedule_id: scheduleId,
      type,
      value,
      created_at: now,
    };

    const stmt = db.prepare(`
      INSERT INTO recipients (id, schedule_id, type, value, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(recipient.id, recipient.schedule_id, recipient.type, recipient.value, recipient.created_at);

    return recipient;
  }

  static findByScheduleId(scheduleId: string): Recipient[] {
    const stmt = db.prepare('SELECT * FROM recipients WHERE schedule_id = ?');
    return stmt.all(scheduleId) as Recipient[];
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM recipients WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deleteByScheduleId(scheduleId: string): number {
    const stmt = db.prepare('DELETE FROM recipients WHERE schedule_id = ?');
    const result = stmt.run(scheduleId);
    return result.changes;
  }
}

export class ExecutionLogModel {
  static create(scheduleId: string): ExecutionLog {
    const id = randomBytes(16).toString('hex');
    const now = Date.now();

    const log: ExecutionLog = {
      id,
      schedule_id: scheduleId,
      status: 'running',
      started_at: now,
    };

    const stmt = db.prepare(`
      INSERT INTO execution_logs (id, schedule_id, status, started_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(log.id, log.schedule_id, log.status, log.started_at);

    return log;
  }

  static update(id: string, data: Partial<ExecutionLog>): boolean {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.completed_at !== undefined) {
      updates.push('completed_at = ?');
      values.push(data.completed_at);
    }
    if (data.entry_count !== undefined) {
      updates.push('entry_count = ?');
      values.push(data.entry_count);
    }
    if (data.recipients_sent !== undefined) {
      updates.push('recipients_sent = ?');
      values.push(data.recipients_sent);
    }
    if (data.error_message !== undefined) {
      updates.push('error_message = ?');
      values.push(data.error_message);
    }

    values.push(id);

    const stmt = db.prepare(`UPDATE execution_logs SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  static findByScheduleId(scheduleId: string, limit: number = 10): ExecutionLog[] {
    const stmt = db.prepare(`
      SELECT * FROM execution_logs
      WHERE schedule_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `);
    return stmt.all(scheduleId, limit) as ExecutionLog[];
  }
}
