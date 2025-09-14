/**
 * ABOUTME: Audit logs API endpoint for real-time security monitoring and log analysis
 * Provides access to security events, alerts, and threat analysis data
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditLogger } from '@/lib/security/audit-logger'

interface AuditLogResponse {
  success: boolean
  data?: unknown
  error?: string
  timestamp: string
  total?: number
  page?: number
  limit?: number
}

interface SecurityEventRequest {
  event: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  details?: string
  securityContext?: {
    sessionId?: string
    userAgent?: string
    ipAddress?: string
    geolocation?: string
  }
}

// Initialize audit logger for this endpoint
const auditLogger = new AuditLogger()

/**
 * GET - Retrieve audit logs with filtering and pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const hours = parseInt(searchParams.get('hours') || '24', 10)
    const type = searchParams.get('type') // 'events', 'alerts', 'metrics', 'threats'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Validate parameters
    if (hours < 1 || hours > 168) {
      // Max 7 days
      return NextResponse.json(
        {
          success: false,
          error: 'Hours parameter must be between 1 and 168',
          timestamp: new Date().toISOString(),
        } as AuditLogResponse,
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit parameter must be between 1 and 1000',
          timestamp: new Date().toISOString(),
        } as AuditLogResponse,
        { status: 400 }
      )
    }

    // Handle different request types
    switch (type) {
      case 'alerts':
        const alerts = await auditLogger.getSecurityAlerts()
        const paginatedAlerts = paginateResults(alerts, page, limit)

        await auditLogger.logSecurityEventWithContext(
          'AUDIT_LOG_ACCESS',
          'LOW',
          `Retrieved ${alerts.length} security alerts`,
          {
            sessionId: requestId,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: getClientIP(request),
          }
        )

        return NextResponse.json({
          success: true,
          data: paginatedAlerts.data,
          total: alerts.length,
          page,
          limit,
          timestamp: new Date().toISOString(),
        } as AuditLogResponse)

      case 'metrics':
        const metrics = await auditLogger.getSecurityMetrics()

        await auditLogger.logSecurityEventWithContext(
          'SECURITY_METRICS_ACCESS',
          'LOW',
          'Retrieved security metrics',
          {
            sessionId: requestId,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: getClientIP(request),
          }
        )

        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString(),
        } as AuditLogResponse)

      case 'threats':
        const threatAnalysis = await auditLogger.analyzeThreatPatterns()

        await auditLogger.logSecurityEventWithContext(
          'THREAT_ANALYSIS_ACCESS',
          'LOW',
          `Retrieved ${threatAnalysis.length} threat patterns`,
          {
            sessionId: requestId,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: getClientIP(request),
          }
        )

        return NextResponse.json({
          success: true,
          data: threatAnalysis,
          timestamp: new Date().toISOString(),
        } as AuditLogResponse)

      case 'events':
      default:
        const events = await auditLogger.getRecentEvents(hours)
        const paginatedEvents = paginateResults(events, page, limit)

        await auditLogger.logSecurityEventWithContext(
          'AUDIT_LOG_ACCESS',
          'LOW',
          `Retrieved ${events.length} audit events (${hours}h)`,
          {
            sessionId: requestId,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: getClientIP(request),
          }
        )

        return NextResponse.json({
          success: true,
          data: paginatedEvents.data,
          total: events.length,
          page,
          limit,
          timestamp: new Date().toISOString(),
        } as AuditLogResponse)
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await auditLogger.logSecurityEventWithContext(
      'AUDIT_LOG_ERROR',
      'MEDIUM',
      errorMessage,
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve audit logs',
        timestamp: new Date().toISOString(),
      } as AuditLogResponse,
      { status: 500 }
    )
  }
}

/**
 * POST - Log custom security events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `log-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    // Parse and validate request body
    const body = (await request.json()) as SecurityEventRequest
    const { event, severity, details, securityContext } = body

    // Validate required fields
    if (!event || !severity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: event, severity',
          timestamp: new Date().toISOString(),
        } as AuditLogResponse,
        { status: 400 }
      )
    }

    // Validate severity level
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid severity level. Must be one of: LOW, MEDIUM, HIGH, CRITICAL',
          timestamp: new Date().toISOString(),
        } as AuditLogResponse,
        { status: 400 }
      )
    }

    // Validate request size
    const requestSize = JSON.stringify(body).length
    if (requestSize > 10000) {
      // 10KB limit
      return NextResponse.json(
        {
          success: false,
          error: 'Request payload too large',
          timestamp: new Date().toISOString(),
        } as AuditLogResponse,
        { status: 413 }
      )
    }

    // Enhance security context with request metadata
    const enhancedContext = {
      ...securityContext,
      sessionId: requestId,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: getClientIP(request),
    }

    // Log the security event
    await auditLogger.logSecurityEventWithContext(
      event,
      severity,
      details,
      enhancedContext
    )

    return NextResponse.json({
      success: true,
      data: { eventId: requestId },
      timestamp: new Date().toISOString(),
    } as AuditLogResponse)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await auditLogger.logSecurityEventWithContext(
      'SECURITY_EVENT_LOG_ERROR',
      'MEDIUM',
      errorMessage,
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to log security event',
        timestamp: new Date().toISOString(),
      } as AuditLogResponse,
      { status: 500 }
    )
  }
}

/**
 * PUT - Configure audit log settings (retention, alerts, etc.)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const requestId = `config-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    const body = await request.json()
    const { retention, alertHandlers } = body

    // Configure retention policy if provided
    if (retention) {
      await auditLogger.configureRetention(retention)
    }

    // Configure alert handlers if provided
    if (alertHandlers) {
      await auditLogger.configureAlertHandlers(alertHandlers)
    }

    await auditLogger.logSecurityEventWithContext(
      'AUDIT_CONFIG_UPDATE',
      'LOW',
      'Audit configuration updated',
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json({
      success: true,
      data: { configUpdated: true },
      timestamp: new Date().toISOString(),
    } as AuditLogResponse)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await auditLogger.logSecurityEventWithContext(
      'AUDIT_CONFIG_ERROR',
      'MEDIUM',
      errorMessage,
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to configure audit settings',
        timestamp: new Date().toISOString(),
      } as AuditLogResponse,
      { status: 500 }
    )
  }
}

/**
 * DELETE - Apply retention policy and cleanup old logs
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const requestId = `cleanup-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    // Apply retention policy to clean up old logs
    await auditLogger.applyRetentionPolicy()

    await auditLogger.logSecurityEventWithContext(
      'LOG_RETENTION_APPLIED',
      'LOW',
      'Applied retention policy and cleaned up old logs',
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json({
      success: true,
      data: { retentionApplied: true },
      timestamp: new Date().toISOString(),
    } as AuditLogResponse)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await auditLogger.logSecurityEventWithContext(
      'LOG_RETENTION_ERROR',
      'MEDIUM',
      errorMessage,
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply retention policy',
        timestamp: new Date().toISOString(),
      } as AuditLogResponse,
      { status: 500 }
    )
  }
}

/**
 * Helper function to extract client IP address
 */
function getClientIP(request: NextRequest): string | undefined {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const clientIP = request.headers.get('x-client-ip')
  if (clientIP) {
    return clientIP
  }

  // Return undefined if no IP found (will be handled appropriately)
  return undefined
}

/**
 * Helper function to paginate results
 */
function paginateResults<T>(
  data: T[],
  page: number,
  limit: number
): { data: T[]; total: number } {
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  return {
    data: data.slice(startIndex, endIndex),
    total: data.length,
  }
}
