import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { verifyToken } from '../utils/jwt.js'
import { createLogger } from '../utils/logger.js'
import { setEmitToUser } from './notification.service.js'

const logger = createLogger('WebSocketService')

let io: SocketIOServer | null = null

// Map of userId to Set of socket IDs (a user can have multiple connections)
const userSockets = new Map<number, Set<string>>()

/**
 * Initialize Socket.io server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication required'))
      }

      const payload = await verifyToken(token)

      if (!payload) {
        return next(new Error('Invalid token'))
      }

      // Attach user info to socket
      socket.data.userId = payload.userId
      socket.data.email = payload.email
      next()
    } catch (error) {
      logger.error('WebSocket authentication error', error)
      next(new Error('Authentication failed'))
    }
  })

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as number

    if (!userId) {
      socket.disconnect()
      return
    }

    // Track this socket for the user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set())
    }
    userSockets.get(userId)!.add(socket.id)

    logger.debug('WebSocket connected', { userId, socketId: socket.id })

    // Join user's personal room for targeted messages
    socket.join(`user:${userId}`)

    // Handle disconnection
    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          userSockets.delete(userId)
        }
      }
      logger.debug('WebSocket disconnected', { userId, socketId: socket.id })
    })

    // Handle manual notification read acknowledgment (optional)
    socket.on('notification:markRead', async (notificationId: number) => {
      // This is handled via REST API, but we could add real-time sync here if needed
      logger.debug('Client acknowledged notification read', { userId, notificationId })
    })
  })

  // Register the emit function with notification service
  setEmitToUser(emitToUser)

  logger.info('WebSocket server initialized')
  return io
}

/**
 * Emit an event to a specific user (all their connected sockets)
 */
export function emitToUser(userId: number, event: string, data: unknown): void {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit to user')
    return
  }

  io.to(`user:${userId}`).emit(event, data)
  logger.debug('Emitted to user', { userId, event })
}

/**
 * Emit an event to all connected users
 */
export function emitToAll(event: string, data: unknown): void {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit to all')
    return
  }

  io.emit(event, data)
}

/**
 * Check if a user is currently connected
 */
export function isUserConnected(userId: number): boolean {
  const sockets = userSockets.get(userId)
  return sockets !== undefined && sockets.size > 0
}

/**
 * Get the Socket.io server instance
 */
export function getIO(): SocketIOServer | null {
  return io
}
