import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * Emergency security middleware for protecting critical endpoints
 * Implements IP-based protection for Sanity Studio access
 */

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; reset: number }>()

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Emergency IP-based protection for /studio endpoint
  if (pathname.startsWith('/studio')) {
    const clientIP = getClientIP(request)
    const allowedIPs = getStudioAllowedIPs()

    // Log all studio access attempts for security monitoring
    console.log(
      `Studio access attempt from IP: ${clientIP} at ${new Date().toISOString()}`
    )

    if (!allowedIPs.includes(clientIP) && !allowedIPs.includes('*')) {
      console.warn(
        `SECURITY: Blocked studio access from unauthorized IP: ${clientIP}`
      )

      return new NextResponse(
        JSON.stringify({
          error: 'Access Denied',
          message: 'Studio access is restricted to authorized users only',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Security-Block': 'studio-ip-restriction',
          },
        }
      )
    }
  }

  // Basic rate limiting for API endpoints
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP)

    if (!rateLimitResult.allowed) {
      console.warn(`SECURITY: Rate limit exceeded for IP: ${clientIP}`)

      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              rateLimitResult.resetTime
            ).toISOString(),
          },
        }
      )
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Generate nonce for performance monitoring scripts
  const nonce = randomBytes(16).toString('base64')
  response.headers.set('X-Performance-Script-Nonce', nonce)

  // Safari-specific CSP handling
  const userAgent = request.headers.get('user-agent') || ''
  const isSafari = /Version\/[\d\.]+.*Safari/.test(userAgent)

  // Enhanced script-src with nonce support for performance monitoring
  const scriptSrc = isSafari
    ? `'self' 'unsafe-inline' 'nonce-${nonce}' https://cdn.sanity.io https://umami.is` // Remove 'unsafe-eval' for Safari
    : `'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https://cdn.sanity.io https://umami.is`

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' https://cdn.sanity.io https://res.cloudinary.com data: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.resend.com https://cdn.sanity.io http://70.34.205.18:3000 /api/performance",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "worker-src 'self'",
      "manifest-src 'self'",
    ].join('; ')
  )

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Safari 13-14 has issues with X-XSS-Protection header, causing rendering problems
  if (!isSafari) {
    response.headers.set('X-XSS-Protection', '1; mode=block')
  }

  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip') // Cloudflare

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }

  if (realIP) return realIP
  if (cfIP) return cfIP

  // Fallback when no IP headers available
  return 'unknown'
}

/**
 * Get allowed IPs for Studio access from environment variables
 */
function getStudioAllowedIPs(): string[] {
  const allowedIPs = process.env.STUDIO_ALLOWED_IPS

  if (!allowedIPs) {
    console.warn(
      'SECURITY: STUDIO_ALLOWED_IPS not configured, defaulting to localhost only'
    )
    return ['127.0.0.1', '::1'] // localhost only
  }

  return allowedIPs.split(',').map((ip) => ip.trim())
}

/**
 * Basic rate limiting implementation
 * In production, use Redis or similar distributed store
 */
function checkRateLimit(clientIP: string): {
  allowed: boolean
  resetTime: number
} {
  const now = Date.now()
  const windowSize = 60 * 1000 // 1 minute window
  const maxRequests = 10 // 10 requests per minute

  const key = `rate_limit:${clientIP}`
  const current = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up
    cleanupExpiredRateLimits(now)
  }

  if (!current) {
    // First request from this IP
    rateLimitStore.set(key, { count: 1, reset: now + windowSize })
    return { allowed: true, resetTime: now + windowSize }
  }

  if (now > current.reset) {
    // Window has expired, reset counter
    rateLimitStore.set(key, { count: 1, reset: now + windowSize })
    return { allowed: true, resetTime: now + windowSize }
  }

  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, resetTime: current.reset }
  }

  // Increment counter
  rateLimitStore.set(key, { count: current.count + 1, reset: current.reset })
  return { allowed: true, resetTime: current.reset }
}

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredRateLimits(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.reset) {
      rateLimitStore.delete(key)
    }
  }
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    '/studio/:path*', // Protect Sanity Studio
    '/api/:path*', // Rate limit API endpoints
    '/((?!_next/static|_next/image|favicon.ico).*)', // Apply CSP to all pages except static files
  ],
}
