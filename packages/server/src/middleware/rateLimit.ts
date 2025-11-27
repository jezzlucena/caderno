import rateLimit from 'express-rate-limit'

/**
 * Rate limiting middleware for protecting against brute force attacks
 */

// General API rate limit - 100 requests per minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Auth rate limit - 5 requests per minute for login/register
// More restrictive to prevent brute force attacks
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
})

// Strict auth rate limit - 3 requests per 15 minutes
// Used for password-sensitive operations
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { error: 'Too many attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})

// Email sending rate limit - 3 emails per hour
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many email requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Federation/ActivityPub rate limit - more lenient for server-to-server
export const federationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many federation requests' },
  standardHeaders: true,
  legacyHeaders: false
})
