/**
 * ABOUTME: Security event logging system for audit trail and monitoring
 * Provides centralized logging for security-related events and activities
 */

import { NextRequest } from 'next/server'
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

/**
 * Extended security event types
 */
export type SecurityEventType =
  | 'authentication'
  | 'authentication_failed'
  | 'authorization_failed'
  | 'validation_failure'
  | 'rate_limit'
  | 'api_key_usage'
  | 'suspicious_activity'
  | 'csrf_attempt'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'path_traversal_attempt'
  | 'malicious_input'
  | 'security_header_violation'
  | 'session_expired'
  | 'password_reset'
  | 'account_locked'
  | 'privilege_escalation'
  | 'data_access'
  | 'configuration_change'

/**
 * Security event interface
 */
export interface SecurityEvent {
  readonly id: string
  readonly timestamp: Date
  readonly eventType: SecurityEventType
  readonly severity: 'info' | 'warning' | 'error' | 'critical'
  readonly userId?: string
  readonly userAgent?: string
  readonly ipAddress?: string
  readonly path?: string
  readonly method?: string
  readonly statusCode?: number
  readonly message?: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * Security event storage
 */
class SecurityEventStore {
  private events: SecurityEvent[] = []
  private readonly maxEvents = 10000
  private readonly logDir = join(process.cwd(), 'logs')
  private readonly logFile = join(this.logDir, 'security-audit.log')

  constructor() {
    this.ensureLogDirectory()
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  add(event: SecurityEvent): void {
    // Add to memory store
    this.events.push(event)

    // Limit memory usage
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    // Write to log file
    this.writeToFile(event)

    // Alert on critical events
    if (event.severity === 'critical') {
      this.alertCriticalEvent(event)
    }
  }

  private writeToFile(event: SecurityEvent): void {
    try {
      const logLine = JSON.stringify(event) + '\n'
      appendFileSync(this.logFile, logLine, 'utf8')
    } catch (error) {
      console.error('Failed to write security event to file:', error)
    }
  }

  private alertCriticalEvent(event: SecurityEvent): void {
    // In production, this would send alerts via email, Slack, PagerDuty, etc.
    console.error(
      `🚨 CRITICAL SECURITY EVENT: ${event.eventType} at ${event.timestamp.toISOString()}`,
      {
        id: event.id,
        userId: event.userId,
        ipAddress: event.ipAddress,
        path: event.path,
        message: event.message,
      }
    )
  }

  query(filters: {
    eventType?: SecurityEventType
    severity?: SecurityEvent['severity']
    userId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): SecurityEvent[] {
    let results = [...this.events]

    if (filters.eventType) {
      results = results.filter((e) => e.eventType === filters.eventType)
    }

    if (filters.severity) {
      results = results.filter((e) => e.severity === filters.severity)
    }

    if (filters.userId) {
      results = results.filter((e) => e.userId === filters.userId)
    }

    if (filters.startDate) {
      results = results.filter((e) => e.timestamp >= filters.startDate!)
    }

    if (filters.endDate) {
      results = results.filter((e) => e.timestamp <= filters.endDate!)
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (filters.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  getSummary(): {
    total: number
    bySeverity: Record<string, number>
    byEventType: Record<string, number>
    recentCritical: SecurityEvent[]
  } {
    const bySeverity: Record<string, number> = {}
    const byEventType: Record<string, number> = {}

    for (const event of this.events) {
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1
    }

    const recentCritical = this.events
      .filter((e) => e.severity === 'critical')
      .slice(-10)
      .reverse()

    return {
      total: this.events.length,
      bySeverity,
      byEventType,
      recentCritical,
    }
  }

  clear(): void {
    this.events = []
  }
}

// Global store instance
const store = new SecurityEventStore()

/**
 * Log a security event
 */
export const logSecurityEvent = (event: SecurityEvent): void => {
  // Store the event
  store.add(event)

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    }[event.severity]

    console.log(
      `${emoji} [SECURITY] ${event.timestamp.toISOString()} - ${event.eventType} (${event.severity}):`,
      {
        id: event.id,
        userId: event.userId,
        ipAddress: event.ipAddress,
        path: event.path,
        message: event.message,
        metadata: event.metadata,
      }
    )
  }
}

/**
 * Create a security event from request context
 */
export const createSecurityEvent = (
  eventType: SecurityEventType,
  severity: SecurityEvent['severity'],
  req?: NextRequest,
  additionalData?: {
    userId?: string
    message?: string
    metadata?: Record<string, unknown>
  }
): SecurityEvent => {
  const event: SecurityEvent = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    eventType,
    severity,
    ...(req && {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress:
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown',
      path: req.nextUrl.pathname,
      method: req.method,
    }),
    ...(additionalData?.userId && { userId: additionalData.userId }),
    ...(additionalData?.message && { message: additionalData.message }),
    ...(additionalData?.metadata && {
      metadata: { ...additionalData.metadata },
    }),
  }

  return event
}

/**
 * Log and create a security event in one call
 */
export const logSecurityEventWithContext = (
  eventType: SecurityEventType,
  severity: SecurityEvent['severity'],
  req?: NextRequest,
  additionalData?: {
    userId?: string
    message?: string
    metadata?: Record<string, unknown>
  }
): void => {
  const event = createSecurityEvent(eventType, severity, req, additionalData)
  logSecurityEvent(event)
}

/**
 * Query security events
 */
export const querySecurityEvents = (
  filters: Parameters<typeof store.query>[0]
): SecurityEvent[] => {
  return store.query(filters)
}

/**
 * Get security events summary
 */
export const getSecuritySummary = (): ReturnType<typeof store.getSummary> => {
  return store.getSummary()
}

/**
 * Export security events for analysis
 */
export const exportSecurityEvents = (
  format: 'json' | 'csv' = 'json'
): string => {
  const events = store.query({ limit: 10000 })

  if (format === 'json') {
    return JSON.stringify(events, null, 2)
  }

  // CSV format
  const headers = [
    'ID',
    'Timestamp',
    'Event Type',
    'Severity',
    'User ID',
    'IP Address',
    'Path',
    'Method',
    'Status Code',
    'Message',
  ]

  const rows = events.map((e) => [
    e.id,
    e.timestamp.toISOString(),
    e.eventType,
    e.severity,
    e.userId || '',
    e.ipAddress || '',
    e.path || '',
    e.method || '',
    e.statusCode?.toString() || '',
    e.message || '',
  ])

  return [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')
}

/**
 * Clear all security events (for testing)
 */
export const clearSecurityEvents = (): void => {
  store.clear()
}
