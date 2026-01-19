// User schemas and types
export {
  UserSchema,
  UserPreferencesSchema,
  RegisterUserSchema,
  LoginUserSchema,
  UpdatePreferencesSchema,
  type User,
  type UserPreferences,
  type RegisterUserInput,
  type LoginUserInput,
  type UpdatePreferencesInput,
} from './schemas/user.js';

// Passkey schemas and types
export {
  PasskeySchema,
  CreatePasskeySchema,
  type Passkey,
  type CreatePasskeyInput,
} from './schemas/passkey.js';

// Session schemas and types
export {
  SessionSchema,
  RefreshTokenSchema,
  type Session,
  type RefreshTokenInput,
} from './schemas/session.js';

// Entry schemas and types
export {
  EntrySchema,
  LexicalContentSchema,
  LexicalNodeSchema,
  CreateEntrySchema,
  UpdateEntrySchema,
  EntryFilterSchema,
  PaginationSchema,
  type Entry,
  type LexicalContent,
  type CreateEntryInput,
  type UpdateEntryInput,
  type EntryFilter,
  type Pagination,
} from './schemas/entry.js';

// Safety Timer schemas and types
export {
  SafetyTimerSchema,
  RecipientSchema,
  ReminderSchema,
  SmtpConfigSchema,
  UpdateSafetyTimerSchema,
  CreateRecipientSchema,
  UpdateRecipientSchema,
  CreateReminderSchema,
  TestEmailSchema,
  type SafetyTimer,
  type Recipient,
  type Reminder,
  type SmtpConfig,
  type UpdateSafetyTimerInput,
  type CreateRecipientInput,
  type UpdateRecipientInput,
  type CreateReminderInput,
  type TestEmailInput,
} from './schemas/safety-timer.js';

// Settings schemas and types
export {
  AppSettingsSchema,
  OnboardingStatusSchema,
  CompleteOnboardingSchema,
  UpdateSmtpSettingsSchema,
  type AppSettings,
  type OnboardingStatus,
  type CompleteOnboardingInput,
  type UpdateSmtpSettingsInput,
} from './schemas/settings.js';

// Auth schemas and types
export {
  MagicLinkRequestSchema,
  MagicLinkVerifySchema,
  AuthResponseSchema,
  AuthMethodsSchema,
  type MagicLinkRequestInput,
  type MagicLinkVerifyInput,
  type AuthResponse,
  type AuthMethods,
} from './schemas/auth.js';

// Export schemas and types
export {
  ExportFormatSchema,
  ExportOptionsSchema,
  ImportDataSchema,
  ImportResultSchema,
  type ExportFormat,
  type ExportOptions,
  type ImportData,
  type ImportResult,
} from './schemas/export.js';

// API schemas and types
export {
  ApiErrorSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
  type ApiError,
  type SuccessResponse,
  type PaginatedResponse,
} from './schemas/api.js';
