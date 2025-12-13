import { badRequest, notFound as notFoundError } from '../middleware/errorHandler.js'

/**
 * Parse and validate a numeric ID from request params
 * Throws AppError if invalid
 */
export function parseId(value: string, entityName: string = 'entry'): number {
  const id = parseInt(value, 10)
  if (isNaN(id) || id <= 0) {
    throw badRequest(`Invalid ${entityName} ID`)
  }
  return id
}

/**
 * Verify that a resource exists and belongs to the specified user
 * Throws 404 if resource is null or userId doesn't match
 */
export function verifyOwnership<T extends { userId: number }>(
  resource: T | null | undefined,
  userId: number,
  entityName: string = 'Resource'
): asserts resource is T {
  if (!resource || resource.userId !== userId) {
    throw notFoundError(entityName)
  }
}

/**
 * Verify that a resource exists
 * Throws 404 if resource is null
 */
export function verifyExists<T>(
  resource: T | null | undefined,
  entityName: string = 'Resource'
): asserts resource is T {
  if (!resource) {
    throw notFoundError(entityName)
  }
}

/**
 * Validate pagination parameters
 */
export function parsePagination(
  limitParam: string | undefined,
  offsetParam: string | undefined,
  defaults: { limit: number; maxLimit: number } = { limit: 20, maxLimit: 100 }
): { limit: number; offset: number } {
  let limit = defaults.limit
  let offset = 0

  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, defaults.maxLimit)
    }
  }

  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed
    }
  }

  return { limit, offset }
}
