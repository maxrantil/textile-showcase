/**
 * ABOUTME: Next.js middleware for authentication and security route protection
 * Implements demo mode bypass for public deployment safety
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * Generate CSP nonce for secure inline scripts/styles
 */
function generateNonce(): string {
  return randomBytes(16).toString('base64')
}

/**
 * Authentication middleware for security routes with comprehensive security headers
 * - Demo mode: Allow access without authentication (safe for public deployment)
 * - Production mode: Require authentication for all security routes
 * - Applies comprehensive security headers to all responses
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Demo mode detection - safe default for public deployment
  const isDemoMode = process.env.SECURITY_ENABLED !== 'true'

  // Generate CSP nonce for this request
  const nonce = generateNonce()

  // Check if this is a security-related route
  const isSecurityRoute =
    pathname.startsWith('/security') || pathname.startsWith('/api/security')

  // Create base response with security headers for all routes
  let response: NextResponse

  // Handle security routes with authentication
  if (isSecurityRoute) {
    // In demo mode, allow access to all security routes without authentication
    if (!isDemoMode) {
      // Production mode - require authentication for security routes
      const authToken = getAuthToken(request)
      const user = await validateAuthToken(authToken)

      if (!user) {
        // Redirect to login with return URL
        const searchParams = request.nextUrl.search || ''
        const redirectUrl = encodeURIComponent(pathname + searchParams)
        response = NextResponse.redirect(
          new URL(`/auth/login?redirect=${redirectUrl}`, request.url)
        )
      } else if (!hasSecurityRole(user)) {
        response = NextResponse.redirect(new URL('/unauthorized', request.url))
      } else {
        response = NextResponse.next()
      }
    } else {
      response = NextResponse.next()
    }
  } else {
    response = NextResponse.next()
  }

  // Add security headers to all responses (only if headers are modifiable)
  if (response.headers) {
    addSecurityHeaders(response, nonce, request)

    // Add nonce to response headers for use in the app
    response.headers.set('x-nonce', nonce)
  }

  return response
}

/**
 * Extract authentication token from request
 */
function getAuthToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookie as fallback
  const cookies = request.headers.get('Cookie') || ''
  const authCookieMatch = cookies.match(/auth-token=([^;]+)/)
  if (authCookieMatch) {
    return authCookieMatch[1]
  }

  return null
}

/**
 * Validate authentication token and return user info
 * In a real implementation, this would validate JWT tokens or session tokens
 */
async function validateAuthToken(token: string | null): Promise<User | null> {
  if (!token) {
    return null
  }

  // Simple validation for testing - in production, use proper JWT validation
  const validToken = process.env.VALID_AUTH_TOKEN
  if (validToken && token === validToken) {
    const userRoles = process.env.USER_ROLES?.split(',') || []
    return {
      id: 'test-user',
      token,
      roles: userRoles,
      permissions: derivePermissions(userRoles),
    }
  }

  // Check for expired tokens (basic check for demo purposes)
  if (token.includes('expired')) {
    return null
  }

  return null
}

/**
 * Check if user has required role for security access
 */
function hasSecurityRole(user: User): boolean {
  const securityRoles = ['security_admin', 'security_viewer', 'admin']
  return user.roles.some((role) => securityRoles.includes(role))
}

/**
 * Derive permissions from roles
 */
function derivePermissions(roles: string[]): string[] {
  const permissions: string[] = []

  if (roles.includes('security_admin') || roles.includes('admin')) {
    permissions.push(
      'read:security_events',
      'write:security_config',
      'delete:security_data'
    )
  } else if (roles.includes('security_viewer')) {
    permissions.push('read:security_events')
  }

  return permissions
}

/**
 * Add comprehensive security headers to response
 */
function addSecurityHeaders(
  response: NextResponse,
  nonce: string,
  request: NextRequest
): void {
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Enable XSS protection (legacy, but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // DNS prefetch control
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // Prevent download of files in IE
  response.headers.set('X-Download-Options', 'noopen')

  // Control which features and APIs can be used
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Strict Transport Security (HSTS) - only on HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Content Security Policy with nonce for inline scripts
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Build CSP directives
  const cspDirectives: string[] = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${isDevelopment ? "'unsafe-eval'" : ''} https://cdn.sanity.io https://www.googletagmanager.com https://www.google-analytics.com https://analytics.idaromme.dk`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://cdn.sanity.io https://*.googleusercontent.com https://www.google-analytics.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' https://cdn.sanity.io https://www.google-analytics.com https://analytics.google.com https://analytics.idaromme.dk ${isDevelopment ? 'ws://localhost:*' : ''}`,
    `media-src 'self' https://cdn.sanity.io`,
    `object-src 'none'`,
    `child-src 'self'`,
    `frame-src 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `manifest-src 'self'`,
    `upgrade-insecure-requests`,
  ]

  // Add report-uri if configured
  const cspReportUri = process.env.CSP_REPORT_URI
  if (cspReportUri) {
    cspDirectives.push(`report-uri ${cspReportUri}`)
  }

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
}

/**
 * User interface for type safety
 */
interface User {
  id: string
  token: string
  roles: string[]
  permissions: string[]
}

/**
 * Configure which routes the middleware should run on
 * Apply security headers to all routes except static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
