import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL || 'postgres://caderno:caderno@db:5432/caderno'

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
