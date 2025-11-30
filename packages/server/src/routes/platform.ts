import { Router, type Router as RouterType } from 'express'
import { db } from '../db/index.js'
import { platformSettings } from '../db/schema.js'

export const platformRouter: RouterType = Router()

// GET /api/platform - Get platform settings (public)
platformRouter.get('/', async (_req, res) => {
  try {
    const settings = await db.query.platformSettings.findFirst()

    // Return default values if no settings exist yet
    if (!settings) {
      res.json({
        displayName: 'Caderno'
      })
      return
    }

    res.json({
      displayName: settings.displayName
    })
  } catch (error) {
    console.error('Failed to get platform settings:', error)
    res.status(500).json({ error: 'Failed to get platform settings' })
  }
})
