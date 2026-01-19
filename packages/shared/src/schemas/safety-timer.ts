import { z } from 'zod';

export const ReminderSchema = z.object({
  id: z.string(),
  reminderMinutesBefore: z.number().min(1, 'Reminder time must be at least 1 minute'),
});

export const RecipientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  personalMessage: z.string().max(1000).optional(),
  entryFilter: z.enum(['all', 'tagged']).default('all'),
  filterTags: z.array(z.string()).optional(),
});

export const SmtpConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.number().min(1).max(65535),
  secure: z.boolean().default(true),
  user: z.string().min(1, 'SMTP user is required'),
  pass: z.string().min(1, 'SMTP password is required'),
  fromAddress: z.string().email('Invalid from address'),
  fromName: z.string().max(100).optional(),
});

export const SafetyTimerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  isEnabled: z.boolean().default(false),
  timerDurationMinutes: z.number().min(1).default(43200), // Default: 30 days in minutes
  warningPeriodDays: z.number().min(1).max(7).default(3),
  lastResetAt: z.date(),
  nextDeliveryAt: z.date(),
  status: z.enum(['active', 'warning', 'delivered', 'disabled']).default('disabled'),
  recipients: z.array(RecipientSchema).max(10).default([]),
  reminders: z.array(ReminderSchema).max(10).default([]),
  smtpConfigured: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UpdateSafetyTimerSchema = z.object({
  isEnabled: z.boolean().optional(),
  timerDurationMinutes: z.number().min(1).optional(),
  warningPeriodDays: z.number().min(1).max(7).optional(),
});

export const CreateRecipientSchema = RecipientSchema.omit({ id: true });
export const UpdateRecipientSchema = RecipientSchema.omit({ id: true }).partial();

export const CreateReminderSchema = ReminderSchema.omit({ id: true });

export const TestEmailSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
});

export type Reminder = z.infer<typeof ReminderSchema>;
export type Recipient = z.infer<typeof RecipientSchema>;
export type SmtpConfig = z.infer<typeof SmtpConfigSchema>;
export type SafetyTimer = z.infer<typeof SafetyTimerSchema>;
export type UpdateSafetyTimerInput = z.infer<typeof UpdateSafetyTimerSchema>;
export type CreateRecipientInput = z.infer<typeof CreateRecipientSchema>;
export type UpdateRecipientInput = z.infer<typeof UpdateRecipientSchema>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export type TestEmailInput = z.infer<typeof TestEmailSchema>;
