import { z } from 'zod'

const envSchema = z.object({
  // Server
  PORT: z.string().default('5055'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().default('postgres://caderno:caderno@db:5432/caderno'),

  // JWT
  JWT_SECRET: z.string().min(32).default('development-secret-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Email (Mailgun)
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_FROM: z.string().default('Caderno <noreply@caderno.app>'),
  SUPPORT_EMAIL: z.string().email().default('jezzlucena@gmail.com'),

  // App
  VITE_APP_URL: z.string().default('http://localhost:8085'),

  // Federation (ActivityPub)
  VITE_FEDERATION_ENABLED: z.string().default('true'),
  FEDERATION_DOMAIN: z.string().default('localhost:5055'),  // Domain for ActivityPub handles
  SERVER_URL: z.string().default('http://localhost:5055')   // Public URL of this server
})

export const env = envSchema.parse(process.env)
