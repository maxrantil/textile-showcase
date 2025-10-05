/**
 * ABOUTME: Rate limiting utility for API endpoints protection
 * Implements in-memory rate limiting with configurable windows and limits
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  keyGenerator?: (req: NextRequest) => string // Custom key generator
}

/**
 * Request tracking entry
 */
interface RequestEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limiting
 * In production, consider using Redis or similar
 */
class RateLimitStore {
  private store: Map<string, RequestEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup old entries every minute
    this.startCleanup()
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key)
        }
      }
    }, 60000) // Run every minute
  }

  increment(key: string, windowMs: number): RequestEntry {
    const now = Date.now()
    const existing = this.store.get(key)

    if (!existing || existing.resetTime < now) {
      // Create new entry
      const entry: RequestEntry = {
        count: 1,
        resetTime: now + windowMs,
      }
      this.store.set(key, entry)
      return entry
    }

    // Increment existing entry
    existing.count++
    return existing
  }

  get(key: string): RequestEntry | undefined {
    const entry = this.store.get(key)
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  reset(key: string): void {
    this.store.delete(key)
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Global store instance
const globalStore = new RateLimitStore()

/**
 * Default key generator - uses IP address or x-forwarded-for header
 */
function defaultKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const pathname = req.nextUrl.pathname
  return `${ip}:${pathname}`
}

/**
 * Create rate limiter with specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = config

  return async function rateLimit(
    req: NextRequest,
    handler?: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(req)
    const entry = globalStore.increment(key, windowMs)

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000)

      return NextResponse.json(
        {
          error: message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          },
        }
      )
    }

    // Process request
    let response: NextResponse
    if (handler) {
      response = await handler()
    } else {
      response = NextResponse.next()
    }

    // Skip counting successful requests if configured
    if (skipSuccessfulRequests && response.status < 400) {
      entry.count--
    }

    // Add rate limit headers to response
    const remaining = Math.max(0, maxRequests - entry.count)
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set(
      'X-RateLimit-Reset',
      new Date(entry.resetTime).toISOString()
    )

    return response
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Standard API rate limit
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'API rate limit exceeded.',
  }),

  // Relaxed rate limit for read operations
  read: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
    skipSuccessfulRequests: true,
  }),

  // Strict rate limit for write operations
  write: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    message: 'Write rate limit exceeded.',
  }),

  // Contact form rate limit
  contact: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 submissions per hour
    message: 'Too many contact form submissions. Please try again later.',
  }),
}

/**
 * Helper to get client IP address
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}

/**
 * Cleanup function for tests
 */
export function cleanupRateLimiter() {
  globalStore.destroy()
}
