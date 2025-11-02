// ABOUTME: Rate limiting logic for API endpoints with in-memory store

// Rate limiting - simple in-memory store
export const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>()

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitStore.get(ip)

  if (!limit || now > limit.resetTime) {
    // Reset or initialize
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + 60000, // 1 minute window
    })
    return true
  }

  if (limit.count >= 5) {
    return false // Rate limit exceeded
  }

  limit.count++
  return true
}

// Clean up old entries periodically (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, limit] of rateLimitStore.entries()) {
      if (now > limit.resetTime) {
        rateLimitStore.delete(ip)
      }
    }
  }, 60000) // Clean up every minute
}
