/**
 * ABOUTME: Next.js middleware for authentication and security route protection
 * Implements demo mode bypass for public deployment safety
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Authentication middleware for security routes
 * - Demo mode: Allow access without authentication (safe for public deployment)
 * - Production mode: Require authentication for all security routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Demo mode detection - safe default for public deployment
  const isDemoMode = process.env.SECURITY_ENABLED !== 'true'

  // Check if this is a security-related route
  const isSecurityRoute =
    pathname.startsWith('/security') || pathname.startsWith('/api/security')

  // Allow access to non-security routes without authentication
  if (!isSecurityRoute) {
    return NextResponse.next()
  }

  // In demo mode, allow access to all security routes without authentication
  if (isDemoMode) {
    return NextResponse.next()
  }

  // Production mode - require authentication for security routes
  const authToken = getAuthToken(request)
  const user = await validateAuthToken(authToken)

  if (!user) {
    // Redirect to login with return URL
    const searchParams = request.nextUrl.search || ''
    const redirectUrl = encodeURIComponent(pathname + searchParams)
    return NextResponse.redirect(
      new URL(`/auth/login?redirect=${redirectUrl}`, request.url)
    )
  }

  // Check if user has required role for security access
  if (!hasSecurityRole(user)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Add security headers for authenticated security routes
  const response = NextResponse.next()
  addSecurityHeaders(response)

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
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  )
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
 */
export const config = {
  matcher: ['/security/:path*', '/api/security/:path*'],
}
