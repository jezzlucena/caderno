import { db } from '../config/database.js';
import { randomBytes } from 'crypto';

export interface Schedule {
  id: string;
  user_id: string;
  name: string;
  cron_expression: string;
  enabled: boolean;
  entry_selection_type: 'all' | 'specific' | 'date_range';
  entry_ids?: string[];
  date_range_start?: number;
  date_range_end?: number;
  created_at: number;
  updated_at: number;
  last_run?: number;
  next_run?: number;
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

    const schedule: Schedule = {
      id,
      user_id: userId,
      name: data.name || 'Untitled Schedule',
      cron_expression: data.cron_expression || '0 9 * * 1',
      enabled: data.enabled !== undefined ? data.enabled : true,
      entry_selection_type: data.entry_selection_type || 'all',
      entry_ids: data.entry_ids,
      date_range_start: data.date_range_start,
      date_range_end: data.date_range_end,
      created_at: now,
      updated_at: now,
      last_run: data.last_run,
      next_run: data.next_run,
    };

    const stmt = db.prepare(`
      INSERT INTO schedules (
        id, user_id, name, cron_expression, enabled, entry_selection_type,
        entry_ids, date_range_start, date_range_end, created_at, updated_at,
        last_run, next_run
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      schedule.id,
      schedule.user_id,
      schedule.name,
      schedule.cron_expression,
      schedule.enabled ? 1 : 0,
      schedule.entry_selection_type,
      schedule.entry_ids ? JSON.stringify(schedule.entry_ids) : null,
      schedule.date_range_start || null,
      schedule.date_range_end || null,
      schedule.created_at,
      schedule.updated_at,
      schedule.last_run || null,
      schedule.next_run || null
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

  static findEnabled(): Schedule[] {
    const stmt = db.prepare('SELECT * FROM schedules WHERE enabled = 1');
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
    if (data.cron_expression !== undefined) {
      updates.push('cron_expression = ?');
      values.push(data.cron_expression);
    }
    if (data.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(data.enabled ? 1 : 0);
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
    if (data.last_run !== undefined) {
      updates.push('last_run = ?');
      values.push(data.last_run);
    }
    if (data.next_run !== undefined) {
      updates.push('next_run = ?');
      values.push(data.next_run);
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
      cron_expression: row.cron_expression,
      enabled: row.enabled === 1,
      entry_selection_type: row.entry_selection_type,
      entry_ids: row.entry_ids ? JSON.parse(row.entry_ids) : undefined,
      date_range_start: row.date_range_start || undefined,
      date_range_end: row.date_range_end || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_run: row.last_run || undefined,
      next_run: row.next_run || undefined,
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
