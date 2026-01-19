import { z } from 'zod';

export const MagicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const MagicLinkVerifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']),
      language: z.enum(['en', 'es', 'pt-BR']),
      editorFontSize: z.number(),
    }),
    authMethods: z.array(z.enum(['password', 'passkey', 'magic-link'])),
  }),
});

export const AuthMethodsSchema = z.object({
  password: z.boolean(),
  passkey: z.boolean(),
  magicLink: z.boolean(),
});

export type MagicLinkRequestInput = z.infer<typeof MagicLinkRequestSchema>;
export type MagicLinkVerifyInput = z.infer<typeof MagicLinkVerifySchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type AuthMethods = z.infer<typeof AuthMethodsSchema>;
