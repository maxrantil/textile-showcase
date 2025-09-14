/**
 * ABOUTME: Security event logging system for audit trail and monitoring
 * Provides centralized logging for security-related events and activities
 */

interface SecurityEvent {
  readonly id: string
  readonly timestamp: Date
  readonly eventType:
    | 'authentication'
    | 'validation_failure'
    | 'rate_limit'
    | 'api_key_usage'
  readonly severity: 'info' | 'warning' | 'error' | 'critical'
  readonly metadata?: Readonly<Record<string, unknown>>
}

export const logSecurityEvent = (event: SecurityEvent): void => {
  // In production, this would write to actual log files/services
  console.log(
    `[SECURITY] ${event.timestamp.toISOString()} - ${event.eventType} (${event.severity}):`,
    event
  )
}

export const createSecurityEvent = (
  eventType: SecurityEvent['eventType'],
  severity: SecurityEvent['severity'],
  metadata?: Record<string, unknown>
): SecurityEvent => {
  return {
    id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    eventType,
    severity,
    metadata: metadata ? { ...metadata } : undefined,
  }
}
