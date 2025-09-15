/**
 * ABOUTME: TDD test suite for performance monitoring system
 * Tests SLA enforcement, circuit breaker patterns, and performance alerts
 */

import { PerformanceMonitor } from '../../../src/lib/agents/performance-monitor'
import { ValidationPipeline } from '../../../src/lib/agents/agent-coordination'

// Ensure test environment has proper secret key
const originalEnv = process.env.AGENT_SECRET_KEY
process.env.AGENT_SECRET_KEY =
  'test-secret-key-for-testing-environment-32-chars'

describe('PerformanceMonitor - TDD Implementation', () => {
  let monitor: PerformanceMonitor
  let mockPipeline: ValidationPipeline

  beforeEach(() => {
    monitor = new PerformanceMonitor()
    mockPipeline = createMockValidationPipeline()
  })

  describe('SLA Enforcement', () => {
    test('should enforce 2-minute validation time SLA', async () => {
      const startTime = Date.now() - 150000 // 2.5 minutes ago

      const metrics = await monitor.monitorValidationPipeline(
        mockPipeline,
        startTime
      )

      expect(metrics.totalValidationTime).toBe(150000)

      const alerts = monitor.getActiveAlerts()
      const timeAlert = alerts.find(
        (alert) => alert.metric === 'maxValidationTime'
      )

      expect(timeAlert).toBeDefined()
      expect(timeAlert?.severity).toBe('CRITICAL')
      expect(timeAlert?.currentValue).toBe(150000)
      expect(timeAlert?.threshold).toBe(120000)
    })

    test('should enforce memory usage SLA (200MB)', async () => {
      const startTime = Date.now() - 60000 // 1 minute ago

      // Mock memory usage above threshold
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalGetMemoryUsage = (monitor as any).getCurrentMemoryUsage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(monitor as any).getCurrentMemoryUsage = jest
        .fn()
        .mockReturnValue(250 * 1024 * 1024) // 250MB

      const metrics = await monitor.monitorValidationPipeline(
        mockPipeline,
        startTime
      )

      expect(metrics.memoryUsage).toBe(250 * 1024 * 1024)

      const alerts = monitor.getActiveAlerts()
      const memoryAlert = alerts.find(
        (alert) => alert.metric === 'maxMemoryUsage'
      )

      expect(memoryAlert).toBeDefined()
      expect(memoryAlert?.severity).toBe('WARNING')

      // Restore original method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(monitor as any).getCurrentMemoryUsage = originalGetMemoryUsage
    })

    test('should enforce context optimization SLA (80%)', async () => {
      const startTime = Date.now() - 60000

      // Create pipeline with poor context optimization
      const poorOptimizationPipeline = {
        ...mockPipeline,
        architectureAnalysis: {
          ...mockPipeline.architectureAnalysis,
          contextScope: {
            changedFiles: ['test.ts'],
            affectedComponents: ['test-component'],
            analysisReduction: 60, // Below 80% threshold
          },
        },
      }

      const metrics = await monitor.monitorValidationPipeline(
        poorOptimizationPipeline,
        startTime
      )

      expect(metrics.contextOptimization).toBe(60)

      const alerts = monitor.getActiveAlerts()
      const optimizationAlert = alerts.find(
        (alert) => alert.metric === 'minContextOptimization'
      )

      expect(optimizationAlert).toBeDefined()
      expect(optimizationAlert?.severity).toBe('WARNING')
    })

    test('should enforce parallelism efficiency SLA (30%)', async () => {
      const startTime = Date.now() - 60000

      // Create pipeline with poor parallelism
      const poorParallelismPipeline = {
        ...mockPipeline,
        parallelDomainReviews: [
          {
            ...mockPipeline.parallelDomainReviews[0],
            processingTime: 100, // Same time as sequential
          },
        ],
      }

      const metrics = await monitor.monitorValidationPipeline(
        poorParallelismPipeline,
        startTime
      )

      expect(metrics.parallelismEfficiency).toBeLessThan(30)

      const alerts = monitor.getActiveAlerts()
      const parallelismAlert = alerts.find(
        (alert) => alert.metric === 'minParallelismEfficiency'
      )

      expect(parallelismAlert).toBeDefined()
      expect(parallelismAlert?.severity).toBe('INFO')
    })

    test('should pass SLA when all metrics are within thresholds', async () => {
      const startTime = Date.now() - 60000 // 1 minute ago (within SLA)

      const metrics = await monitor.monitorValidationPipeline(
        mockPipeline,
        startTime
      )

      expect(metrics.totalValidationTime).toBeLessThanOrEqual(120000)

      const alerts = monitor.getActiveAlerts()
      const criticalAlerts = alerts.filter(
        (alert) => alert.severity === 'CRITICAL'
      )

      expect(criticalAlerts).toHaveLength(0)
    })
  })

  describe('Circuit Breaker Pattern', () => {
    test('should execute operation successfully when circuit is closed', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')

      const result = await monitor.executeWithCircuitBreaker(
        'test-operation',
        mockOperation
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)

      const circuitStates = monitor.getCircuitBreakerStates()
      expect(circuitStates.has('test-operation')).toBe(true) // Circuit breaker is created on first use
      const circuitState = circuitStates.get('test-operation')
      expect(circuitState?.state).toBe('CLOSED') // Should remain closed for successful operations
    })

    test('should open circuit after consecutive failures', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Operation failed'))

      // Attempt operation 3 times to exceed threshold
      for (let i = 0; i < 3; i++) {
        try {
          await monitor.executeWithCircuitBreaker(
            'failing-operation',
            mockOperation
          )
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Expected to fail
        }
      }

      const circuitStates = monitor.getCircuitBreakerStates()
      const circuitState = circuitStates.get('failing-operation')

      expect(circuitState?.state).toBe('OPEN')
      expect(circuitState?.failureCount).toBe(3)
      expect(circuitState?.nextAttempt).toBeDefined()
    })

    test('should reject operations when circuit is open', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Test failure'))

      // First, trigger 3 failures to open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await monitor.executeWithCircuitBreaker(
            'blocked-operation',
            mockOperation
          )
        } catch {
          // Expected failures
        }
      }

      // Reset mock to return success, but circuit should be open
      mockOperation.mockResolvedValue('success')

      await expect(
        monitor.executeWithCircuitBreaker('blocked-operation', mockOperation)
      ).rejects.toThrow('Circuit breaker is OPEN')
    })

    test('should transition to half-open after timeout', async () => {
      const mockFailure = jest.fn().mockRejectedValue(new Error('Test failure'))
      const mockSuccess = jest.fn().mockResolvedValue('success')

      // First trigger 3 failures to open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await monitor.executeWithCircuitBreaker(
            'recovering-operation',
            mockFailure
          )
        } catch {
          // Expected failures
        }
      }

      // Wait a bit longer than timeout (circuit breaker uses 60 seconds timeout)
      // For testing, we'll manually manipulate the internal state through access to private property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const internalCircuitBreakers = (monitor as any).circuitBreakers
      const circuitState = internalCircuitBreakers.get('recovering-operation')
      if (circuitState) {
        circuitState.nextAttempt = new Date(Date.now() - 1000) // 1 second ago
        internalCircuitBreakers.set('recovering-operation', circuitState)
      }

      const result = await monitor.executeWithCircuitBreaker(
        'recovering-operation',
        mockSuccess
      )

      expect(result).toBe('success')
      expect(mockSuccess).toHaveBeenCalledTimes(1)

      const updatedStates = monitor.getCircuitBreakerStates()
      const updatedState = updatedStates.get('recovering-operation')
      expect(updatedState?.state).toBe('CLOSED')
      expect(updatedState?.failureCount).toBe(0)
    })
  })

  describe('Performance Alerts', () => {
    test('should generate critical alerts for SLA violations', async () => {
      const startTime = Date.now() - 180000 // 3 minutes ago

      await monitor.monitorValidationPipeline(mockPipeline, startTime)

      const alerts = monitor.getActiveAlerts()
      const criticalAlert = alerts.find(
        (alert) => alert.severity === 'CRITICAL'
      )

      expect(criticalAlert).toBeDefined()
      expect(criticalAlert?.message).toContain('exceeded SLA')
      expect(criticalAlert?.recommendations).toBeDefined()
      expect(criticalAlert?.recommendations.length).toBeGreaterThan(0)
    })

    test('should provide actionable recommendations for violations', async () => {
      const startTime = Date.now() - 150000 // 2.5 minutes ago

      await monitor.monitorValidationPipeline(mockPipeline, startTime)

      const alerts = monitor.getActiveAlerts()
      const timeAlert = alerts.find(
        (alert) => alert.metric === 'maxValidationTime'
      )

      expect(
        timeAlert?.recommendations.some((rec) => rec.includes('parallelism'))
      ).toBe(true)
      expect(
        timeAlert?.recommendations.some((rec) =>
          rec.includes('context reduction')
        )
      ).toBe(true)
    })

    test('should track alert timestamps correctly', async () => {
      const beforeTime = Date.now()
      const startTime = Date.now() - 150000

      await monitor.monitorValidationPipeline(mockPipeline, startTime)

      const alerts = monitor.getActiveAlerts()
      const alert = alerts[0]

      expect(alert.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime)
      expect(alert.timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('Resource Monitoring', () => {
    test('should track resource usage over time', (done) => {
      // Wait for resource monitoring to collect data
      setTimeout(() => {
        const resourceUsage = monitor.getResourceUsage()

        expect(resourceUsage.length).toBeGreaterThan(0)
        expect(resourceUsage[0]).toMatchObject({
          memoryUsed: expect.any(Number),
          cpuUsage: expect.any(Number),
          networkLatency: expect.any(Number),
          timestamp: expect.any(Date),
        })

        done()
      }, 11000) // Wait for one monitoring cycle
    }, 12000) // Set test timeout to 12 seconds

    test('should limit resource history to 100 entries', () => {
      const resourceUsage = monitor.getResourceUsage()

      // Should not exceed 100 entries
      expect(resourceUsage.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Performance History and Trends', () => {
    test('should maintain performance history', async () => {
      const startTime1 = Date.now() - 60000
      const startTime2 = Date.now() - 30000

      await monitor.monitorValidationPipeline(mockPipeline, startTime1)
      await monitor.monitorValidationPipeline(mockPipeline, startTime2)

      const history = monitor.getPerformanceHistory()

      expect(history).toHaveLength(2)
      expect(history[0].totalValidationTime).toBe(60000)
      expect(history[1].totalValidationTime).toBeCloseTo(30000, -1) // Allow for timing variance
    })

    test('should calculate parallelism efficiency correctly', async () => {
      const parallelPipeline = {
        ...mockPipeline,
        parallelDomainReviews: [
          { ...mockPipeline.parallelDomainReviews[0], processingTime: 100 },
          { ...mockPipeline.parallelDomainReviews[0], processingTime: 80 },
          { ...mockPipeline.parallelDomainReviews[0], processingTime: 90 },
        ],
      }

      const startTime = Date.now() - 60000
      const metrics = await monitor.monitorValidationPipeline(
        parallelPipeline,
        startTime
      )

      // Sequential time: 100 + 80 + 90 = 270ms
      // Parallel time: max(100, 80, 90) = 100ms
      // Efficiency: (270 - 100) / 270 = 63%
      expect(metrics.parallelismEfficiency).toBeCloseTo(63, 0)
    })
  })

  describe('Audit Trail', () => {
    test('should maintain comprehensive audit trail', async () => {
      const startTime = Date.now() - 60000

      await monitor.monitorValidationPipeline(mockPipeline, startTime)

      const auditTrail = monitor.getAuditTrail()

      expect(auditTrail.length).toBeGreaterThan(0)

      // Find the PERFORMANCE_MONITORED entry
      const monitoredEntry = auditTrail.find(
        (entry) => entry.action === 'PERFORMANCE_MONITORED'
      )
      expect(monitoredEntry).toBeDefined()
      expect(monitoredEntry?.signature).toBeDefined()
      expect(monitoredEntry?.details).toMatchObject({
        totalValidationTime: expect.any(Number),
        memoryUsage: expect.any(Number),
        slaCompliant: expect.any(Boolean),
      })
    })

    test('should log circuit breaker events', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')

      await monitor.executeWithCircuitBreaker('audit-test', mockOperation)

      const auditTrail = monitor.getAuditTrail()
      const circuitEvent = auditTrail.find(
        (entry) => entry.action === 'CIRCUIT_BREAKER_SUCCESS'
      )

      expect(circuitEvent).toBeDefined()
      expect(circuitEvent?.details).toMatchObject({
        operation: 'audit-test',
        executionTime: expect.any(Number),
        circuitState: expect.any(String),
      })
    })
  })

  describe('SLA Configuration', () => {
    test('should expose performance SLA configuration', () => {
      const sla = monitor.getPerformanceSLA()

      expect(sla).toMatchObject({
        maxValidationTime: 120000, // 2 minutes
        maxMemoryUsage: 200 * 1024 * 1024, // 200MB
        minContextOptimization: 80, // 80%
        minParallelismEfficiency: 30, // 30%
      })
    })
  })

  // Helper function to create mock validation pipeline
  function createMockValidationPipeline(): ValidationPipeline {
    const mockAgent = {
      name: 'test-agent',
      version: '1.0.0',
      capabilities: ['test'],
      trustLevel: 'HIGH' as const,
    }

    const mockValidationResult = {
      agent: mockAgent,
      status: 'APPROVED' as const,
      score: 4.0,
      recommendations: ['Test recommendation'],
      conflicts: [],
      rationale: 'Test rationale',
      cryptographicSignature: 'mock-signature',
      processingTime: 100,
      contextScope: {
        changedFiles: ['test.ts'],
        affectedComponents: ['test-component'],
        analysisReduction: 85,
      },
      timestamp: new Date(),
    }

    return {
      architectureAnalysis: mockValidationResult,
      parallelDomainReviews: [mockValidationResult, mockValidationResult],
      consensusValidation: [],
      performanceBenchmarks: {
        totalValidationTime: 60000,
        memoryUsage: 150 * 1024 * 1024,
        contextOptimization: 85,
        parallelismEfficiency: 40,
      },
      finalConsensus: true,
      auditTrail: [],
    }
  }
})

// Restore original environment after tests
afterAll(() => {
  if (originalEnv) {
    process.env.AGENT_SECRET_KEY = originalEnv
  } else {
    delete process.env.AGENT_SECRET_KEY
  }
})
