import { z } from 'zod';

export const PasskeySchema = z.object({
  id: z.string(),
  userId: z.string(),
  credentialId: z.string(),
  publicKey: z.string(),
  counter: z.number(),
  deviceType: z.enum(['singleDevice', 'multiDevice']),
  backedUp: z.boolean(),
  transports: z.array(z.string()).optional(),
  name: z.string().default('My Passkey'),
  createdAt: z.date(),
  lastUsedAt: z.date().optional(),
});

export const CreatePasskeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type Passkey = z.infer<typeof PasskeySchema>;
export type CreatePasskeyInput = z.infer<typeof CreatePasskeySchema>;
