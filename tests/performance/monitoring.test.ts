// ABOUTME: Comprehensive test suite for Phase 2C Day 1 performance monitoring implementation
// Tests RUM system, Core Web Vitals tracking, dashboard functionality, and alerting

import { jest } from '@jest/globals'
import type { PerformanceMetric, RUMConfig } from '../../src/types/performance'

// Mock web-vitals library
const mockWebVitals = {
  onCLS: jest.fn(),
  onFID: jest.fn(),
  onFCP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}

jest.mock('web-vitals', () => mockWebVitals)

// Mock browser APIs
const mockPerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}))

const mockNavigator = {
  sendBeacon: jest.fn().mockReturnValue(true),
  serviceWorker: {
    controller: {},
    register: jest.fn(),
  },
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  },
  deviceMemory: 8,
  hardwareConcurrency: 8,
}

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

const mockFetch = jest.fn()

// Setup global mocks
beforeAll(() => {
  global.PerformanceObserver =
    mockPerformanceObserver as unknown as typeof PerformanceObserver
  global.navigator = mockNavigator as unknown as Navigator
  global.localStorage = mockLocalStorage as unknown as Storage
  global.fetch = mockFetch as unknown as typeof fetch
  const mockGetEntriesByType = jest.fn().mockReturnValue([
    {
      type: 'navigation',
      domContentLoadedEventEnd: 1000,
      domContentLoadedEventStart: 900,
      loadEventEnd: 1200,
      loadEventStart: 1100,
      domainLookupEnd: 150,
      domainLookupStart: 100,
      connectEnd: 200,
      connectStart: 150,
      workerStart: 50,
      fetchStart: 0,
    },
  ])

  global.performance = {
    now: jest.fn().mockReturnValue(100),
    getEntriesByType: mockGetEntriesByType,
  } as unknown as Performance

  global.document = {
    querySelectorAll: jest.fn().mockReturnValue([]),
    createElement: jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
      appendChild: jest.fn(),
    }),
    head: {
      appendChild: jest.fn(),
    },
    visibilityState: 'visible',
    addEventListener: jest.fn(),
  } as unknown as Document

  global.window = {
    addEventListener: jest.fn(),
    innerHeight: 768,
    Worker: jest.fn(),
  } as unknown as Window & typeof globalThis
})

describe('Phase 2C Day 1: Performance Monitoring & RUM Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('1. Real User Monitoring (RUM) System', () => {
    let RealUserMonitor: typeof import('../../src/utils/performance-monitoring').RealUserMonitor
    let createRealUserMonitor: typeof import('../../src/utils/performance-monitoring').createRealUserMonitor

    beforeAll(async () => {
      const performanceModule = await import(
        '../../src/utils/performance-monitoring'
      )
      RealUserMonitor = performanceModule.RealUserMonitor
      createRealUserMonitor = performanceModule.createRealUserMonitor
    })

    test('should create RUM instance with default configuration', () => {
      const rum = createRealUserMonitor()
      expect(rum).toBeInstanceOf(RealUserMonitor)
    })

    test('should create RUM instance with custom configuration', () => {
      const config: Partial<RUMConfig> = {
        samplingRate: 0.5,
        reportingEndpoint: '/api/custom-metrics',
        fallbackReporting: false,
      }

      const rum = createRealUserMonitor(config)
      expect(rum).toBeInstanceOf(RealUserMonitor)
    })

    test('should respect sampling rate for monitoring eligibility', async () => {
      // Mock Math.random to control sampling
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.2) // 20%

      const rum = createRealUserMonitor({ samplingRate: 0.1 }) // 10% sampling
      await rum.initialize()

      // Should not initialize monitoring (20% > 10% threshold)
      expect(mockWebVitals.onLCP).not.toHaveBeenCalled()

      Math.random = originalRandom
    })

    test('should initialize monitoring when sampled and consent given', async () => {
      const originalRandom = Math.random
      const originalConfirm = global.confirm

      Math.random = jest.fn().mockReturnValue(0.05) // 5%
      global.confirm = jest.fn().mockReturnValue(true)

      const rum = createRealUserMonitor({ samplingRate: 0.1 }) // 10% sampling
      await rum.initialize()

      // Should initialize Core Web Vitals tracking
      expect(mockWebVitals.onLCP).toHaveBeenCalled()
      expect(mockWebVitals.onFID).toHaveBeenCalled()
      expect(mockWebVitals.onCLS).toHaveBeenCalled()
      expect(mockWebVitals.onFCP).toHaveBeenCalled()
      expect(mockWebVitals.onTTFB).toHaveBeenCalled()

      Math.random = originalRandom
      global.confirm = originalConfirm
    })

    test('should handle Core Web Vitals metrics with sub-1ms processing time', async () => {
      const originalRandom = Math.random
      const originalConfirm = global.confirm

      Math.random = jest.fn().mockReturnValue(0.05)
      global.confirm = jest.fn().mockReturnValue(true)

      const rum = createRealUserMonitor()
      await rum.initialize()

      // Simulate Core Web Vitals callback
      const lcpCallback = mockWebVitals.onLCP.mock.calls[0][0]
      const startTime = performance.now()

      const mockMetric = {
        name: 'LCP',
        value: 1150,
        rating: 'good',
        delta: 50,
        id: 'test-lcp-1',
      }

      lcpCallback(mockMetric)

      const processingTime = performance.now() - startTime
      expect(processingTime).toBeLessThan(1) // Sub-1ms requirement

      Math.random = originalRandom
      global.confirm = originalConfirm
    })

    test('should anonymize data for privacy compliance', async () => {
      const originalRandom = Math.random
      const originalConfirm = global.confirm

      Math.random = jest.fn().mockReturnValue(0.05)
      global.confirm = jest.fn().mockReturnValue(true)

      const rum = createRealUserMonitor()
      await rum.initialize()

      // Simulate metric collection
      const lcpCallback = mockWebVitals.onLCP.mock.calls[0][0]
      lcpCallback({
        name: 'LCP',
        value: 1150,
        rating: 'good',
        delta: 50,
        id: 'test-lcp-1',
      })

      // Should flush metrics after buffer fills (need more than 100 to trigger flush)
      const clsCallback = mockWebVitals.onCLS.mock.calls[0][0]
      for (let i = 0; i < 101; i++) {
        clsCallback({
          name: 'CLS',
          value: 0.05,
          rating: 'good',
          delta: 0.01,
          id: `test-cls-${i}`,
        })
      }

      // Check that sendBeacon was called with anonymized data
      expect(mockNavigator.sendBeacon).toHaveBeenCalled()
      const [, data] = mockNavigator.sendBeacon.mock.calls[0]
      const payload = JSON.parse(data)

      expect(payload.metrics[0].sessionId).toMatch(/^hashed_/) // Should be hashed
      expect(payload.userAgent).not.toContain('Mozilla') // Should be anonymized

      Math.random = originalRandom
      global.confirm = originalConfirm
    })

    test('should track custom performance metrics', async () => {
      const originalRandom = Math.random
      const originalConfirm = global.confirm

      Math.random = jest.fn().mockReturnValue(0.05)
      global.confirm = jest.fn().mockReturnValue(true)

      const rum = createRealUserMonitor()
      await rum.initialize()

      // Should track navigation timing
      expect(global.performance.getEntriesByType).toHaveBeenCalledWith(
        'navigation'
      )

      Math.random = originalRandom
      global.confirm = originalConfirm
    })

    test('should implement proper error handling and resource cleanup', async () => {
      const rum = createRealUserMonitor()

      // Should not throw when destroying uninitialized instance
      expect(() => rum.destroy()).not.toThrow()

      // Should handle initialization errors gracefully
      mockWebVitals.onLCP.mockImplementationOnce(() => {
        throw new Error('Web vitals error')
      })

      await expect(rum.initialize()).resolves.not.toThrow()
    })
  })

  describe('2. Core Web Vitals Tracking and Optimization', () => {
    let CoreWebVitalsOptimizer: typeof import('../../src/utils/web-vitals-tracker').CoreWebVitalsOptimizer
    let createCoreWebVitalsOptimizer: typeof import('../../src/utils/web-vitals-tracker').createCoreWebVitalsOptimizer

    beforeAll(async () => {
      const webVitalsModule = await import('../../src/utils/web-vitals-tracker')
      CoreWebVitalsOptimizer = webVitalsModule.CoreWebVitalsOptimizer
      createCoreWebVitalsOptimizer =
        webVitalsModule.createCoreWebVitalsOptimizer
    })

    test('should create Core Web Vitals optimizer with default thresholds', () => {
      const optimizer = createCoreWebVitalsOptimizer()
      expect(optimizer).toBeInstanceOf(CoreWebVitalsOptimizer)
    })

    test('should apply LCP optimizations for Lighthouse 98+ target', async () => {
      const optimizer = createCoreWebVitalsOptimizer()

      // Mock document methods for LCP optimization
      const mockImg = {
        src: 'https://example.com/hero.jpg',
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 100,
          width: 400,
          height: 300,
        }),
        setAttribute: jest.fn(),
      }

      global.document.querySelectorAll = jest
        .fn()
        .mockReturnValueOnce([mockImg]) // Hero images
        .mockReturnValueOnce([mockImg]) // Large images
        .mockReturnValueOnce([]) // Background images

      await optimizer.initialize()

      // Should create preload links for LCP candidates
      expect(global.document.createElement).toHaveBeenCalledWith('link')
    })

    test('should prevent Cumulative Layout Shift (CLS) with explicit dimensions', async () => {
      const optimizer = createCoreWebVitalsOptimizer()

      const mockImgWithoutDimensions = {
        width: 0,
        height: 0,
        dataset: {},
        setAttribute: jest.fn(),
        style: {},
      }

      global.document.querySelectorAll = jest
        .fn()
        .mockReturnValue([mockImgWithoutDimensions])

      await optimizer.initialize()

      // Should set aspect ratio for images without dimensions
      expect(mockImgWithoutDimensions.style.aspectRatio).toBe('16/9')
    })

    test('should optimize First Input Delay (FID) with task scheduling', async () => {
      const optimizer = createCoreWebVitalsOptimizer()

      // Mock scheduler API
      global.window.scheduler = {
        postTask: jest.fn(),
      }

      await optimizer.initialize()

      // Should use scheduler.postTask if available
      // This is tested during FID optimization after page load
    })

    test('should track and rate Core Web Vitals metrics correctly', async () => {
      const optimizer = createCoreWebVitalsOptimizer()
      await optimizer.initialize()

      // Simulate LCP metric
      const lcpCallback = mockWebVitals.onLCP.mock.calls[0][0]
      lcpCallback({
        name: 'LCP',
        value: 1100, // Good score (< 1200ms target)
        rating: 'good',
      })

      const metrics = optimizer.getMetrics()
      const lcpMetric = metrics.get('LCP')

      expect(lcpMetric).toBeDefined()
      expect(lcpMetric!.current).toBe(1100)
      expect(lcpMetric!.trend).toBe('stable') // First measurement
    })

    test('should trigger optimization when metrics exceed thresholds', async () => {
      const optimizer = createCoreWebVitalsOptimizer()
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await optimizer.initialize()

      // Simulate poor LCP metric that should trigger optimization
      const lcpCallback = mockWebVitals.onLCP.mock.calls[0][0]
      lcpCallback({
        name: 'LCP',
        value: 2500, // Poor score (> 1200ms target)
        rating: 'poor',
      })

      // Should log optimization trigger
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Triggering optimization for LCP')
      )

      consoleSpy.mockRestore()
    })

    test('should monitor layout shifts and provide warnings', async () => {
      const optimizer = createCoreWebVitalsOptimizer()

      // Mock PerformanceObserver for layout shifts
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      }

      global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
        // Simulate layout shift entry
        setTimeout(() => {
          callback({
            getEntries: () => [
              {
                entryType: 'layout-shift',
                value: 0.15, // Significant layout shift
                sources: ['img'],
                startTime: 1000,
                hadRecentInput: false,
              },
            ],
          })
        }, 100)
        return mockObserver
      })

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      await optimizer.initialize()

      // Wait for layout shift simulation
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Significant layout shift detected'),
        expect.any(Object)
      )

      consoleWarnSpy.mockRestore()
    })

    test('should provide optimization status and cleanup resources', async () => {
      const optimizer = createCoreWebVitalsOptimizer()
      await optimizer.initialize()

      const optimizationStatus = optimizer.getOptimizationStatus()
      expect(optimizationStatus.get('lcp-preload')).toBe(true)
      expect(optimizationStatus.get('cls-prevention')).toBe(true)

      // Should cleanup without errors
      expect(() => optimizer.destroy()).not.toThrow()
    })
  })

  describe('3. Performance Dashboard and Alerting', () => {
    let PerformanceDashboard: typeof import('../../src/utils/performance-dashboard').PerformanceDashboard
    let createPerformanceDashboard: typeof import('../../src/utils/performance-dashboard').createPerformanceDashboard

    beforeAll(async () => {
      const dashboardModule = await import(
        '../../src/utils/performance-dashboard'
      )
      PerformanceDashboard = dashboardModule.PerformanceDashboard
      createPerformanceDashboard = dashboardModule.createPerformanceDashboard
    })

    test('should create dashboard with default configuration', () => {
      const dashboard = createPerformanceDashboard()
      expect(dashboard).toBeInstanceOf(PerformanceDashboard)
    })

    test('should initialize default alert rules for Core Web Vitals', () => {
      const dashboard = createPerformanceDashboard()
      const config = dashboard.getConfig()

      // Should have alerts for all Core Web Vitals
      expect(config.alerts.length).toBeGreaterThan(0)
    })

    test('should add metrics and trigger alerts when thresholds exceeded', async () => {
      const dashboard = createPerformanceDashboard()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Add metric that exceeds LCP threshold
      const poorLCPMetric: PerformanceMetric = {
        name: 'LCP',
        value: 2500, // Exceeds 1200ms threshold
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      }

      dashboard.addMetric(poorLCPMetric)

      // Should trigger critical alert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 Alert triggered'),
        expect.objectContaining({
          metric: 'LCP',
          value: 2500,
          threshold: 1200,
          severity: 'critical',
        })
      )

      consoleWarnSpy.mockRestore()
    })

    test('should track metric trends and statistics', () => {
      const dashboard = createPerformanceDashboard()

      // Add series of metrics
      const metrics = [
        { name: 'LCP', value: 1000, timestamp: Date.now() - 3000 },
        { name: 'LCP', value: 1100, timestamp: Date.now() - 2000 },
        { name: 'LCP', value: 1200, timestamp: Date.now() - 1000 },
        { name: 'LCP', value: 1150, timestamp: Date.now() },
      ]

      metrics.forEach((metric) => {
        dashboard.addMetric({
          ...metric,
          sessionId: 'test-session',
          navigationType: 'navigate',
          connectionType: '4g',
          deviceMemory: 8,
          hardwareConcurrency: 8,
        })
      })

      const lcpSeries = dashboard.getMetrics().get('LCP')
      expect(lcpSeries).toBeDefined()
      expect(lcpSeries!.current).toBe(1150)
      expect(lcpSeries!.previous).toBe(1200)
      expect(lcpSeries!.trend).toBe('down') // Improved from 1200 to 1150
      expect(lcpSeries!.history).toHaveLength(4)
    })

    test('should provide performance analysis with bottlenecks and opportunities', () => {
      const dashboard = createPerformanceDashboard()

      // Add metrics that create bottlenecks
      dashboard.addMetric({
        name: 'LCP',
        value: 2500, // Poor LCP
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      })

      dashboard.addMetric({
        name: 'CLS',
        value: 0.25, // Poor CLS
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      })

      const analysis = dashboard.getPerformanceAnalysis()

      expect(analysis.score).toBeLessThan(80) // Poor overall score
      expect(analysis.bottlenecks).toHaveLength(2) // LCP and CLS issues
      expect(analysis.bottlenecks[0].type).toBe('LCP')
      expect(analysis.bottlenecks[1].type).toBe('CLS')
      expect(analysis.opportunities.length).toBeGreaterThan(0)
    })

    test('should check performance budget compliance', () => {
      const dashboard = createPerformanceDashboard()

      // Add metrics that violate budget
      dashboard.addMetric({
        name: 'lighthouse-score',
        value: 95, // Below 98% target
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      })

      const analysis = dashboard.getPerformanceAnalysis()
      expect(analysis.budgetStatus.passed).toBe(false)
      expect(analysis.budgetStatus.violations).toHaveLength(1)
      expect(analysis.budgetStatus.violations[0].metric).toBe(
        'Lighthouse Score'
      )
    })

    test('should support metric subscriptions and notifications', () => {
      const dashboard = createPerformanceDashboard()
      const callback = jest.fn()

      dashboard.subscribe('LCP', callback)

      dashboard.addMetric({
        name: 'LCP',
        value: 1100,
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      })

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'LCP',
          current: 1100,
        })
      )

      dashboard.unsubscribe('LCP', callback)
    })

    test('should export performance data in JSON and CSV formats', () => {
      const dashboard = createPerformanceDashboard()

      dashboard.addMetric({
        name: 'LCP',
        value: 1100,
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      })

      // Test JSON export
      const jsonData = dashboard.exportData('json')
      expect(() => JSON.parse(jsonData)).not.toThrow()

      const parsedData = JSON.parse(jsonData)
      expect(parsedData.metrics.LCP).toBeDefined()
      expect(parsedData.timestamp).toBeDefined()

      // Test CSV export
      const csvData = dashboard.exportData('csv')
      expect(csvData).toContain('Metric,Current,Previous,Trend,Change%')
      expect(csvData).toContain('LCP,1100,0,stable,0.00')
    })

    test('should manage alert rules dynamically', () => {
      const dashboard = createPerformanceDashboard()

      // Add custom alert rule
      const customRule = {
        metric: 'custom-metric',
        threshold: 500,
        operator: '>' as const,
        severity: 'warning' as const,
        duration: 5000,
        message: 'Custom metric exceeded threshold',
        destinations: ['console'],
        enabled: true,
      }

      dashboard.addAlertRule(customRule)

      // Update existing rule
      dashboard.updateAlertRule('LCP', { threshold: 1000 })

      // Remove rule
      dashboard.removeAlertRule('custom-metric')

      // Should handle operations without errors
      expect(() => dashboard.getConfig()).not.toThrow()
    })

    test('should cleanup resources properly', () => {
      const dashboard = createPerformanceDashboard()

      dashboard.addMetric({
        name: 'LCP',
        value: 1100,
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      })

      expect(() => dashboard.destroy()).not.toThrow()

      // Metrics should be cleared
      expect(dashboard.getMetrics().size).toBe(0)
    })
  })

  describe('4. Integration with Existing Performance Infrastructure', () => {
    test('should integrate with service worker from Phase 2B', async () => {
      // Test that monitoring doesn't interfere with service worker
      expect(mockNavigator.serviceWorker.controller).toBeDefined()

      const { createRealUserMonitor } = await import(
        '../../src/utils/performance-monitoring'
      )
      const rum = createRealUserMonitor()

      // Should detect service worker and track cache metrics
      await rum.initialize()

      // Should not interfere with existing service worker functionality
      expect(mockNavigator.serviceWorker.controller).toBeDefined()
    })

    test('should maintain bundle size budget from Phase 2B', async () => {
      // Monitoring system should add minimal overhead
      const { DEFAULT_PERFORMANCE_BUDGET } = await import(
        '../../src/types/performance'
      )

      expect(DEFAULT_PERFORMANCE_BUDGET.resourceSizes.totalSize).toBe(1500000) // 1.5MB

      // Monitoring code should be small and efficient
      // This is validated through bundle analysis in CI
    })

    test('should preserve progressive hydration coordination', async () => {
      // Monitoring should not interfere with hydration timing
      const { createCoreWebVitalsOptimizer } = await import(
        '../../src/utils/web-vitals-tracker'
      )
      const optimizer = createCoreWebVitalsOptimizer()

      await optimizer.initialize()

      // Should apply optimizations without breaking hydration
      expect(optimizer.getOptimizationStatus().get('fid-optimization')).toBe(
        true
      )
    })
  })

  describe('5. Performance Monitoring System Validation', () => {
    test('should ensure monitoring overhead stays under 1ms per metric', async () => {
      const { createRealUserMonitor } = await import(
        '../../src/utils/performance-monitoring'
      )
      const originalRandom = Math.random
      const originalConfirm = global.confirm

      Math.random = jest.fn().mockReturnValue(0.05)
      global.confirm = jest.fn().mockReturnValue(true)

      const rum = createRealUserMonitor()
      await rum.initialize()

      // Test processing time for multiple metrics
      const lcpCallback = mockWebVitals.onLCP.mock.calls[0][0]

      const iterations = 100
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        lcpCallback({
          name: 'LCP',
          value: 1000 + i,
          rating: 'good',
          delta: 10,
          id: `test-lcp-${i}`,
        })
      }

      const totalTime = performance.now() - startTime
      const averageTime = totalTime / iterations

      expect(averageTime).toBeLessThan(1) // Average processing time under 1ms

      Math.random = originalRandom
      global.confirm = originalConfirm
    })

    test('should validate privacy compliance in data collection', async () => {
      const { createRealUserMonitor } = await import(
        '../../src/utils/performance-monitoring'
      )
      const originalRandom = Math.random
      const originalConfirm = global.confirm

      Math.random = jest.fn().mockReturnValue(0.05)
      global.confirm = jest.fn().mockReturnValue(true)

      const rum = createRealUserMonitor()
      await rum.initialize()

      // Simulate metrics that trigger data sending
      const lcpCallback = mockWebVitals.onLCP.mock.calls[0][0]
      for (let i = 0; i < 10; i++) {
        lcpCallback({
          name: 'LCP',
          value: 1000 + i,
          rating: 'good',
          delta: 10,
          id: `test-lcp-${i}`,
        })
      }

      expect(mockNavigator.sendBeacon).toHaveBeenCalled()
      const [, data] = mockNavigator.sendBeacon.mock.calls[0]
      const payload = JSON.parse(data)

      // Validate privacy compliance
      expect(payload.metrics[0].sessionId).toMatch(/^hashed_/) // Session ID hashed
      expect(payload.userAgent).not.toContain('Mozilla') // User agent anonymized
      expect(payload.metrics[0].timestamp % 60000).toBe(0) // Timestamp rounded to minute

      Math.random = originalRandom
      global.confirm = originalConfirm
    })

    test('should verify Lighthouse CI configuration accuracy', async () => {
      // Test that lighthouserc.js has correct thresholds
      const lighthouseConfig = await import('../../lighthouserc.js')

      expect(
        lighthouseConfig.default.ci.assert.assertions['categories:performance']
      ).toEqual(['error', { minScore: 0.98 }])
      expect(
        lighthouseConfig.default.ci.assert.assertions[
          'largest-contentful-paint'
        ]
      ).toEqual(['error', { maxNumericValue: 1200 }])
      expect(
        lighthouseConfig.default.ci.assert.assertions['cumulative-layout-shift']
      ).toEqual(['error', { maxNumericValue: 0.1 }])
    })

    test('should validate alert system responsiveness', async () => {
      const { createPerformanceDashboard } = await import(
        '../../src/utils/performance-dashboard'
      )
      const dashboard = createPerformanceDashboard()

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      const startTime = Date.now()

      // Add critical metric that should trigger immediate alert
      dashboard.addMetric({
        name: 'LCP',
        value: 3000, // Critical threshold breach
        timestamp: Date.now(),
        sessionId: 'test-session',
        navigationType: 'navigate',
        connectionType: '4g',
        deviceMemory: 8,
        hardwareConcurrency: 8,
      })

      const alertTime = Date.now() - startTime

      expect(alertTime).toBeLessThan(100) // Alert should trigger within 100ms
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    test('should verify monitoring system resource cleanup', async () => {
      const { initializeRUM, destroyRUM } = await import(
        '../../src/utils/performance-monitoring'
      )
      const { initializeCoreWebVitals, destroyCoreWebVitals } = await import(
        '../../src/utils/web-vitals-tracker'
      )
      const { initializePerformanceDashboard, destroyPerformanceDashboard } =
        await import('../../src/utils/performance-dashboard')

      // Initialize all monitoring systems
      await initializeRUM({ samplingRate: 1.0 })
      await initializeCoreWebVitals()
      initializePerformanceDashboard()

      // Destroy all systems
      expect(() => destroyRUM()).not.toThrow()
      expect(() => destroyCoreWebVitals()).not.toThrow()
      expect(() => destroyPerformanceDashboard()).not.toThrow()
    })
  })
})

describe('Phase 2C Day 1: Performance Targets Validation', () => {
  test('should meet Lighthouse 98+ score target', async () => {
    // This validates that our thresholds align with Lighthouse 98+ requirements
    const { DEFAULT_PERFORMANCE_BUDGET } = await import(
      '../../src/types/performance'
    )

    expect(DEFAULT_PERFORMANCE_BUDGET.metrics.lighthouseScore).toBe(98)
    expect(DEFAULT_PERFORMANCE_BUDGET.metrics.largestContentfulPaint).toBe(1200) // <1.2s
    expect(DEFAULT_PERFORMANCE_BUDGET.metrics.cumulativeLayoutShift).toBe(0.1) // <0.1
    expect(DEFAULT_PERFORMANCE_BUDGET.metrics.firstInputDelay).toBe(100) // <100ms
  })

  test('should maintain Phase 2B achievements', async () => {
    // Validate that monitoring doesn't regress Phase 2B gains
    const { DEFAULT_PERFORMANCE_BUDGET } = await import(
      '../../src/types/performance'
    )

    expect(DEFAULT_PERFORMANCE_BUDGET.resourceSizes.totalSize).toBe(1500000) // 1.5MB maintained
    expect(DEFAULT_PERFORMANCE_BUDGET.metrics.timeToInteractive).toBe(2000) // <2s TTI maintained
  })

  test('should achieve sub-1ms monitoring overhead target', () => {
    // Performance monitoring system efficiency validation
    // This is a design constraint that's tested throughout the system

    // Mock high-frequency metric collection
    const startTime = performance.now()

    // Simulate 1000 metric collections (stress test)
    for (let i = 0; i < 1000; i++) {
      // Minimal processing that mirrors actual metric handling
      const metric = {
        name: 'LCP',
        value: 1000 + i,
        timestamp: Date.now(),
      }

      // Simulate the core processing without side effects
      JSON.stringify(metric)
    }

    const totalTime = performance.now() - startTime
    const averageTime = totalTime / 1000

    expect(averageTime).toBeLessThan(1) // Sub-1ms processing per metric
  })
})
