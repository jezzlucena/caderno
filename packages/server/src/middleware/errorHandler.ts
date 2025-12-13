import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { z } from 'zod'

/**
 * Custom error class for application-level errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Create a 400 Bad Request error
 */
export function badRequest(message: string): AppError {
  return new AppError(message, 400, 'BAD_REQUEST')
}

/**
 * Create a 401 Unauthorized error
 */
export function unauthorized(message: string = 'Unauthorized'): AppError {
  return new AppError(message, 401, 'UNAUTHORIZED')
}

/**
 * Create a 403 Forbidden error
 */
export function forbidden(message: string = 'Forbidden'): AppError {
  return new AppError(message, 403, 'FORBIDDEN')
}

/**
 * Create a 404 Not Found error
 */
export function notFound(entityName: string = 'Resource'): AppError {
  return new AppError(`${entityName} not found`, 404, 'NOT_FOUND')
}

/**
 * Create a 409 Conflict error
 */
export function conflict(message: string): AppError {
  return new AppError(message, 409, 'CONFLICT')
}

/**
 * Global error handler middleware
 * Should be registered after all routes
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: error.issues[0].message })
    return
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  // Log unexpected errors in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', error)
  }

  // Generic server error for unexpected errors
  res.status(500).json({ error: 'Internal server error' })
}

/**
 * Async handler wrapper to catch errors and forward to error middleware
 * Eliminates need for try/catch in route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
