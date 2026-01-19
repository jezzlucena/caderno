import { z } from 'zod';
import { SmtpConfigSchema } from './safety-timer.js';

export const AppSettingsSchema = z.object({
  id: z.string(),
  isOnboardingComplete: z.boolean().default(false),
  isRegistrationEnabled: z.boolean().default(true),
  instanceName: z.string().max(100).default('Caderno'),
  smtpConfigured: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const OnboardingStatusSchema = z.object({
  isComplete: z.boolean(),
  currentStep: z.number().min(0).max(5),
  hasUser: z.boolean(),
  hasSmtp: z.boolean(),
});

export const CompleteOnboardingSchema = z.object({
  instanceName: z.string().max(100).optional(),
});

export const UpdateSmtpSettingsSchema = SmtpConfigSchema;

export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;
export type UpdateSmtpSettingsInput = z.infer<typeof UpdateSmtpSettingsSchema>;
