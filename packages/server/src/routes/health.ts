import { Router, type Router as RouterType } from 'express'
import { db } from '../db/index.js'
import { sql } from 'drizzle-orm'

export const healthRouter: RouterType = Router()

healthRouter.get('/', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`)
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    })
  }
})
