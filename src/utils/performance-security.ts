// ABOUTME: Performance data validation and sanitization utilities for security hardening

import { createHash } from 'crypto'

export interface ValidationResult {
  valid: boolean
  error?: string
  sanitizedData?: unknown
}

export interface SecurityConfig {
  maxMetricValue: number
  maxSessionIdLength: number
  allowedMetricNames: string[]
  maxMetadataSize: number
  maxUserAgentLength: number
}

const SECURITY_CONFIG: SecurityConfig = {
  maxMetricValue: 60000, // 60 seconds max for any performance metric
  maxSessionIdLength: 64, // Maximum session ID length
  allowedMetricNames: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'],
  maxMetadataSize: 1024, // 1KB max for metadata
  maxUserAgentLength: 512, // Reasonable user agent string length
}

/**
 * Validate and sanitize performance metric data
 */
export function validatePerformanceData(data: unknown): ValidationResult {
  try {
    // Basic type validation
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      typeof data === 'function'
    ) {
      return { valid: false, error: 'Invalid data format: must be object' }
    }

    const metric = data as Record<string, unknown>

    // Validate metric name
    if (!metric.name || typeof metric.name !== 'string') {
      return { valid: false, error: 'Invalid metric name: must be string' }
    }

    if (!SECURITY_CONFIG.allowedMetricNames.includes(metric.name)) {
      return { valid: false, error: `Invalid metric name: ${metric.name}` }
    }

    // Validate metric value
    if (typeof metric.value !== 'number' || isNaN(metric.value)) {
      return { valid: false, error: 'Invalid metric value: must be number' }
    }

    if (metric.value < 0 || metric.value > SECURITY_CONFIG.maxMetricValue) {
      return {
        valid: false,
        error: `Metric value out of range: ${metric.value}`,
      }
    }

    // Validate session ID
    if (!metric.sessionId || typeof metric.sessionId !== 'string') {
      return { valid: false, error: 'Invalid session ID: must be string' }
    }

    if (metric.sessionId.length > SECURITY_CONFIG.maxSessionIdLength) {
      return { valid: false, error: 'Session ID too long' }
    }

    if (!/^hashed_[a-z0-9]+$/.test(metric.sessionId)) {
      return { valid: false, error: 'Invalid session ID format' }
    }

    // Validate timestamp
    if (typeof metric.timestamp !== 'number' || isNaN(metric.timestamp)) {
      return { valid: false, error: 'Invalid timestamp: must be number' }
    }

    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    const oneMinuteFromNow = now + 1 * 60 * 1000

    if (
      metric.timestamp < fiveMinutesAgo ||
      metric.timestamp > oneMinuteFromNow
    ) {
      return { valid: false, error: 'Timestamp out of acceptable range' }
    }

    // Validate and sanitize metadata
    const sanitizedMetadata = sanitizeMetadata(metric.metadata)
    if (!sanitizedMetadata.valid) {
      return sanitizedMetadata
    }

    // Validate and sanitize user agent
    const sanitizedUserAgent = sanitizeUserAgent(metric.userAgent)
    if (!sanitizedUserAgent.valid) {
      return sanitizedUserAgent
    }

    // Return sanitized data
    return {
      valid: true,
      sanitizedData: {
        name: metric.name,
        value: Math.round(metric.value * 100) / 100, // Round to 2 decimal places
        sessionId: metric.sessionId,
        timestamp: metric.timestamp,
        metadata: sanitizedMetadata.sanitizedData,
        userAgent: sanitizedUserAgent.sanitizedData,
      },
    }
  } catch {
    return { valid: false, error: 'Validation failed: invalid data structure' }
  }
}

/**
 * Sanitize metadata to remove PII and validate size
 */
function sanitizeMetadata(metadata: unknown): ValidationResult {
  if (!metadata) {
    return { valid: true, sanitizedData: {} }
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { valid: false, error: 'Metadata must be object' }
  }

  const metadataString = JSON.stringify(metadata)
  if (metadataString.length > SECURITY_CONFIG.maxMetadataSize) {
    return { valid: false, error: 'Metadata too large' }
  }

  // Remove potential PII fields and dangerous content
  const metadataObj = metadata as Record<string, unknown>
  const sanitized = { ...metadataObj }
  delete sanitized.ip
  delete sanitized.userId
  delete sanitized.email
  delete sanitized.name
  delete sanitized.phone
  delete sanitized.address
  delete sanitized.query // Remove SQL injection attempts

  // Sanitize URL paths to remove query parameters that might contain PII
  if (sanitized.url && typeof sanitized.url === 'string') {
    try {
      const url = new URL(sanitized.url)
      sanitized.url = `${url.protocol}//${url.host}${url.pathname}`
    } catch {
      // If URL parsing fails, just remove the URL
      delete sanitized.url
    }
  }

  return { valid: true, sanitizedData: sanitized }
}

/**
 * Sanitize user agent string
 */
function sanitizeUserAgent(userAgent: unknown): ValidationResult {
  if (!userAgent || typeof userAgent !== 'string') {
    return { valid: true, sanitizedData: 'Unknown' }
  }

  if (userAgent.length > SECURITY_CONFIG.maxUserAgentLength) {
    return { valid: false, error: 'User agent string too long' }
  }

  // Basic sanitization - remove potential XSS vectors and fingerprinting data
  const sanitized = userAgent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .replace(/\b\w+Extension\/[\d.]+/g, '') // Remove browser extensions
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, SECURITY_CONFIG.maxUserAgentLength)

  return { valid: true, sanitizedData: sanitized }
}

/**
 * Generate cryptographically secure session ID hash
 */
export function secureHashSessionId(sessionId: string): string {
  if (!process.env.PERFORMANCE_SECRET_SALT) {
    throw new Error('PERFORMANCE_SECRET_SALT environment variable not set')
  }

  return createHash('sha256')
    .update(sessionId + process.env.PERFORMANCE_SECRET_SALT)
    .digest('hex')
    .substring(0, 16) // Use first 16 characters
}

/**
 * Validate batch performance data
 */
export function validatePerformanceBatch(data: unknown): ValidationResult {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Batch data must be array' }
  }

  if (data.length === 0) {
    return { valid: false, error: 'Batch cannot be empty' }
  }

  if (data.length > 100) {
    return { valid: false, error: 'Batch too large (max 100 metrics)' }
  }

  const sanitizedMetrics = []
  for (let i = 0; i < data.length; i++) {
    const result = validatePerformanceData(data[i])
    if (!result.valid) {
      return { valid: false, error: `Item ${i}: ${result.error}` }
    }
    sanitizedMetrics.push(result.sanitizedData)
  }

  return { valid: true, sanitizedData: sanitizedMetrics }
}

interface BasicMetric {
  name: string
  value: number
  timestamp: number
  sessionId: string
}

/**
 * Check for suspicious patterns in performance data
 */
export function detectSuspiciousActivity(metrics: BasicMetric[]): {
  isSuspicious: boolean
  reason?: string
} {
  // Check for unusual patterns that might indicate attack
  if (metrics.length > 50) {
    return { isSuspicious: true, reason: 'Excessive metric volume' }
  }

  // Check for identical values (possible bot activity)
  const values = metrics.map((m) => m.value)
  const uniqueValues = new Set(values)
  if (uniqueValues.size === 1 && metrics.length > 5) {
    return { isSuspicious: true, reason: 'Identical metric values detected' }
  }

  // Check for timestamp anomalies
  const timestamps = metrics.map((m) => m.timestamp).sort()
  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i] - timestamps[i - 1] < 10) {
      return {
        isSuspicious: true,
        reason: 'Suspiciously rapid metric submission',
      }
    }
  }

  return { isSuspicious: false }
}
