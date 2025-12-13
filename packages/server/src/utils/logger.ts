type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

// In production, only show warn and error. In development, show all.
const currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatMessage(namespace: string, message: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${namespace}] ${message}`
}

export interface Logger {
  debug: (message: string, data?: unknown) => void
  info: (message: string, data?: unknown) => void
  warn: (message: string, data?: unknown) => void
  error: (message: string, data?: unknown) => void
}

/**
 * Create a namespaced logger instance
 *
 * Usage:
 * const logger = createLogger('Auth')
 * logger.debug('Login attempt', { email })
 * logger.error('Failed to create user', error)
 */
export function createLogger(namespace: string): Logger {
  return {
    debug: (message: string, data?: unknown) => {
      if (shouldLog('debug')) {
        if (data !== undefined) {
          console.log(formatMessage(namespace, message), data)
        } else {
          console.log(formatMessage(namespace, message))
        }
      }
    },
    info: (message: string, data?: unknown) => {
      if (shouldLog('info')) {
        if (data !== undefined) {
          console.info(formatMessage(namespace, message), data)
        } else {
          console.info(formatMessage(namespace, message))
        }
      }
    },
    warn: (message: string, data?: unknown) => {
      if (shouldLog('warn')) {
        if (data !== undefined) {
          console.warn(formatMessage(namespace, message), data)
        } else {
          console.warn(formatMessage(namespace, message))
        }
      }
    },
    error: (message: string, data?: unknown) => {
      if (shouldLog('error')) {
        if (data !== undefined) {
          console.error(formatMessage(namespace, message), data)
        } else {
          console.error(formatMessage(namespace, message))
        }
      }
    }
  }
}
