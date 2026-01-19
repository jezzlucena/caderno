import { z } from 'zod';

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  refreshTokenHash: z.string(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  expiresAt: z.date(),
  createdAt: z.date(),
  rotatedAt: z.date().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type Session = z.infer<typeof SessionSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
