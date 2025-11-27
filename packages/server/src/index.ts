import express from 'express'
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
import { startScheduler } from './services/scheduler.service.js'
import { generalLimiter, federationLimiter } from './middleware/rateLimit.js'

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
    : ['http://localhost:8085', 'http://client:8085'],
  credentials: true
}))

// Body parsing
app.use(express.json({ limit: '10mb' })) // Limit body size

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

// ActivityPub Federation routes (mounted at root for proper URLs)
if (env.VITE_FEDERATION_ENABLED === 'true') {
  console.log(`[Federation] ActivityPub enabled for domain: ${env.FEDERATION_DOMAIN}`)
  app.use(activityPubRouter)
}

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)

  // Start the Dead Man's Switch scheduler
  startScheduler()
})
