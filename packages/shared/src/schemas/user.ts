import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['en', 'es', 'pt-BR']).default('en'),
  editorFontSize: z.number().min(12).max(24).default(16),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string().optional(),
  preferences: UserPreferencesSchema.default({}),
  authMethods: z.array(z.enum(['password', 'passkey', 'magic-link'])).default(['password']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const LoginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdatePreferencesSchema = UserPreferencesSchema.partial();

export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
