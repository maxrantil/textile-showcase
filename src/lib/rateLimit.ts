// ABOUTME: Rate limiting logic for API endpoints with a bounded in-memory store
// Fixed-window counters keyed by caller-supplied strings (usually client IP)

export interface RateLimitOptions {
  /** Maximum requests allowed per window */
  limit?: number
  /** Window length in milliseconds */
  windowMs?: number
  /**
   * Keep this counter out of the bounded per-client store, so a flood of
   * new keys can never evict it. Only for a fixed set of keys, such as a
   * global budget (Issue #489)
   */
  pinned?: boolean
}

/** Hard cap on tracked keys so a flood of unique IPs cannot exhaust memory */
export const RATE_LIMIT_MAX_KEYS = 10_000

/** Maximum contact-form emails per hour across ALL clients (protects mail quota) */
export const GLOBAL_CONTACT_LIMIT = 30
export const GLOBAL_CONTACT_WINDOW_MS = 60 * 60 * 1000

/** The Resend SDK has no abort option, so the contact send is raced against this (SEC-05) */
export const RESEND_TIMEOUT_MS = 10_000

type Window = { count: number; resetTime: number }

// Rate limiting - simple in-memory store
export const rateLimitStore = new Map<string, Window>()

/** Pinned counters (global budgets): never evicted, only expired */
export const pinnedRateLimitStore = new Map<string, Window>()

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
  { limit = 5, windowMs = 60_000, pinned = false }: RateLimitOptions = {}
): boolean {
  const now = Date.now()
  const store = pinned ? pinnedRateLimitStore : rateLimitStore
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    if (!entry && !pinned) evictIfFull(now)
    store.set(key, { count: 1, resetTime: now + windowMs })
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
    for (const store of [rateLimitStore, pinnedRateLimitStore]) {
      for (const [key, entry] of store.entries()) {
        if (now > entry.resetTime) {
          store.delete(key)
        }
      }
    }
  }, 60000) // Clean up every minute
  // Never keep the process alive just for cleanup
  timer.unref?.()
}
