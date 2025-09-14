/**
 * ABOUTME: TDD test suite for Demo Mode Toggle functionality in security dashboard
 * Ensures safe public deployment with impressive demo data while protecting real security data
 */

import { NextRequest } from 'next/server'

// Mock Next.js request/response
const mockNextRequest = (url: string) => ({
  url,
  headers: {
    get: jest.fn(() => 'test-user-agent'),
  },
})

const mockNextResponse = {
  json: jest.fn((data, options) => ({
    json: async () => data,
    status: options?.status || 200,
  })),
}

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}))

// Mock environment variables
const mockEnv = (securityEnabled: string) => {
  process.env.SECURITY_ENABLED = securityEnabled
}

describe('Demo Mode Toggle - TDD Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to demo mode for safety
    delete process.env.SECURITY_ENABLED
  })

  afterEach(() => {
    // Clean up environment
    delete process.env.SECURITY_ENABLED
  })

  describe('Demo Mode Detection', () => {
    // TDD RED PHASE: Test will fail - no demo mode implementation yet
    it('should enable demo mode when SECURITY_ENABLED is not true', async () => {
      mockEnv('false')

      // Import after setting environment
      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.demoMode).toBe(true)
      expect(data.data.overview.systemStatus).toBe('HEALTHY') // Demo shows healthy system
      expect(data.data.metrics.totalEvents).toBeGreaterThan(100) // Demo shows impressive numbers
    })

    // TDD RED PHASE: Test will fail - no demo mode implementation yet
    it('should disable demo mode when SECURITY_ENABLED is true', async () => {
      mockEnv('true')

      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.demoMode).toBe(false)
      // Real mode uses actual data from audit logger
    })

    // TDD RED PHASE: Test will fail - no demo mode implementation yet
    it('should default to demo mode for safety when SECURITY_ENABLED is undefined', async () => {
      // No SECURITY_ENABLED set (undefined)

      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.demoMode).toBe(true) // Safe default
      expect(data.data.overview.systemStatus).toBe('HEALTHY')
    })
  })

  describe('Demo Mode Data Generation', () => {
    beforeEach(() => {
      mockEnv('false') // Enable demo mode
    })

    // TDD RED PHASE: Test will fail - no demo data generation
    it('should generate impressive demo metrics for public showcase', async () => {
      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.demoMode).toBe(true)

      const metrics = data.data.metrics
      expect(metrics.totalEvents).toBeGreaterThan(500) // Impressive numbers
      expect(metrics.threatCount).toBeGreaterThan(10)
      expect(metrics.successRate).toBeGreaterThan(0.85) // Good success rate
      expect(metrics.topThreats.length).toBeGreaterThan(0)

      // Should have realistic threat types
      const threatTypes = metrics.topThreats.map(
        (t: { type: string; count: number; severity: string }) => t.type
      )
      expect(threatTypes).toContain('BRUTE_FORCE_ATTEMPT')
      expect(threatTypes).toContain('UNAUTHORIZED_ACCESS')
    })

    // TDD RED PHASE: Test will fail - no demo events generation
    it('should generate realistic demo security events', async () => {
      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.demoMode).toBe(true)

      const events = data.data.recentAlerts
      expect(events.length).toBeGreaterThan(5)

      // Should have mix of success/failure events
      const successEvents = events.filter(
        (e: { success: boolean; timestamp: string; requestId: string }) =>
          e.success
      )
      const failureEvents = events.filter(
        (e: { success: boolean; timestamp: string; requestId: string }) =>
          !e.success
      )
      expect(successEvents.length).toBeGreaterThan(0)
      expect(failureEvents.length).toBeGreaterThan(0)

      // Should have recent timestamps
      const recentEvent = events[0]
      const eventTime = new Date(recentEvent.timestamp).getTime()
      const now = Date.now()
      expect(now - eventTime).toBeLessThan(24 * 60 * 60 * 1000) // Within 24h
    })

    // TDD RED PHASE: Test will fail - no demo threat analysis
    it('should generate convincing threat analysis for demo', async () => {
      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.demoMode).toBe(true)

      const threats = data.data.threatAnalysis
      expect(threats.length).toBeGreaterThan(2)

      // Should have various severity levels
      const severities = threats.map(
        (t: { severity: string; description: string }) => t.severity
      )
      expect(severities).toContain('HIGH')
      expect(severities).toContain('MEDIUM')

      // Should have realistic descriptions
      const descriptions = threats.map(
        (t: { severity: string; description: string }) => t.description
      )
      expect(
        descriptions.some((d: string) => d.includes('authentication'))
      ).toBe(true)
      expect(descriptions.some((d: string) => d.includes('access'))).toBe(true)
    })

    // TDD RED PHASE: Test will fail - no demo system health
    it('should show healthy system status in demo mode', async () => {
      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.demoMode).toBe(true)

      const health = data.data.systemHealth
      expect(health.gpgKeyStatus).toBe(true) // Demo shows everything working
      expect(health.auditLogStatus).toBe(true)
      expect(health.credentialCacheStatus).toBe(true)
      expect(health.encryptionTestStatus).toBe(true)

      const overview = data.data.overview
      expect(overview.systemStatus).toBe('HEALTHY')
      expect(overview.threatLevel).toBeIn(['LOW', 'MEDIUM']) // Not critical in demo
    })
  })

  describe('Demo Mode Safety', () => {
    // TDD RED PHASE: Test will fail - no demo mode safety checks
    it('should not expose real credentials or sensitive data in demo mode', async () => {
      mockEnv('false') // Demo mode

      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.demoMode).toBe(true)

      // Should not contain real key IDs or sensitive information
      const dataStr = JSON.stringify(data)
      expect(dataStr).not.toMatch(/F56A39322E4C0B344629481D75E79ABA2214B9BC/) // Real GPG key
      expect(dataStr).not.toMatch(/localhost:\d+/) // Real internal URLs
      expect(dataStr).not.toMatch(/CREDENTIAL_PATH/) // No real credential paths
      expect(dataStr).not.toMatch(/encrypted\.gpg/) // No real file references

      // Should use generic demo identifiers
      const events = data.data.recentAlerts
      events.forEach((event: { requestId: string; keyId?: string }) => {
        expect(event.requestId).toMatch(/demo-/) // Demo request IDs
        if (event.keyId !== 'unknown') {
          expect(event.keyId).toMatch(/DEMO_|TEST_/) // Demo key IDs
        }
      })
    })

    // TDD RED PHASE: Test will fail - no demo logging separation
    it('should not log demo mode access to real audit logs', async () => {
      mockEnv('false')

      // Mock AuditLogger to verify it's not called in demo mode
      const mockLogSecurityEvent = jest.fn()
      jest.doMock('../../../../src/lib/security/audit-logger', () => ({
        AuditLogger: jest.fn().mockImplementation(() => ({
          logSecurityEventWithContext: mockLogSecurityEvent,
        })),
      }))

      const { GET } = await import(
        '../../../../src/app/api/security/dashboard-data/route'
      )

      const request = mockNextRequest(
        'http://localhost:3000/api/security/dashboard-data'
      )
      const response = await GET(request as NextRequest)
      const data = await response.json()

      expect(data.demoMode).toBe(true)
      // Should not log to real audit system in demo mode
      expect(mockLogSecurityEvent).not.toHaveBeenCalled()
    })
  })
})

// Helper custom matcher
expect.extend({
  toBeIn(received, expected) {
    const pass = expected.includes(received)
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be in [${expected.join(', ')}]`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be in [${expected.join(', ')}]`,
        pass: false,
      }
    }
  },
})

// TypeScript declaration for custom matcher
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeIn(expected: unknown[]): R
    }
  }
}
