import { z } from 'zod'

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().default('postgres://caderno:caderno@db:5432/caderno'),

  // JWT
  JWT_SECRET: z.string().min(32).default('development-secret-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Email
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@caderno.app'),

  // App
  VITE_APP_URL: z.string().default('http://localhost:5173'),

  // Federation (ActivityPub)
  VITE_FEDERATION_ENABLED: z.string().default('true'),
  FEDERATION_DOMAIN: z.string().default('localhost:3000'),  // Domain for ActivityPub handles
  SERVER_URL: z.string().default('http://localhost:3000')   // Public URL of this server
})

export const env = envSchema.parse(process.env)
