import express from 'express'
import { createServer } from 'http'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './config/env.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { entriesRouter } from './routes/entries.js'
import { switchesRouter } from './routes/switches.js'
import { activityPubRouter } from './routes/activitypub.js'
import { federationRouter } from './routes/federation.js'
import { profileRouter } from './routes/profile.js'
import { supportRouter } from './routes/support.js'
import { adminRouter } from './routes/admin.js'
import { platformRouter } from './routes/platform.js'
import { setupRouter } from './routes/setup.js'
import { notificationsRouter } from './routes/notifications.js'
import { passkeyRouter } from './routes/passkey.js'
import { startScheduler } from './services/scheduler.service.js'
import { initializeWebSocket } from './services/websocket.service.js'
import { generalLimiter } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'
import { createLogger } from './utils/logger.js'

const logger = createLogger('Server')

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for ActivityPub
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow cross-origin for federation
}))

app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.VITE_APP_URL
    : ['http://localhost:8085', 'http://client:8085', 'https://caderno.jezzlucena.com', 'https://caderno.jezzlucena.xyz'],
  credentials: true
}))

// Body parsing - include ActivityPub content types
app.use(express.json({
  limit: '10mb',
  type: ['application/json', 'application/activity+json', 'application/ld+json']
}))

// Apply general rate limiting to all routes
app.use('/api', generalLimiter)

// Routes
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/entries', entriesRouter)
app.use('/api/switches', switchesRouter)
app.use('/api/federation', federationRouter)
app.use('/api/profile', profileRouter)
app.use('/api/support', supportRouter)
app.use('/api/admin', adminRouter)
app.use('/api/platform', platformRouter)
app.use('/api/setup', setupRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/passkey', passkeyRouter)

// ActivityPub Federation routes (mounted at root for proper URLs)
if (env.VITE_FEDERATION_ENABLED === 'true') {
  logger.info(`ActivityPub enabled for domain: ${env.FEDERATION_DOMAIN}`)
  app.use(activityPubRouter)
}

// Error handler - must be registered after all routes
app.use(errorHandler)

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app)
initializeWebSocket(httpServer)

// Start server
httpServer.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`)

  // Start the Dead Man's Switch scheduler
  startScheduler()
})
