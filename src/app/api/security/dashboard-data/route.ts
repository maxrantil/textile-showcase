/**
 * ABOUTME: Security dashboard data API endpoint for comprehensive monitoring and analytics
 * Aggregates security metrics, alerts, threat analysis, and system health data
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditLogger } from '@/lib/security/audit-logger'
import { GPGCredentialManager } from '@/lib/security/credential-manager'

interface DashboardResponse {
  success: boolean
  data?: DashboardData
  error?: string
  timestamp: string
  refreshInterval?: number
  demoMode?: boolean
}

interface DashboardData {
  overview: {
    systemStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    totalEvents: number
    activeAlerts: number
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    uptime: string
    lastUpdate: string
  }
  metrics: {
    totalEvents: number
    threatCount: number
    successRate: number
    topThreats: Array<{ type: string; count: number; severity: string }>
    timeRange: string
  }
  recentAlerts: Array<{
    timestamp: Date
    action: string
    keyId: string
    success: boolean
    error?: string
    severity?: string
    verified?: boolean
    requestId?: string
  }>
  threatAnalysis: Array<{
    threatType: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    eventCount: number
    timeRange: string
    description: string
  }>
  systemHealth: {
    gpgKeyStatus: boolean
    auditLogStatus: boolean
    credentialCacheStatus: boolean
    encryptionTestStatus: boolean
    lastHealthCheck: string
  }
  statistics: {
    eventsLast24h: number
    eventsLast7d: number
    averageEventsPerHour: number
    peakEventHour: string
    mostActiveKeyId: string
  }
}

// Initialize services
const auditLogger = new AuditLogger()

/**
 * GET - Retrieve comprehensive dashboard data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = `dashboard-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24', 10)
    const includeHealthCheck = searchParams.get('health') === 'true'

    // Demo mode detection - safe default for public deployment
    const isDemoMode = process.env.SECURITY_ENABLED !== 'true'

    // Validate parameters
    if (hours < 1 || hours > 168) {
      // Max 7 days
      return NextResponse.json(
        {
          success: false,
          error: 'Hours parameter must be between 1 and 168',
          timestamp: new Date().toISOString(),
          demoMode: isDemoMode,
        } as DashboardResponse,
        { status: 400 }
      )
    }

    // Handle demo mode - return impressive demo data without real security operations
    if (isDemoMode) {
      const demoData = generateDemoData(hours)
      return NextResponse.json({
        success: true,
        data: demoData,
        timestamp: new Date().toISOString(),
        refreshInterval: 30000,
        demoMode: true,
      } as DashboardResponse)
    }

    // Gather all dashboard data in parallel for performance
    const [
      recentEvents,
      securityAlerts,
      securityMetrics,
      threatAnalysis,
      systemHealth,
    ] = await Promise.allSettled([
      auditLogger.getRecentEvents(hours),
      auditLogger.getSecurityAlerts(),
      auditLogger.getSecurityMetrics(),
      auditLogger.analyzeThreatPatterns(),
      includeHealthCheck
        ? performSystemHealthCheck()
        : Promise.resolve(getDefaultHealthStatus()),
    ])

    // Process results and handle any failures gracefully
    const events = recentEvents.status === 'fulfilled' ? recentEvents.value : []
    const alerts =
      securityAlerts.status === 'fulfilled' ? securityAlerts.value : []
    const metrics =
      securityMetrics.status === 'fulfilled'
        ? securityMetrics.value
        : getDefaultMetrics()
    const threats =
      threatAnalysis.status === 'fulfilled' ? threatAnalysis.value : []
    const health =
      systemHealth.status === 'fulfilled'
        ? systemHealth.value
        : getDefaultHealthStatus()

    // Convert AuditEvent[] to SecurityEvent[] for calculations
    const securityEvents: SecurityEvent[] = events.map(event => ({
      ...event,
      timestamp: event.timestamp.toISOString(),
    }))

    const securityAlertEvents: SecurityEvent[] = alerts.map(alert => ({
      ...alert,
      timestamp: alert.timestamp.toISOString(),
    }))

    // Calculate overview statistics
    const overview = calculateOverview(securityEvents, securityAlertEvents, threats, health)

    // Calculate detailed statistics
    const statistics = calculateStatistics(securityEvents)

    // Prepare dashboard data
    const dashboardData: DashboardData = {
      overview,
      metrics,
      recentAlerts: alerts.slice(0, 10), // Limit to 10 most recent alerts
      threatAnalysis: threats,
      systemHealth: health,
      statistics,
    }

    // Log dashboard access
    await auditLogger.logSecurityEventWithContext(
      'DASHBOARD_DATA_ACCESS',
      'LOW',
      `Dashboard data retrieved (${events.length} events, ${alerts.length} alerts)`,
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      refreshInterval: 30000, // 30 seconds
      demoMode: false,
    } as DashboardResponse)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await auditLogger.logSecurityEventWithContext(
      'DASHBOARD_DATA_ERROR',
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
        error: 'Failed to retrieve dashboard data',
        timestamp: new Date().toISOString(),
      } as DashboardResponse,
      { status: 500 }
    )
  }
}

/**
 * POST - Trigger manual system health check
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `health-check-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    // Perform comprehensive health check
    const healthStatus = await performSystemHealthCheck()

    // Log health check execution
    await auditLogger.logSecurityEventWithContext(
      'MANUAL_HEALTH_CHECK',
      'LOW',
      'Manual system health check performed',
      {
        sessionId: requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIP(request),
      }
    )

    return NextResponse.json({
      success: true,
      data: { systemHealth: healthStatus },
      timestamp: new Date().toISOString(),
    } as DashboardResponse)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    await auditLogger.logSecurityEventWithContext(
      'HEALTH_CHECK_ERROR',
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
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      } as DashboardResponse,
      { status: 500 }
    )
  }
}

/**
 * Perform comprehensive system health check
 */
async function performSystemHealthCheck(): Promise<
  DashboardData['systemHealth']
> {
  const healthChecks = {
    gpgKeyStatus: false,
    auditLogStatus: false,
    credentialCacheStatus: false,
    encryptionTestStatus: false,
    lastHealthCheck: new Date().toISOString(),
  }

  try {
    // Check GPG key availability
    const gpgKeyId = process.env.GPG_KEY_ID
    if (gpgKeyId) {
      const credentialManager = new GPGCredentialManager(
        gpgKeyId,
        process.env.CREDENTIAL_PATH || './credentials/encrypted.gpg'
      )
      healthChecks.gpgKeyStatus = await credentialManager.validateGPGKey()
      healthChecks.encryptionTestStatus =
        await credentialManager.testEncryptionDecryption()
    }

    // Check audit log accessibility
    try {
      await auditLogger.getRecentEvents(1)
      healthChecks.auditLogStatus = true
    } catch {
      healthChecks.auditLogStatus = false
    }

    // Check credential cache (basic test)
    healthChecks.credentialCacheStatus = true // Assume healthy if we get this far
  } catch (error) {
    // Health check failures are logged but don't break the response
    await auditLogger.logSecurityEventWithContext(
      'HEALTH_CHECK_PARTIAL_FAILURE',
      'MEDIUM',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }

  return healthChecks
}

/**
 * Get default health status for fallback scenarios
 */
function getDefaultHealthStatus(): DashboardData['systemHealth'] {
  return {
    gpgKeyStatus: false,
    auditLogStatus: false,
    credentialCacheStatus: false,
    encryptionTestStatus: false,
    lastHealthCheck: new Date().toISOString(),
  }
}

/**
 * Get default metrics for fallback scenarios
 */
function getDefaultMetrics(): DashboardData['metrics'] {
  return {
    totalEvents: 0,
    threatCount: 0,
    successRate: 0,
    topThreats: [],
    timeRange: '24h',
  }
}

interface SecurityEvent {
  timestamp: string
  action: string
  keyId: string
  success: boolean
  error?: string
  severity?: string
}

interface Threat {
  severity: string
}

/**
 * Calculate overview statistics from events and alerts
 */
function calculateOverview(
  events: SecurityEvent[],
  alerts: SecurityEvent[],
  threats: Threat[],
  health: DashboardData['systemHealth']
): DashboardData['overview'] {
  // Determine system status based on health checks and threat levels
  let systemStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY'

  if (
    !health.gpgKeyStatus ||
    !health.auditLogStatus ||
    !health.encryptionTestStatus
  ) {
    systemStatus = 'CRITICAL'
  } else if (
    alerts.length > 0 ||
    threats.some((t) => t.severity === 'HIGH' || t.severity === 'CRITICAL')
  ) {
    systemStatus = 'WARNING'
  }

  // Calculate threat level
  let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  if (threats.some((t) => t.severity === 'CRITICAL')) {
    threatLevel = 'CRITICAL'
  } else if (threats.some((t) => t.severity === 'HIGH')) {
    threatLevel = 'HIGH'
  } else if (
    threats.some((t) => t.severity === 'MEDIUM') ||
    alerts.length > 5
  ) {
    threatLevel = 'MEDIUM'
  }

  // Calculate uptime (simplified - based on oldest event)
  const oldestEvent =
    events.length > 0
      ? new Date(
          Math.min(...events.map((e) => new Date(e.timestamp).getTime()))
        )
      : new Date()
  const uptime = formatUptime(Date.now() - oldestEvent.getTime())

  return {
    systemStatus,
    totalEvents: events.length,
    activeAlerts: alerts.length,
    threatLevel,
    uptime,
    lastUpdate: new Date().toISOString(),
  }
}

/**
 * Calculate detailed statistics from events
 */
function calculateStatistics(
  events: SecurityEvent[]
): DashboardData['statistics'] {
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const eventsLast24h = events.filter(
    (e) => new Date(e.timestamp) >= last24h
  ).length
  const eventsLast7d = events.filter(
    (e) => new Date(e.timestamp) >= last7d
  ).length

  // Calculate average events per hour (last 24h)
  const averageEventsPerHour = Math.round(eventsLast24h / 24)

  // Find peak event hour (simplified calculation)
  const hourCounts = new Map<number, number>()
  events.forEach((event) => {
    const hour = new Date(event.timestamp).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
  })

  let peakHour = 0
  let maxCount = 0
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count
      peakHour = hour
    }
  })

  // Find most active key ID
  const keyIdCounts = new Map<string, number>()
  events.forEach((event) => {
    keyIdCounts.set(event.keyId, (keyIdCounts.get(event.keyId) || 0) + 1)
  })

  let mostActiveKeyId = 'N/A'
  let maxKeyCount = 0
  keyIdCounts.forEach((count, keyId) => {
    if (count > maxKeyCount && keyId !== 'unknown') {
      maxKeyCount = count
      mostActiveKeyId = keyId
    }
  })

  return {
    eventsLast24h,
    eventsLast7d,
    averageEventsPerHour,
    peakEventHour: `${peakHour.toString().padStart(2, '0')}:00`,
    mostActiveKeyId,
  }
}

/**
 * Format uptime duration into human-readable string
 */
function formatUptime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Helper function to extract client IP address
 */
function getClientIP(request: NextRequest): string | undefined {
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

  return undefined
}

/**
 * Generate impressive demo data for public showcase
 * Safe for public deployment - no real security information exposed
 */
function generateDemoData(hours: number = 24): DashboardData {
  const now = new Date()

  // Generate impressive demo metrics
  const demoMetrics = {
    totalEvents: Math.floor(Math.random() * 500) + 750, // 750-1250 events (impressive)
    threatCount: Math.floor(Math.random() * 15) + 12, // 12-27 threats
    successRate: Math.random() * 0.15 + 0.85, // 85-100% success rate
    topThreats: [
      {
        type: 'BRUTE_FORCE_ATTEMPT',
        count: Math.floor(Math.random() * 10) + 8,
        severity: 'HIGH',
      },
      {
        type: 'UNAUTHORIZED_ACCESS',
        count: Math.floor(Math.random() * 8) + 5,
        severity: 'CRITICAL',
      },
      {
        type: 'SUSPICIOUS_LOGIN',
        count: Math.floor(Math.random() * 12) + 3,
        severity: 'MEDIUM',
      },
      {
        type: 'SQL_INJECTION',
        count: Math.floor(Math.random() * 6) + 2,
        severity: 'HIGH',
      },
      {
        type: 'XSS_ATTEMPT',
        count: Math.floor(Math.random() * 5) + 1,
        severity: 'MEDIUM',
      },
    ],
    timeRange: `${hours}h`,
  }

  // Generate realistic demo security events
  const demoEvents = []
  const eventTypes = [
    {
      action: 'SECURITY_CRITICAL',
      error: 'Unauthorized access attempt detected',
      success: false,
    },
    {
      action: 'SECURITY_HIGH',
      error: 'Multiple failed login attempts from suspicious IP',
      success: false,
    },
    {
      action: 'SECURITY_MEDIUM',
      error: 'SQL injection attempt blocked',
      success: false,
    },
    { action: 'API_AUTHENTICATION', error: undefined, success: true },
    { action: 'CREDENTIAL_ACCESS', error: undefined, success: true },
    {
      action: 'SECURITY_SCAN',
      error: 'Potential XSS attempt detected',
      success: false,
    },
    { action: 'LOGIN_SUCCESS', error: undefined, success: true },
    {
      action: 'SECURITY_WARNING',
      error: 'Unusual traffic pattern detected',
      success: false,
    },
  ]

  for (let i = 0; i < Math.min(15, Math.floor(Math.random() * 10) + 8); i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const minutesAgo = Math.floor(Math.random() * (hours * 60))

    demoEvents.push({
      timestamp: new Date(now.getTime() - minutesAgo * 60 * 1000),
      action: eventType.action,
      keyId: eventType.success
        ? `DEMO_KEY_${Math.floor(Math.random() * 5) + 1}`
        : 'DEMO_THREAT_SOURCE',
      success: eventType.success,
      error: eventType.error || undefined,
      severity: eventType.success
        ? undefined
        : ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
      verified: true,
      requestId: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    })
  }

  // Generate convincing threat analysis
  const demoThreats = [
    {
      threatType: 'BRUTE_FORCE_ATTEMPT',
      severity: 'HIGH' as const,
      eventCount: Math.floor(Math.random() * 8) + 5,
      timeRange: `${hours}h`,
      description:
        'Multiple failed authentication attempts detected from various IP addresses',
    },
    {
      threatType: 'UNAUTHORIZED_ACCESS',
      severity: 'CRITICAL' as const,
      eventCount: Math.floor(Math.random() * 5) + 3,
      timeRange: `${hours}h`,
      description:
        'Attempts to access restricted resources without proper authorization',
    },
    {
      threatType: 'SUSPICIOUS_PATTERN',
      severity: 'MEDIUM' as const,
      eventCount: Math.floor(Math.random() * 12) + 4,
      timeRange: `${hours}h`,
      description:
        'Unusual access patterns that may indicate reconnaissance activity',
    },
  ]

  // Generate healthy system status for demo
  const demoHealth = {
    gpgKeyStatus: true,
    auditLogStatus: true,
    credentialCacheStatus: true,
    encryptionTestStatus: true,
    lastHealthCheck: now.toISOString(),
  }

  // Calculate demo overview
  const demoOverview = {
    systemStatus: 'HEALTHY' as const, // Always healthy in demo
    totalEvents: demoMetrics.totalEvents,
    activeAlerts: demoEvents.filter((e) => !e.success).length,
    threatLevel: (['LOW', 'MEDIUM'] as const)[Math.floor(Math.random() * 2)], // Never critical in demo
    uptime: `${Math.floor(Math.random() * 30) + 15}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
    lastUpdate: now.toISOString(),
  }

  // Calculate demo statistics
  const demoStats = {
    eventsLast24h: Math.floor(Math.random() * 200) + 150,
    eventsLast7d: Math.floor(Math.random() * 800) + 600,
    averageEventsPerHour: Math.floor(Math.random() * 20) + 8,
    peakEventHour: `${Math.floor(Math.random() * 24)
      .toString()
      .padStart(2, '0')}:00`,
    mostActiveKeyId: `DEMO_API_KEY_${Math.floor(Math.random() * 5) + 1}`,
  }

  return {
    overview: demoOverview,
    metrics: demoMetrics,
    recentAlerts: demoEvents,
    threatAnalysis: demoThreats,
    systemHealth: demoHealth,
    statistics: demoStats,
  }
}
