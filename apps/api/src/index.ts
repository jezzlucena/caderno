import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { generalRateLimiter, errorHandler, notFoundHandler } from './middleware/index.js';
import { initializeAgenda, shutdownAgenda } from './services/safetyTimerService.js';
import routes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.ORIGIN,
  credentials: true,
}));
app.use(generalRateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  await shutdownAgenda();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    await connectDatabase();
    await initializeAgenda();

    app.listen(env.API_PORT, () => {
      console.log(`API server running on port ${env.API_PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
