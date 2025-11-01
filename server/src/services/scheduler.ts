import { ScheduleModel, RecipientModel, ExecutionLogModel } from '../models/schedule.js';
import { PDFGenerator, JournalEntry } from './pdfGenerator.js';
import { EmailService } from './emailService.js';
import { SMSService } from './smsService.js';
import CryptoJS from 'crypto-js';
import { db } from '../config/database.js';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/scheduler-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/scheduler-combined.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

interface ScheduledTask {
  scheduleId: string;
  timeout: NodeJS.Timeout;
  retryCount: number;
  lastError?: string;
}

interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionTime: number | null;
  averageExecutionTime: number;
}

interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private pdfGenerator: PDFGenerator;
  private emailService: EmailService;
  private smsService: SMSService;
  private metrics: Map<string, ExecutionMetrics> = new Map();
  private isShuttingDown: boolean = false;
  private activeExecutions: Set<string> = new Set();
  
  private readonly retryConfig: RetryConfig = {
    maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.SCHEDULER_RETRY_DELAY_MS || '60000'), // 1 minute
    backoffMultiplier: parseFloat(process.env.SCHEDULER_BACKOFF_MULTIPLIER || '2'),
  };

  private readonly executionTimeout: number = parseInt(
    process.env.SCHEDULER_EXECUTION_TIMEOUT_MS || '300000' // 5 minutes
  );

  constructor() {
    this.pdfGenerator = new PDFGenerator();
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    
    logger.info('Scheduler instance created', {
      retryConfig: this.retryConfig,
      executionTimeout: this.executionTimeout,
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing scheduler...');
      
      // Validate configuration
      this.validateConfiguration();
      
      // Load all pending schedules from database
      const schedules = ScheduleModel.findPending();
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const schedule of schedules) {
        try {
          const added = this.addSchedule(schedule.id);
          if (added) {
            successCount++;
            this.initializeMetrics(schedule.id);
          } else {
            failureCount++;
          }
        } catch (error) {
          failureCount++;
          logger.error('Failed to add schedule during initialization', {
            scheduleId: schedule.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info('Scheduler initialization completed', {
        totalSchedules: schedules.length,
        successCount,
        failureCount,
      });
    } catch (error) {
      logger.error('Scheduler initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private validateConfiguration(): void {
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logger.warn('Missing optional environment variables', {
        missingVars,
        note: 'Some features may not work properly',
      });
    }

    if (this.retryConfig.maxRetries < 0 || this.retryConfig.maxRetries > 10) {
      logger.warn('Invalid maxRetries configuration, using default', {
        configured: this.retryConfig.maxRetries,
        default: 3,
      });
      this.retryConfig.maxRetries = 3;
    }
  }

  private initializeMetrics(scheduleId: string): void {
    if (!this.metrics.has(scheduleId)) {
      this.metrics.set(scheduleId, {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        lastExecutionTime: null,
        averageExecutionTime: 0,
      });
    }
  }

  addSchedule(scheduleId: string): boolean {
    try {
      const schedule = ScheduleModel.findById(scheduleId);
      
      if (!schedule) {
        logger.warn('Schedule not found', { scheduleId });
        return false;
      }

      if (schedule.executed) {
        logger.info('Schedule already executed, not adding', { scheduleId, name: schedule.name });
        return false;
      }

      // Check if execution time is in the past
      const now = Date.now();
      const delay = schedule.execution_time - now;

      if (delay < 0) {
        logger.warn('Execution time is in the past, not scheduling', {
          scheduleId,
          executionTime: schedule.execution_time,
          now,
        });
        return false;
      }

      // Remove existing task if any
      this.removeSchedule(scheduleId);

      // Use setTimeout for one-time execution
      // Note: setTimeout has a max delay of ~24.8 days (2^31-1 ms)
      // For longer delays, we'll need to check periodically
      const MAX_TIMEOUT = 2147483647; // Maximum safe timeout value
      const actualDelay = Math.min(delay, MAX_TIMEOUT);

      const timeout = setTimeout(async () => {
        if (this.isShuttingDown) {
          logger.warn('Skipping execution, scheduler is shutting down', { scheduleId });
          return;
        }
        
        if (this.activeExecutions.has(scheduleId)) {
          logger.warn('Skipping execution, previous execution still running', {
            scheduleId,
            name: schedule.name,
          });
          return;
        }

        // If this was a partial delay (> MAX_TIMEOUT), reschedule for the remaining time
        if (delay > MAX_TIMEOUT) {
          logger.info('Rescheduling for remaining time', {
            scheduleId,
            remainingDelay: delay - MAX_TIMEOUT,
          });
          this.removeSchedule(scheduleId);
          this.addSchedule(scheduleId);
          return;
        }

        await this.executeScheduleWithRetry(scheduleId);
      }, actualDelay);

      this.tasks.set(scheduleId, {
        scheduleId,
        timeout,
        retryCount: 0,
      });
      
      this.initializeMetrics(scheduleId);
      
      logger.info('Schedule added successfully', {
        scheduleId,
        name: schedule.name,
        executionTime: schedule.execution_time,
        delay: actualDelay,
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to add schedule', {
        scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  removeSchedule(scheduleId: string): boolean {
    const task = this.tasks.get(scheduleId);
    
    if (task) {
      clearTimeout(task.timeout);
      this.tasks.delete(scheduleId);
      
      logger.info('Schedule removed', { scheduleId });
      return true;
    }
    
    logger.debug('Schedule not found for removal', { scheduleId });
    return false;
  }

  private async executeScheduleWithRetry(scheduleId: string): Promise<void> {
    const maxRetries = this.retryConfig.maxRetries;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        await this.executeSchedule(scheduleId);
        
        // Reset retry count on success
        const task = this.tasks.get(scheduleId);
        if (task) {
          task.retryCount = 0;
          task.lastError = undefined;
        }
        
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount++;
        
        const task = this.tasks.get(scheduleId);
        if (task) {
          task.retryCount = retryCount;
          task.lastError = lastError.message;
        }

        if (retryCount <= maxRetries) {
          const delayMs = this.retryConfig.retryDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount - 1);
          
          logger.warn('Schedule execution failed, retrying', {
            scheduleId,
            retryCount,
            maxRetries,
            delayMs,
            error: lastError.message,
          });

          await this.sleep(delayMs);
        }
      }
    }

    // All retries exhausted
    logger.error('Schedule execution failed after all retries', {
      scheduleId,
      retryCount: maxRetries,
      lastError: lastError?.message,
      stack: lastError?.stack,
    });
  }

  private async executeSchedule(scheduleId: string): Promise<void> {
    const startTime = Date.now();
    this.activeExecutions.add(scheduleId);

    try {
      logger.info('Starting schedule execution', { scheduleId });
      
      const schedule = ScheduleModel.findById(scheduleId);
      
      if (!schedule || schedule.executed) {
        logger.warn('Schedule not found or already executed', { scheduleId });
        return;
      }

      // Create execution log
      const log = ExecutionLogModel.create(scheduleId);

      // Set execution timeout
      const executionPromise = this.performExecution(scheduleId, schedule, log.id);
      const timeoutPromise = this.createTimeout(this.executionTimeout);

      await Promise.race([executionPromise, timeoutPromise]);

      // Update metrics
      const executionTime = Date.now() - startTime;
      this.updateMetrics(scheduleId, true, executionTime);

      logger.info('Schedule execution completed successfully', {
        scheduleId,
        executionTime,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(scheduleId, false, executionTime);

      logger.error('Schedule execution failed', {
        scheduleId,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    } finally {
      this.activeExecutions.delete(scheduleId);
    }
  }

  private async performExecution(scheduleId: string, schedule: any, logId: string): Promise<void> {
    try {
      // Get encrypted entries for user
      const stmt = db.prepare('SELECT encrypted_data FROM encrypted_entries WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
      const row = stmt.get(schedule.user_id) as { encrypted_data: string } | undefined;

      if (!row) {
        throw new Error('No entries found for user');
      }

      // Decrypt entries using the schedule's passphrase
      let entries: JournalEntry[];
      
      try {
        const decrypted = CryptoJS.AES.decrypt(row.encrypted_data, schedule.passphrase).toString(CryptoJS.enc.Utf8);
        entries = JSON.parse(decrypted);
      } catch (decryptError) {
        logger.error('Decryption failed with provided passphrase', {
          scheduleId,
          error: decryptError instanceof Error ? decryptError.message : 'Unknown error',
        });
        throw new Error('Failed to decrypt entries. Invalid passphrase.');
      }

      // Filter entries based on selection type
      const selectedEntries = this.filterEntries(entries, schedule);

      if (selectedEntries.length === 0) {
        throw new Error('No entries match the selection criteria');
      }

      logger.debug('Entries selected for PDF generation', {
        scheduleId,
        totalEntries: entries.length,
        selectedEntries: selectedEntries.length,
      });

      // Generate PDF with timeout protection
      const pdfBuffer = await this.withTimeout(
        this.pdfGenerator.generatePDF({ entries: selectedEntries }),
        120000, // 2 minutes for PDF generation
        'PDF generation timeout'
      );

      // Get recipients
      const recipients = RecipientModel.findByScheduleId(scheduleId);
      const emailRecipients = recipients.filter(r => r.type === 'email').map(r => r.value);
      const smsRecipients = recipients.filter(r => r.type === 'sms').map(r => r.value);

      let sentCount = 0;

      // Send emails with timeout protection
      if (emailRecipients.length > 0) {
        const fileName = `caderno-export-${new Date().toISOString().split('T')[0]}.pdf`;
        
        await this.withTimeout(
          this.emailService.sendPDFEmail(emailRecipients, pdfBuffer, fileName, selectedEntries.length),
          60000, // 1 minute per email batch
          'Email sending timeout'
        );
        
        sentCount += emailRecipients.length;
        
        logger.info('Emails sent successfully', {
          scheduleId,
          recipientCount: emailRecipients.length,
        });
      }

      // Send SMS notifications with timeout protection
      if (smsRecipients.length > 0 && this.smsService.isConfigured()) {
        await this.withTimeout(
          this.smsService.sendPDFNotification(smsRecipients, selectedEntries.length),
          30000, // 30 seconds for SMS
          'SMS sending timeout'
        );
        
        sentCount += smsRecipients.length;
        
        logger.info('SMS notifications sent successfully', {
          scheduleId,
          recipientCount: smsRecipients.length,
        });
      }

      // Mark schedule as executed
      ScheduleModel.update(scheduleId, {
        executed: true,
        executed_at: Date.now(),
      });

      // Update execution log
      ExecutionLogModel.update(logId, {
        status: 'success',
        completed_at: Date.now(),
        entry_count: selectedEntries.length,
        recipients_sent: sentCount,
      });

      // Remove schedule from active tasks
      this.removeSchedule(scheduleId);

      logger.info('Schedule execution successful', {
        scheduleId,
        entryCount: selectedEntries.length,
        recipientsSent: sentCount,
      });
    } catch (error) {
      logger.error('Schedule execution error during performance', {
        scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      ExecutionLogModel.update(logId, {
        status: 'failed',
        completed_at: Date.now(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  private filterEntries(entries: JournalEntry[], schedule: any): JournalEntry[] {
    try {
      switch (schedule.entry_selection_type) {
        case 'all':
          return entries;
        
        case 'specific':
          if (!schedule.entry_ids) {
            logger.warn('Specific entry selection but no entry_ids provided', {
              scheduleId: schedule.id,
            });
            return [];
          }
          return entries.filter(e => schedule.entry_ids.includes(e.id));
        
        case 'date_range':
          return entries.filter(e => {
            const timestamp = e.createdAt;
            const afterStart = !schedule.date_range_start || timestamp >= schedule.date_range_start;
            const beforeEnd = !schedule.date_range_end || timestamp <= schedule.date_range_end;
            return afterStart && beforeEnd;
          });
        
        default:
          logger.warn('Unknown entry selection type, returning all entries', {
            scheduleId: schedule.id,
            selectionType: schedule.entry_selection_type,
          });
          return entries;
      }
    } catch (error) {
      logger.error('Error filtering entries', {
        scheduleId: schedule.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return entries;
    }
  }

  private updateMetrics(scheduleId: string, success: boolean, executionTime: number): void {
    const metrics = this.metrics.get(scheduleId);
    
    if (!metrics) {
      this.initializeMetrics(scheduleId);
      return this.updateMetrics(scheduleId, success, executionTime);
    }

    metrics.totalExecutions++;
    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }
    
    metrics.lastExecutionTime = executionTime;
    
    // Calculate moving average
    const totalWeight = metrics.totalExecutions;
    metrics.averageExecutionTime = 
      (metrics.averageExecutionTime * (totalWeight - 1) + executionTime) / totalWeight;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${errorMessage} (${timeoutMs}ms)`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Execution timeout after ${ms}ms`));
      }, ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down scheduler...');
    this.isShuttingDown = true;

    // Wait for active executions to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.activeExecutions.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      logger.info('Waiting for active executions to complete', {
        activeCount: this.activeExecutions.size,
        activeSchedules: Array.from(this.activeExecutions),
      });
      await this.sleep(1000);
    }

    if (this.activeExecutions.size > 0) {
      logger.warn('Forcing shutdown with active executions', {
        activeCount: this.activeExecutions.size,
        activeSchedules: Array.from(this.activeExecutions),
      });
    }

    // Stop all scheduled tasks
    for (const [scheduleId, task] of this.tasks.entries()) {
      try {
        clearTimeout(task.timeout);
        logger.debug('Stopped schedule', { scheduleId });
      } catch (error) {
        logger.error('Error stopping schedule', {
          scheduleId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    this.tasks.clear();
    
    logger.info('Scheduler shutdown complete', {
      totalSchedules: this.tasks.size,
      shutdownTime: Date.now() - startTime,
    });
  }

  getActiveSchedules(): string[] {
    return Array.from(this.tasks.keys());
  }

  getMetrics(scheduleId?: string): Map<string, ExecutionMetrics> | ExecutionMetrics | null {
    if (scheduleId) {
      return this.metrics.get(scheduleId) || null;
    }
    return this.metrics;
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeSchedules: number;
    activeExecutions: number;
    totalSchedules: number;
    metrics: Record<string, ExecutionMetrics>;
  } {
    const totalSchedules = this.tasks.size;
    const activeExecutions = this.activeExecutions.size;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check if any schedules have high failure rates
    for (const [scheduleId, metrics] of this.metrics.entries()) {
      if (metrics.totalExecutions > 0) {
        const failureRate = metrics.failedExecutions / metrics.totalExecutions;
        if (failureRate > 0.5) {
          status = 'unhealthy';
          break;
        } else if (failureRate > 0.2) {
          status = 'degraded';
        }
      }
    }

    return {
      status,
      activeSchedules: totalSchedules,
      activeExecutions,
      totalSchedules,
      metrics: Object.fromEntries(this.metrics),
    };
  }

  /**
   * Manually trigger execution of a schedule (for testing/admin purposes)
   */
  async triggerScheduleExecution(scheduleId: string): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Scheduler is shutting down, cannot trigger execution');
    }

    if (this.activeExecutions.has(scheduleId)) {
      throw new Error('Schedule execution already in progress');
    }

    logger.info('Manually triggering schedule execution', { scheduleId });
    await this.executeScheduleWithRetry(scheduleId);
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
