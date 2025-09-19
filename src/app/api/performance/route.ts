// ABOUTME: Secure performance metrics API endpoint with input validation, rate limiting, and privacy controls

import { NextRequest, NextResponse } from 'next/server'
import {
  validatePerformanceData,
  validatePerformanceBatch,
  detectSuspiciousActivity,
} from '@/utils/performance-security'
import {
  PerformanceRateLimiter,
  PERFORMANCE_RATE_LIMITS,
} from '@/utils/rate-limit'

/**
 * Security headers for performance API responses
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private'
  )
  return response
}

/**
 * Handle single performance metric submission
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - single metric submission
    const rateLimitResult = await PerformanceRateLimiter.checkLimit(
      request,
      PERFORMANCE_RATE_LIMITS.METRICS_SUBMISSION
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
        { status: 429 }
      )

      response.headers.set(
        'Retry-After',
        Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      )
      response.headers.set(
        'X-RateLimit-Remaining',
        rateLimitResult.remaining.toString()
      )
      response.headers.set(
        'X-RateLimit-Reset',
        new Date(rateLimitResult.resetTime).toISOString()
      )

      return addSecurityHeaders(response)
    }

    // Check Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const response = NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Parse request body with size limit
    let body: unknown
    try {
      const text = await request.text()
      if (text.length > 10240) {
        // 10KB limit for single metric
        const response = NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        )
        return addSecurityHeaders(response)
      }
      body = JSON.parse(text)
    } catch {
      const response = NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Validate and sanitize performance data
    const validationResult = validatePerformanceData(body)
    if (!validationResult.valid) {
      const response = NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Check for suspicious activity
    const suspiciousCheck = detectSuspiciousActivity([
      validationResult.sanitizedData as {
        name: string
        value: number
        timestamp: number
        sessionId: string
      },
    ])
    if (suspiciousCheck.isSuspicious) {
      // Log security event but don't reject (might be legitimate edge case)
      console.warn(
        `Suspicious performance activity: ${suspiciousCheck.reason}`,
        {
          sessionId: (validationResult.sanitizedData as Record<string, unknown>)
            .sessionId,
          userAgent: request.headers.get('user-agent'),
          ip: getClientIP(request),
        }
      )
    }

    // Process the sanitized metric
    const sanitizedMetric = validationResult.sanitizedData as Record<
      string,
      unknown
    >

    // TODO: Store metric in database
    // await storePerformanceMetric(metric)

    // For now, just log for development
    console.log('Performance metric received:', {
      name: sanitizedMetric.name,
      value: sanitizedMetric.value,
      sessionId: sanitizedMetric.sessionId,
      timestamp: sanitizedMetric.timestamp
        ? new Date(sanitizedMetric.timestamp as number).toISOString()
        : new Date().toISOString(),
    })

    // Success response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Performance metric recorded',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Performance API error:', error)

    const response = NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )

    return addSecurityHeaders(response)
  }
}

/**
 * Handle batch performance metrics submission
 */
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting - batch submission (stricter)
    const rateLimitResult = await PerformanceRateLimiter.checkLimit(
      request,
      PERFORMANCE_RATE_LIMITS.METRICS_BATCH
    )

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded for batch operations',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
        { status: 429 }
      )

      response.headers.set(
        'Retry-After',
        Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      )
      return addSecurityHeaders(response)
    }

    // Parse request body with larger size limit for batches
    let body: unknown
    try {
      const text = await request.text()
      if (text.length > 102400) {
        // 100KB limit for batch
        const response = NextResponse.json(
          { error: 'Batch request too large' },
          { status: 413 }
        )
        return addSecurityHeaders(response)
      }
      body = JSON.parse(text)
    } catch {
      const response = NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Validate batch data
    const batchValidation = validatePerformanceBatch(body)
    if (!batchValidation.valid) {
      const response = NextResponse.json(
        { error: batchValidation.error },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    const metrics = batchValidation.sanitizedData as Array<
      Record<string, unknown>
    >

    // Check for suspicious patterns in batch
    const suspiciousCheck = detectSuspiciousActivity(
      metrics as Array<{
        name: string
        value: number
        timestamp: number
        sessionId: string
      }>
    )
    if (suspiciousCheck.isSuspicious) {
      console.warn(
        `Suspicious batch performance activity: ${suspiciousCheck.reason}`,
        {
          batchSize: metrics.length,
          userAgent: request.headers.get('user-agent'),
          ip: getClientIP(request),
        }
      )

      // For batch operations, we might want to reject suspicious activity
      const response = NextResponse.json(
        { error: 'Suspicious activity detected' },
        { status: 403 }
      )
      return addSecurityHeaders(response)
    }

    // TODO: Store metrics in database
    // await storePerformanceMetrics(metrics)

    console.log(`Batch performance metrics received: ${metrics.length} metrics`)

    const response = NextResponse.json(
      {
        success: true,
        message: `Batch of ${metrics.length} metrics recorded`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Performance batch API error:', error)

    const response = NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )

    return addSecurityHeaders(response)
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })

  response.headers.set('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours

  return addSecurityHeaders(response)
}

/**
 * Reject all other HTTP methods
 */
export async function GET() {
  const response = NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
  response.headers.set('Allow', 'POST, PUT, OPTIONS')
  return addSecurityHeaders(response)
}

export { GET as DELETE, GET as PATCH }

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  if (cfIP) return cfIP
  return 'unknown'
}
