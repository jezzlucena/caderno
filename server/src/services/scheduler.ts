import cron from 'node-cron';
import { ScheduleModel, RecipientModel, ExecutionLogModel } from '../models/schedule.js';
import { PDFGenerator, JournalEntry } from './pdfGenerator.js';
import { EmailService } from './emailService.js';
import { SMSService } from './smsService.js';
import CryptoJS from 'crypto-js';
import { db } from '../config/database.js';

interface ScheduledTask {
  scheduleId: string;
  cronTask: cron.ScheduledTask;
}

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private pdfGenerator: PDFGenerator;
  private emailService: EmailService;
  private smsService: SMSService;

  constructor() {
    this.pdfGenerator = new PDFGenerator();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  async initialize(): Promise<void> {
    console.log('Initializing scheduler...');
    
    // Load all enabled schedules from database
    const schedules = ScheduleModel.findEnabled();
    
    for (const schedule of schedules) {
      this.addSchedule(schedule.id);
    }

    console.log(`Loaded ${schedules.length} scheduled tasks`);
  }

  addSchedule(scheduleId: string): boolean {
    const schedule = ScheduleModel.findById(scheduleId);
    
    if (!schedule || !schedule.enabled) {
      return false;
    }

    // Remove existing task if any
    this.removeSchedule(scheduleId);

    try {
      const cronTask = cron.schedule(schedule.cron_expression, async () => {
        await this.executeSchedule(scheduleId);
      });

      this.tasks.set(scheduleId, { scheduleId, cronTask });
      
      console.log(`Added schedule: ${schedule.name} (${schedule.cron_expression})`);
      return true;
    } catch (error) {
      console.error(`Failed to add schedule ${scheduleId}:`, error);
      return false;
    }
  }

  removeSchedule(scheduleId: string): boolean {
    const task = this.tasks.get(scheduleId);
    
    if (task) {
      task.cronTask.stop();
      this.tasks.delete(scheduleId);
      console.log(`Removed schedule: ${scheduleId}`);
      return true;
    }
    
    return false;
  }

  async executeSchedule(scheduleId: string): Promise<void> {
    console.log(`Executing schedule: ${scheduleId}`);
    
    const schedule = ScheduleModel.findById(scheduleId);
    
    if (!schedule || !schedule.enabled) {
      console.log(`Schedule ${scheduleId} not found or disabled`);
      return;
    }

    const log = ExecutionLogModel.create(scheduleId);

    try {
      // Get encrypted entries for user
      const stmt = db.prepare('SELECT encrypted_data FROM encrypted_entries WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
      const row = stmt.get(schedule.user_id) as { encrypted_data: string } | undefined;

      if (!row) {
        throw new Error('No entries found for user');
      }

      // For demo purposes, we'll assume entries are stored encrypted
      // In production, you'd need the user's passphrase or use the IPFS sync
      let entries: JournalEntry[];
      
      try {
        // This is a placeholder - in reality, you'd need proper decryption
        const decrypted = CryptoJS.AES.decrypt(row.encrypted_data, 'user-passphrase').toString(CryptoJS.enc.Utf8);
        entries = JSON.parse(decrypted);
      } catch {
        // If decryption fails, try parsing as plain JSON (for development)
        entries = JSON.parse(row.encrypted_data);
      }

      // Filter entries based on selection type
      const selectedEntries = this.filterEntries(entries, schedule);

      if (selectedEntries.length === 0) {
        throw new Error('No entries match the selection criteria');
      }

      // Generate PDF
      const pdfBuffer = await this.pdfGenerator.generatePDF({
        entries: selectedEntries,
      });

      // Get recipients
      const recipients = RecipientModel.findByScheduleId(scheduleId);
      const emailRecipients = recipients.filter(r => r.type === 'email').map(r => r.value);
      const smsRecipients = recipients.filter(r => r.type === 'sms').map(r => r.value);

      let sentCount = 0;

      // Send emails
      if (emailRecipients.length > 0) {
        const fileName = `agenda-export-${new Date().toISOString().split('T')[0]}.pdf`;
        await this.emailService.sendPDFEmail(emailRecipients, pdfBuffer, fileName, selectedEntries.length);
        sentCount += emailRecipients.length;
      }

      // Send SMS notifications
      if (smsRecipients.length > 0 && this.smsService.isConfigured()) {
        await this.smsService.sendPDFNotification(smsRecipients, selectedEntries.length);
        sentCount += smsRecipients.length;
      }

      // Update schedule
      ScheduleModel.update(scheduleId, {
        last_run: Date.now(),
      });

      // Update execution log
      ExecutionLogModel.update(log.id, {
        status: 'success',
        completed_at: Date.now(),
        entry_count: selectedEntries.length,
        recipients_sent: sentCount,
      });

      console.log(`Schedule ${scheduleId} executed successfully. Sent to ${sentCount} recipients.`);
    } catch (error) {
      console.error(`Schedule ${scheduleId} execution failed:`, error);
      
      ExecutionLogModel.update(log.id, {
        status: 'failed',
        completed_at: Date.now(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private filterEntries(entries: JournalEntry[], schedule: any): JournalEntry[] {
    switch (schedule.entry_selection_type) {
      case 'all':
        return entries;
      
      case 'specific':
        if (!schedule.entry_ids) return [];
        return entries.filter(e => schedule.entry_ids.includes(e.id));
      
      case 'date_range':
        return entries.filter(e => {
          const timestamp = e.createdAt;
          const afterStart = !schedule.date_range_start || timestamp >= schedule.date_range_start;
          const beforeEnd = !schedule.date_range_end || timestamp <= schedule.date_range_end;
          return afterStart && beforeEnd;
        });
      
      default:
        return entries;
    }
  }

  shutdown(): void {
    console.log('Shutting down scheduler...');
    
    for (const [scheduleId, task] of this.tasks.entries()) {
      task.cronTask.stop();
      console.log(`Stopped schedule: ${scheduleId}`);
    }
    
    this.tasks.clear();
  }

  getActiveSchedules(): string[] {
    return Array.from(this.tasks.keys());
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
