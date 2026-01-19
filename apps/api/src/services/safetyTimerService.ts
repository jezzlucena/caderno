import Agenda, { Job } from 'agenda';
import { SafetyTimer, ISafetyTimer, IRecipient, IReminder } from '../models/SafetyTimer.js';
import { User } from '../models/User.js';
import { encrypt, decrypt } from '../config/encryption.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { getEntriesForSafetyTimer } from './entryService.js';
import { generateJournalPdf } from './pdfService.js';
import { sendWarningEmail, sendDeliveryEmail } from './emailService.js';
import type { UpdateSafetyTimerInput, CreateRecipientInput, CreateReminderInput } from '@caderno/shared';

let agenda: Agenda | null = null;

export async function initializeAgenda(): Promise<void> {
  agenda = new Agenda({
    db: { address: env.MONGODB_URI, collection: 'agendaJobs' },
    processEvery: '1 minute',
  });

  // Define jobs
  agenda.define('safety-timer-check', async (job: Job) => {
    const { userId } = job.attrs.data as { userId: string };
    await processTimerCheck(userId);
  });

  agenda.define('safety-timer-warning', async (job: Job) => {
    const { userId, daysRemaining } = job.attrs.data as { userId: string; daysRemaining: number };
    await processWarningEmail(userId, daysRemaining);
  });

  agenda.define('safety-timer-delivery', async (job: Job) => {
    const { userId } = job.attrs.data as { userId: string };
    await processDelivery(userId);
  });

  agenda.define('safety-timer-reminder', async (job: Job) => {
    const { userId, minutesBefore } = job.attrs.data as { userId: string; minutesBefore: number };
    await processReminderEmail(userId, minutesBefore);
  });

  await agenda.start();
  console.log('Agenda scheduler started');
}

export async function shutdownAgenda(): Promise<void> {
  if (agenda) {
    await agenda.stop();
    console.log('Agenda scheduler stopped');
  }
}

async function processTimerCheck(userId: string): Promise<void> {
  const timer = await SafetyTimer.findOne({ userId, isEnabled: true });
  if (!timer) return;

  const now = new Date();
  const warningStart = new Date(timer.nextDeliveryAt.getTime() - timer.warningPeriodDays * 24 * 60 * 60 * 1000);

  if (now >= warningStart && timer.status === 'active') {
    timer.status = 'warning';
    await timer.save();

    // Schedule warning emails
    await scheduleWarningEmails(timer);
  }
}

async function processWarningEmail(userId: string, daysRemaining: number): Promise<void> {
  const timer = await SafetyTimer.findOne({ userId, isEnabled: true, status: 'warning' });
  if (!timer) return;

  const user = await User.findById(userId);
  if (!user) return;

  await sendWarningEmail(user.email, daysRemaining, user.email);
}

async function processReminderEmail(userId: string, minutesBefore: number): Promise<void> {
  const timer = await SafetyTimer.findOne({ userId, isEnabled: true });
  if (!timer || timer.status === 'delivered') return;

  const user = await User.findById(userId);
  if (!user) return;

  // Format the time remaining for the email
  const timeRemaining = formatTimeRemaining(minutesBefore);
  await sendWarningEmail(user.email, 0, user.email, timeRemaining);
}

function formatTimeRemaining(minutes: number): string {
  if (minutes >= 10080 && minutes % 10080 === 0) {
    const weeks = minutes / 10080;
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

async function processDelivery(userId: string): Promise<void> {
  const timer = await SafetyTimer.findOne({ userId, isEnabled: true });
  if (!timer || timer.status === 'delivered') return;

  const user = await User.findById(userId);
  if (!user) return;

  // Process each recipient
  for (const recipient of timer.recipients) {
    try {
      const email = decrypt(recipient.encryptedEmail);
      const entries = await getEntriesForSafetyTimer(
        userId,
        recipient.entryFilter,
        recipient.filterTags
      );

      if (entries.length === 0) continue;

      const pdfBuffer = await generateJournalPdf(entries, {
        title: `Journal Entries from ${user.email}`,
        includeMetadata: true,
      });

      await sendDeliveryEmail(
        email,
        recipient.name,
        recipient.personalMessage,
        user.email,
        pdfBuffer
      );
    } catch (error) {
      console.error(`Failed to deliver to recipient ${recipient.name}:`, error);
    }
  }

  timer.status = 'delivered';
  await timer.save();

  // Cancel any remaining scheduled jobs
  if (agenda) {
    await agenda.cancel({ 'data.userId': userId });
  }
}

async function scheduleWarningEmails(timer: ISafetyTimer): Promise<void> {
  if (!agenda) return;

  const userId = timer.userId.toString();

  // Schedule daily warning emails
  for (let day = timer.warningPeriodDays; day >= 1; day--) {
    const warningDate = new Date(timer.nextDeliveryAt.getTime() - day * 24 * 60 * 60 * 1000);

    if (warningDate > new Date()) {
      await agenda.schedule(warningDate, 'safety-timer-warning', { userId, daysRemaining: day });
    }
  }
}

export async function getOrCreateSafetyTimer(userId: string): Promise<ISafetyTimer> {
  let timer = await SafetyTimer.findOne({ userId });

  if (!timer) {
    const defaultDurationMinutes = 43200; // 30 days in minutes
    timer = await SafetyTimer.create({
      userId,
      isEnabled: false,
      timerDurationMinutes: defaultDurationMinutes,
      warningPeriodDays: 3,
      lastResetAt: new Date(),
      nextDeliveryAt: new Date(Date.now() + defaultDurationMinutes * 60 * 1000),
      status: 'disabled',
      recipients: [],
    });
  }

  return timer;
}

export interface SafetyTimerResponse {
  isEnabled: boolean;
  timerDurationMinutes: number;
  warningPeriodDays: number;
  lastResetAt: Date;
  nextDeliveryAt: Date;
  status: string;
  recipients: {
    id: string;
    name: string;
    email: string;
    personalMessage?: string;
    entryFilter: string;
    filterTags?: string[];
  }[];
  reminders: {
    id: string;
    reminderMinutesBefore: number;
  }[];
  smtpConfigured: boolean;
}

export async function getSafetyTimerStatus(userId: string): Promise<SafetyTimerResponse> {
  const timer = await getOrCreateSafetyTimer(userId);

  return {
    isEnabled: timer.isEnabled,
    timerDurationMinutes: timer.timerDurationMinutes,
    warningPeriodDays: timer.warningPeriodDays,
    lastResetAt: timer.lastResetAt,
    nextDeliveryAt: timer.nextDeliveryAt,
    status: timer.status,
    recipients: timer.recipients.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      email: decrypt(r.encryptedEmail),
      personalMessage: r.personalMessage,
      entryFilter: r.entryFilter,
      filterTags: r.filterTags,
    })),
    reminders: (timer.reminders || []).map((r) => ({
      id: r._id.toString(),
      reminderMinutesBefore: r.reminderMinutesBefore,
    })),
    smtpConfigured: !!timer.smtpConfig,
  };
}

export async function updateSafetyTimer(
  userId: string,
  input: UpdateSafetyTimerInput
): Promise<SafetyTimerResponse> {
  const timer = await getOrCreateSafetyTimer(userId);

  if (input.timerDurationMinutes !== undefined) {
    timer.timerDurationMinutes = input.timerDurationMinutes;
  }

  if (input.warningPeriodDays !== undefined) {
    timer.warningPeriodDays = input.warningPeriodDays;
  }

  if (input.isEnabled !== undefined) {
    if (input.isEnabled && timer.recipients.length === 0) {
      throw new AppError(400, 'NO_RECIPIENTS', 'Add at least one recipient before enabling the timer');
    }

    timer.isEnabled = input.isEnabled;

    if (input.isEnabled) {
      timer.status = 'active';
      timer.lastResetAt = new Date();
      timer.nextDeliveryAt = new Date(Date.now() + timer.timerDurationMinutes * 60 * 1000);

      // Schedule jobs
      await scheduleTimerJobs(timer);
    } else {
      timer.status = 'disabled';

      // Cancel all jobs
      if (agenda) {
        await agenda.cancel({ 'data.userId': userId });
      }
    }
  }

  await timer.save();

  return getSafetyTimerStatus(userId);
}

export async function checkIn(userId: string): Promise<SafetyTimerResponse> {
  const timer = await SafetyTimer.findOne({ userId, isEnabled: true });

  if (!timer) {
    throw new AppError(400, 'TIMER_NOT_ENABLED', 'Safety timer is not enabled');
  }

  timer.lastResetAt = new Date();
  timer.nextDeliveryAt = new Date(Date.now() + timer.timerDurationMinutes * 60 * 1000);
  timer.status = 'active';

  await timer.save();

  // Cancel existing jobs and reschedule
  if (agenda) {
    await agenda.cancel({ 'data.userId': userId });
    await scheduleTimerJobs(timer);
  }

  return getSafetyTimerStatus(userId);
}

async function scheduleTimerJobs(timer: ISafetyTimer): Promise<void> {
  if (!agenda) return;

  const userId = timer.userId.toString();

  // Schedule delivery
  await agenda.schedule(timer.nextDeliveryAt, 'safety-timer-delivery', { userId });

  // Schedule daily check (to transition to warning status)
  await agenda.every('1 day', 'safety-timer-check', { userId });

  // Schedule reminder emails
  if (timer.reminders && timer.reminders.length > 0) {
    for (const reminder of timer.reminders) {
      const reminderTime = new Date(timer.nextDeliveryAt.getTime() - reminder.reminderMinutesBefore * 60 * 1000);
      if (reminderTime > new Date()) {
        await agenda.schedule(reminderTime, 'safety-timer-reminder', {
          userId,
          minutesBefore: reminder.reminderMinutesBefore
        });
      }
    }
  }
}

export async function addRecipient(
  userId: string,
  input: CreateRecipientInput
): Promise<SafetyTimerResponse> {
  const timer = await getOrCreateSafetyTimer(userId);

  if (timer.recipients.length >= 10) {
    throw new AppError(400, 'MAX_RECIPIENTS', 'Maximum 10 recipients allowed');
  }

  timer.recipients.push({
    name: input.name,
    encryptedEmail: encrypt(input.email),
    personalMessage: input.personalMessage,
    entryFilter: input.entryFilter,
    filterTags: input.filterTags,
  } as IRecipient);

  await timer.save();

  return getSafetyTimerStatus(userId);
}

export async function updateRecipient(
  userId: string,
  recipientId: string,
  input: Partial<CreateRecipientInput>
): Promise<SafetyTimerResponse> {
  const timer = await SafetyTimer.findOne({ userId });

  if (!timer) {
    throw new AppError(404, 'TIMER_NOT_FOUND', 'Safety timer not found');
  }

  const recipient = timer.recipients.find((r) => r._id.toString() === recipientId);

  if (!recipient) {
    throw new AppError(404, 'RECIPIENT_NOT_FOUND', 'Recipient not found');
  }

  if (input.name !== undefined) recipient.name = input.name;
  if (input.email !== undefined) recipient.encryptedEmail = encrypt(input.email);
  if (input.personalMessage !== undefined) recipient.personalMessage = input.personalMessage;
  if (input.entryFilter !== undefined) recipient.entryFilter = input.entryFilter;
  if (input.filterTags !== undefined) recipient.filterTags = input.filterTags;

  await timer.save();

  return getSafetyTimerStatus(userId);
}

export async function deleteRecipient(
  userId: string,
  recipientId: string
): Promise<SafetyTimerResponse> {
  const timer = await SafetyTimer.findOne({ userId });

  if (!timer) {
    throw new AppError(404, 'TIMER_NOT_FOUND', 'Safety timer not found');
  }

  const index = timer.recipients.findIndex((r) => r._id.toString() === recipientId);

  if (index === -1) {
    throw new AppError(404, 'RECIPIENT_NOT_FOUND', 'Recipient not found');
  }

  timer.recipients.splice(index, 1);

  // Disable timer if no recipients left
  if (timer.recipients.length === 0 && timer.isEnabled) {
    timer.isEnabled = false;
    timer.status = 'disabled';

    if (agenda) {
      await agenda.cancel({ 'data.userId': userId });
    }
  }

  await timer.save();

  return getSafetyTimerStatus(userId);
}

export async function addReminder(
  userId: string,
  input: CreateReminderInput
): Promise<SafetyTimerResponse> {
  const timer = await getOrCreateSafetyTimer(userId);

  if ((timer.reminders || []).length >= 10) {
    throw new AppError(400, 'MAX_REMINDERS', 'Maximum 10 reminders allowed');
  }

  // Validate that reminder time doesn't exceed timer duration
  if (input.reminderMinutesBefore >= timer.timerDurationMinutes) {
    throw new AppError(
      400,
      'INVALID_REMINDER_TIME',
      'Reminder time cannot be greater than or equal to the timer duration'
    );
  }

  // Check for duplicate reminder times
  const existingReminder = (timer.reminders || []).find(
    (r) => r.reminderMinutesBefore === input.reminderMinutesBefore
  );
  if (existingReminder) {
    throw new AppError(400, 'DUPLICATE_REMINDER', 'A reminder with this time already exists');
  }

  if (!timer.reminders) {
    timer.reminders = [];
  }

  timer.reminders.push({
    reminderMinutesBefore: input.reminderMinutesBefore,
  } as IReminder);

  await timer.save();

  // Reschedule jobs if timer is enabled
  if (timer.isEnabled && agenda) {
    await agenda.cancel({ 'data.userId': userId });
    await scheduleTimerJobs(timer);
  }

  return getSafetyTimerStatus(userId);
}

export async function deleteReminder(
  userId: string,
  reminderId: string
): Promise<SafetyTimerResponse> {
  const timer = await SafetyTimer.findOne({ userId });

  if (!timer) {
    throw new AppError(404, 'TIMER_NOT_FOUND', 'Safety timer not found');
  }

  const index = (timer.reminders || []).findIndex((r) => r._id.toString() === reminderId);

  if (index === -1) {
    throw new AppError(404, 'REMINDER_NOT_FOUND', 'Reminder not found');
  }

  timer.reminders.splice(index, 1);
  await timer.save();

  // Reschedule jobs if timer is enabled
  if (timer.isEnabled && agenda) {
    await agenda.cancel({ 'data.userId': userId });
    await scheduleTimerJobs(timer);
  }

  return getSafetyTimerStatus(userId);
}
