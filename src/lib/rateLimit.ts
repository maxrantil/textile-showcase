// ABOUTME: Rate limiting logic for API endpoints with a bounded in-memory store
// Fixed-window counters keyed by caller-supplied strings (usually client IP)

export interface RateLimitOptions {
  /** Maximum requests allowed per window */
  limit?: number
  /** Window length in milliseconds */
  windowMs?: number
}

/** Hard cap on tracked keys so a flood of unique IPs cannot exhaust memory */
export const RATE_LIMIT_MAX_KEYS = 10_000

/** Maximum contact-form emails per hour across ALL clients (protects mail quota) */
export const GLOBAL_CONTACT_LIMIT = 30
export const GLOBAL_CONTACT_WINDOW_MS = 60 * 60 * 1000

// Rate limiting - simple in-memory store
export const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>()

function evictIfFull(now: number): void {
  if (rateLimitStore.size < RATE_LIMIT_MAX_KEYS) return

  // First drop expired windows
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) rateLimitStore.delete(key)
  }

  // Still full: drop oldest insertions (Map preserves insertion order)
  const excess = rateLimitStore.size - RATE_LIMIT_MAX_KEYS + 1
  if (excess > 0) {
    let removed = 0
    for (const key of rateLimitStore.keys()) {
      rateLimitStore.delete(key)
      if (++removed >= excess) break
    }
  }
}

export function checkRateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: RateLimitOptions = {}
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    if (!entry) evictIfFull(now)
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false // Rate limit exceeded
  }

  entry.count++
  return true
}

// Clean up old entries periodically (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Clean up every minute
  // Never keep the process alive just for cleanup
  timer.unref?.()
}
