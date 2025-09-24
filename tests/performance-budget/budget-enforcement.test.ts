// ABOUTME: Comprehensive test suite for performance budget enforcement system
// Tests bundle monitoring, regression detection, and real-world validation integration

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import {
  BundleMonitor,
  DEFAULT_BUNDLE_BUDGET,
  type BundleStats,
} from '../../src/utils/bundle-monitor'
import {
  PerformanceRegressionDetector,
  DEFAULT_REGRESSION_THRESHOLDS,
  type PerformanceMetrics,
  type RegressionAlert,
} from '../../src/utils/regression-detection'
import {
  PerformanceBudgetValidator,
  DEFAULT_PERFORMANCE_BUDGET,
  type BudgetValidationResult,
} from '../../src/utils/performance-budget'

// Mock files for testing
const MOCK_BUILD_DIR = path.join(__dirname, '__mocks__', 'build')
const MOCK_BUNDLE_HISTORY = path.join(
  __dirname,
  '__mocks__',
  '.bundle-history.json'
)
const MOCK_PERFORMANCE_HISTORY = path.join(
  __dirname,
  '__mocks__',
  '.performance-history.json'
)

describe('Performance Budget Enforcement', () => {
  beforeEach(() => {
    // Create mock directories and files
    if (!fs.existsSync(path.dirname(MOCK_BUILD_DIR))) {
      fs.mkdirSync(path.dirname(MOCK_BUILD_DIR), { recursive: true })
    }
    if (!fs.existsSync(MOCK_BUILD_DIR)) {
      fs.mkdirSync(MOCK_BUILD_DIR, { recursive: true })
    }

    // Ensure mock file directory exists
    const mockDir = path.dirname(MOCK_BUNDLE_HISTORY)
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true })
    }

    // Create empty history files
    ;[MOCK_BUNDLE_HISTORY, MOCK_PERFORMANCE_HISTORY].forEach((file) => {
      fs.writeFileSync(file, JSON.stringify([]))
    })
  })

  afterEach(() => {
    // Clean up mock files and directories
    ;[MOCK_BUNDLE_HISTORY, MOCK_PERFORMANCE_HISTORY].forEach((file) => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      } catch {
        // Ignore cleanup errors
      }
    })

    // Clean up mock directory if it exists
    try {
      const mockDir = path.dirname(MOCK_BUNDLE_HISTORY)
      if (fs.existsSync(mockDir)) {
        fs.rmSync(mockDir, { recursive: true, force: true })
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('Bundle Size Monitoring', () => {
    it('should detect bundle size within budget', async () => {
      const monitor = new BundleMonitor(
        DEFAULT_BUNDLE_BUDGET,
        MOCK_BUNDLE_HISTORY
      )

      // Create mock bundle stats within budget
      const mockStats: BundleStats = {
        totalSize: 1400000, // 1.4MB - within 1.5MB budget
        gzippedSize: 420000, // 420KB - within 450KB budget
        chunks: [
          { name: 'main', size: 250000, type: 'initial' },
          { name: 'async-1', size: 150000, type: 'async' },
        ],
        assets: [
          { name: 'main.js', size: 400000, type: 'js' },
          { name: 'styles.css', size: 80000, type: 'css' },
          { name: 'image.webp', size: 300000, type: 'image' },
          { name: 'font.woff2', size: 140000, type: 'font' },
        ],
        timestamp: new Date().toISOString(),
        gitCommit: 'abc123',
      }

      const alerts = await monitor.validateBundle(mockStats)

      expect(alerts).toHaveLength(0)
    })

    it('should detect bundle size violations', async () => {
      const monitor = new BundleMonitor(
        DEFAULT_BUNDLE_BUDGET,
        MOCK_BUNDLE_HISTORY
      )

      // Create mock bundle stats exceeding budget
      const mockStats: BundleStats = {
        totalSize: 5500000, // 5.5MB - exceeds 5.2MB budget
        gzippedSize: 1600000, // 1.6MB - exceeds 1.5MB budget
        chunks: [
          { name: 'main', size: 700000, type: 'initial' }, // Exceeds 600KB limit
          { name: 'async-1', size: 350000, type: 'async' }, // Exceeds 300KB limit
        ],
        assets: [
          { name: 'main.js', size: 4800000, type: 'js' }, // Exceeds 4.5MB limit
          { name: 'styles.css', size: 250000, type: 'css' }, // Exceeds 200KB limit
          { name: 'image.webp', size: 300000, type: 'image' },
          { name: 'font.woff2', size: 150000, type: 'font' },
        ],
        timestamp: new Date().toISOString(),
        gitCommit: 'def456',
      }

      const alerts = await monitor.validateBundle(mockStats)

      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts.some((alert) => alert.category === 'size_limit')).toBe(true)
      expect(alerts.some((alert) => alert.type === 'error')).toBe(true)
    })

    it('should detect regression against historical data', async () => {
      const monitor = new BundleMonitor(
        DEFAULT_BUNDLE_BUDGET,
        MOCK_BUNDLE_HISTORY
      )

      // Create baseline history
      const baselineStats: BundleStats = {
        totalSize: 4000000, // 4.0MB baseline
        gzippedSize: 1200000,
        chunks: [],
        assets: [],
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        gitCommit: 'baseline123',
      }

      await monitor.saveToHistory(baselineStats)

      // Create current stats with regression
      const currentStats: BundleStats = {
        totalSize: 4420000, // 4.42MB - 10.5% increase (exceeds 10% threshold)
        gzippedSize: 1326000,
        chunks: [],
        assets: [],
        timestamp: new Date().toISOString(),
        gitCommit: 'current456',
      }

      const alerts = await monitor.validateBundle(currentStats)

      expect(alerts.some((alert) => alert.category === 'regression')).toBe(true)
      expect(
        alerts.some(
          (alert) => alert.type === 'error' && alert.category === 'regression'
        )
      ).toBe(true)
    })

    it('should generate comprehensive bundle report', async () => {
      const monitor = new BundleMonitor(
        DEFAULT_BUNDLE_BUDGET,
        MOCK_BUNDLE_HISTORY
      )

      const mockStats: BundleStats = {
        totalSize: 1400000,
        gzippedSize: 420000,
        chunks: [{ name: 'main', size: 250000, type: 'initial' }],
        assets: [{ name: 'main.js', size: 400000, type: 'js' }],
        timestamp: new Date().toISOString(),
        gitCommit: 'abc123',
      }

      const alerts = await monitor.validateBundle(mockStats)
      const report = monitor.generateReport(mockStats, alerts)

      expect(report).toContain('Bundle Size Report')
      expect(report).toContain('1.34 MB') // Total size formatting (based on actual calculation)
      expect(report).toContain('410.16 KB') // Gzipped size formatting (based on actual calculation)
      expect(report).toContain('main') // Asset listing
    })
  })

  describe('Performance Regression Detection', () => {
    it('should detect critical performance regressions', async () => {
      const detector = new PerformanceRegressionDetector(
        DEFAULT_REGRESSION_THRESHOLDS,
        MOCK_PERFORMANCE_HISTORY
      )

      // Create baseline history
      const baselineMetrics: PerformanceMetrics[] = Array.from(
        { length: 15 },
        (_, i) => ({
          timestamp: new Date(Date.now() - (15 - i) * 86400000).toISOString(),
          buildId: `build-${i}`,
          gitCommit: `commit-${i}`,
          lighthouse: {
            performanceScore: 0.98, // 98% baseline
            lcp: 900, // 900ms baseline
            cls: 0.04, // 0.04 baseline
            fid: 80, // 80ms baseline
            tbt: 120, // 120ms baseline
            speedIndex: 1200,
          },
          bundleSize: {
            totalSize: 1400000, // 1.4MB baseline
            gzippedSize: 420000,
            javascriptSize: 750000,
            cssSize: 90000,
          },
          deployment: {
            environment: 'production',
            deployedAt: new Date(
              Date.now() - (15 - i) * 86400000
            ).toISOString(),
          },
        })
      )

      // Save baseline history
      for (const metrics of baselineMetrics) {
        await detector.saveMetricsToHistory(metrics)
      }

      // Create current metrics with critical regression
      const currentMetrics: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        buildId: 'current-build',
        gitCommit: 'current-commit',
        lighthouse: {
          performanceScore: 0.92, // 92% - below 95% critical threshold
          lcp: 1350, // 1350ms - 50% increase (critical)
          cls: 0.08, // 0.08 - 100% increase (critical)
          fid: 120, // 120ms - 50% increase (critical)
          tbt: 180, // 180ms - 50% increase (critical)
          speedIndex: 1600,
        },
        bundleSize: {
          totalSize: 1680000, // 1.68MB - 20% increase (critical)
          gzippedSize: 504000,
          javascriptSize: 975000, // 30% increase (critical)
          cssSize: 117000, // 30% increase (critical)
        },
        deployment: {
          environment: 'production',
          deployedAt: new Date().toISOString(),
        },
      }

      const alerts = await detector.analyzeRegression(currentMetrics)

      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts.some((alert) => alert.type === 'critical')).toBe(true)
      expect(
        alerts.some((alert) => alert.recommendedAction === 'rollback')
      ).toBe(true)
      expect(alerts.some((alert) => alert.metric === 'Performance Score')).toBe(
        true
      )
    })

    it('should detect performance improvements', async () => {
      const detector = new PerformanceRegressionDetector(
        DEFAULT_REGRESSION_THRESHOLDS,
        MOCK_PERFORMANCE_HISTORY
      )

      // Create sufficient baseline history (10+ data points)
      const baselineTemplate = {
        lighthouse: {
          performanceScore: 0.96, // 96% baseline
          lcp: 1200, // 1200ms baseline
          cls: 0.08, // 0.08 baseline
          fid: 100,
          tbt: 150,
          speedIndex: 1400,
        },
        bundleSize: {
          totalSize: 1600000, // 1.6MB baseline
          gzippedSize: 480000,
          javascriptSize: 850000,
          cssSize: 110000,
        },
        deployment: {
          environment: 'production',
        },
      }

      // Add 12 historical data points with slight variations
      for (let i = 12; i >= 1; i--) {
        const variation = 1 + (Math.random() - 0.5) * 0.05 // ±2.5% variation
        const baselineMetrics: PerformanceMetrics = {
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          buildId: `baseline-build-${i}`,
          gitCommit: `baseline-commit-${i}`,
          lighthouse: {
            performanceScore:
              baselineTemplate.lighthouse.performanceScore * variation,
            lcp: baselineTemplate.lighthouse.lcp * variation,
            cls: baselineTemplate.lighthouse.cls * variation,
            fid: baselineTemplate.lighthouse.fid * variation,
            tbt: baselineTemplate.lighthouse.tbt * variation,
            speedIndex: baselineTemplate.lighthouse.speedIndex * variation,
          },
          bundleSize: {
            totalSize: Math.round(
              baselineTemplate.bundleSize.totalSize * variation
            ),
            gzippedSize: Math.round(
              baselineTemplate.bundleSize.gzippedSize * variation
            ),
            javascriptSize: Math.round(
              baselineTemplate.bundleSize.javascriptSize * variation
            ),
            cssSize: Math.round(
              baselineTemplate.bundleSize.cssSize * variation
            ),
          },
          deployment: {
            environment: 'production',
            deployedAt: new Date(Date.now() - i * 86400000).toISOString(),
          },
        }
        await detector.saveMetricsToHistory(baselineMetrics)
      }

      // Create current metrics with improvements
      const currentMetrics: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        buildId: 'improved-build',
        gitCommit: 'improved-commit',
        lighthouse: {
          performanceScore: 0.99, // 99% - 3% improvement
          lcp: 950, // 950ms - 20% improvement
          cls: 0.03, // 0.03 - 62% improvement
          fid: 70, // 70ms - 30% improvement
          tbt: 100, // 100ms - 33% improvement
          speedIndex: 1100,
        },
        bundleSize: {
          totalSize: 1350000, // 1.35MB - 15% reduction
          gzippedSize: 405000,
          javascriptSize: 700000, // 17% reduction
          cssSize: 85000, // 22% reduction
        },
        deployment: {
          environment: 'production',
          deployedAt: new Date().toISOString(),
        },
      }

      const alerts = await detector.analyzeRegression(currentMetrics)

      expect(alerts.some((alert) => alert.type === 'improvement')).toBe(true)
      expect(
        alerts.some((alert) => alert.recommendedAction === 'celebrate')
      ).toBe(true)
    })

    it('should generate regression analysis report', async () => {
      const detector = new PerformanceRegressionDetector(
        DEFAULT_REGRESSION_THRESHOLDS,
        MOCK_PERFORMANCE_HISTORY
      )

      const mockMetrics: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        buildId: 'test-build',
        gitCommit: 'test-commit',
        lighthouse: {
          performanceScore: 0.98,
          lcp: 900,
          cls: 0.04,
          fid: 80,
          tbt: 120,
          speedIndex: 1200,
        },
        bundleSize: {
          totalSize: 1400000,
          gzippedSize: 420000,
          javascriptSize: 750000,
          cssSize: 90000,
        },
        deployment: {
          environment: 'development',
          deployedAt: new Date().toISOString(),
        },
      }

      const mockAlerts: RegressionAlert[] = [
        {
          type: 'minor',
          metric: 'LCP',
          severity: 3,
          message: 'LCP regression detected',
          details: {
            current: 950,
            baseline: 900,
            change: 50,
            changePercentage: 5.6,
            threshold: 25,
            isStatisticallySignificant: true,
          },
          recommendedAction: 'investigate',
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        },
      ]

      const report = detector.generateRegressionReport(mockAlerts, mockMetrics)

      expect(report).toContain('Performance Regression Analysis Report')
      expect(report).toContain('test-build')
      expect(report).toContain('test-commit')
      expect(report).toContain('LCP regression detected')
      expect(report).toContain('Minor Regressions: 1')
    })
  })

  describe('Performance Budget Validation', () => {
    it('should validate complete performance budget successfully', async () => {
      const validator = new PerformanceBudgetValidator(
        DEFAULT_PERFORMANCE_BUDGET
      )

      // Mock Lighthouse results within budget
      const mockLighthouseResults = {
        categories: {
          performance: { score: 0.99 }, // 99% - above 98% target
          accessibility: { score: 0.96 }, // 96% - above 95% target
          bestPractices: { score: 0.97 }, // 97% - above 95% target
          seo: { score: 0.98 }, // 98% - above 95% target
        },
        audits: {
          'largest-contentful-paint': { numericValue: 950 }, // 950ms - below 1000ms target
          'cumulative-layout-shift': { numericValue: 0.04 }, // 0.04 - below 0.05 target
          'first-contentful-paint': { numericValue: 1100 }, // 1100ms - below 1200ms target
          'total-blocking-time': { numericValue: 180 }, // 180ms - below 200ms target
        },
      }

      // Mock bundle stats within budget
      const mockBundleStats: BundleStats = {
        totalSize: 1400000, // 1.4MB - below 1.5MB target
        gzippedSize: 420000, // 420KB - below 450KB target
        chunks: [],
        assets: [
          { name: 'main.js', size: 700000, type: 'js' }, // 700KB - below 800KB target
          { name: 'styles.css', size: 80000, type: 'css' }, // 80KB - below 100KB target
          { name: 'image.webp', size: 350000, type: 'image' }, // 350KB - below 400KB target
          { name: 'font.woff2', size: 150000, type: 'font' }, // 150KB - below 200KB target
        ],
        timestamp: new Date().toISOString(),
      }

      const result = await validator.validatePerformanceBudget(
        mockLighthouseResults,
        mockBundleStats
      )

      expect(result.passed).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(90)
      expect(
        result.violations.filter((v) => v.severity === 'critical')
      ).toHaveLength(0)
    })

    it('should detect performance budget violations', async () => {
      const validator = new PerformanceBudgetValidator(
        DEFAULT_PERFORMANCE_BUDGET
      )

      // Mock Lighthouse results with violations
      const mockLighthouseResults = {
        categories: {
          performance: { score: 0.94 }, // 94% - below 98% target
          accessibility: { score: 0.92 }, // 92% - below 95% target
          bestPractices: { score: 0.9 }, // 90% - below 95% target
          seo: { score: 0.88 }, // 88% - below 95% target
        },
        audits: {
          'largest-contentful-paint': { numericValue: 1350 }, // 1350ms - above 1000ms target
          'cumulative-layout-shift': { numericValue: 0.08 }, // 0.08 - above 0.05 target
          'first-contentful-paint': { numericValue: 1400 }, // 1400ms - above 1200ms target
          'total-blocking-time': { numericValue: 280 }, // 280ms - above 200ms target
        },
      }

      // Mock bundle stats with violations
      const mockBundleStats: BundleStats = {
        totalSize: 1700000, // 1.7MB - above 1.5MB target
        gzippedSize: 510000, // 510KB - above 450KB target
        chunks: [],
        assets: [
          { name: 'main.js', size: 950000, type: 'js' }, // 950KB - above 800KB target
          { name: 'styles.css', size: 130000, type: 'css' }, // 130KB - above 100KB target
          { name: 'image.webp', size: 450000, type: 'image' }, // 450KB - above 400KB target
          { name: 'font.woff2', size: 250000, type: 'font' }, // 250KB - above 200KB target
        ],
        timestamp: new Date().toISOString(),
      }

      const result = await validator.validatePerformanceBudget(
        mockLighthouseResults,
        mockBundleStats
      )

      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.violations.some((v) => v.category === 'lighthouse')).toBe(
        true
      )
      expect(
        result.violations.some((v) => v.category === 'core_web_vitals')
      ).toBe(true)
      expect(result.violations.some((v) => v.category === 'bundle_size')).toBe(
        true
      )
    })

    it('should generate actionable recommendations', async () => {
      const validator = new PerformanceBudgetValidator(
        DEFAULT_PERFORMANCE_BUDGET
      )

      // Mock violations requiring different optimization strategies
      const mockLighthouseResults = {
        categories: {
          performance: { score: 0.94 },
        },
        audits: {
          'largest-contentful-paint': { numericValue: 1350 },
          'cumulative-layout-shift': { numericValue: 0.08 },
        },
      }

      const mockBundleStats: BundleStats = {
        totalSize: 1700000,
        gzippedSize: 510000,
        chunks: [],
        assets: [
          { name: 'main.js', size: 950000, type: 'js' },
          { name: 'styles.css', size: 130000, type: 'css' },
        ],
        timestamp: new Date().toISOString(),
      }

      const result = await validator.validatePerformanceBudget(
        mockLighthouseResults,
        mockBundleStats
      )

      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(
        result.recommendations.some((r) => r.includes('Core Web Vitals'))
      ).toBe(true)
      expect(
        result.recommendations.some((r) => r.includes('Bundle Size'))
      ).toBe(true)
      expect(
        result.recommendations.some((r) =>
          r.includes('Largest Contentful Paint')
        )
      ).toBe(true)
      expect(result.recommendations.some((r) => r.includes('JavaScript'))).toBe(
        true
      )
    })

    it('should generate comprehensive budget report', async () => {
      const validator = new PerformanceBudgetValidator(
        DEFAULT_PERFORMANCE_BUDGET
      )

      const mockResult: BudgetValidationResult = {
        passed: false,
        score: 75,
        violations: [
          {
            category: 'core_web_vitals',
            metric: 'LCP',
            current: 1350,
            target: 1000,
            severity: 'major',
            impact: 'LCP is 35% above target',
          },
        ],
        improvements: [
          {
            metric: 'Bundle Size',
            improvement: 100000,
            impact: 'Bundle size is well within budget',
          },
        ],
        recommendations: [
          '🎯 Core Web Vitals Optimization:',
          '  • Optimize Largest Contentful Paint',
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          environment: 'development',
          confidence: 0.9,
        },
      }

      const report = validator.generateBudgetReport(mockResult)

      expect(report).toContain('Performance Budget Validation Report')
      expect(report).toContain('**Overall Score**: 75/100')
      expect(report).toContain('**Status**: ❌ FAILED')
      expect(report).toContain('Budget Violations')
      expect(report).toContain('Performance Improvements')
      expect(report).toContain('Recommendations')
      expect(report).toContain('≤1000ms') // LCP target
    })
  })

  describe('Integration Testing', () => {
    it('should handle complete budget enforcement workflow', async () => {
      // This test validates the entire workflow from bundle analysis to budget validation
      const bundleMonitor = new BundleMonitor(
        DEFAULT_BUNDLE_BUDGET,
        MOCK_BUNDLE_HISTORY
      )
      const regressionDetector = new PerformanceRegressionDetector(
        DEFAULT_REGRESSION_THRESHOLDS,
        MOCK_PERFORMANCE_HISTORY
      )
      const budgetValidator = new PerformanceBudgetValidator(
        DEFAULT_PERFORMANCE_BUDGET
      )

      // Step 1: Analyze bundle
      const mockBundleStats: BundleStats = {
        totalSize: 1400000,
        gzippedSize: 420000,
        chunks: [],
        assets: [
          { name: 'main.js', size: 700000, type: 'js' },
          { name: 'styles.css', size: 80000, type: 'css' },
        ],
        timestamp: new Date().toISOString(),
        gitCommit: 'integration-test',
      }

      const bundleAlerts = await bundleMonitor.validateBundle(mockBundleStats)
      expect(bundleAlerts).toHaveLength(0) // Should pass budget

      // Step 2: Check for regressions (with minimal history)
      const mockMetrics: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        buildId: 'integration-build',
        gitCommit: 'integration-test',
        lighthouse: {
          performanceScore: 0.98,
          lcp: 950,
          cls: 0.04,
          fid: 80,
          tbt: 120,
          speedIndex: 1200,
        },
        bundleSize: {
          totalSize: mockBundleStats.totalSize,
          gzippedSize: mockBundleStats.gzippedSize,
          javascriptSize: 700000,
          cssSize: 80000,
        },
        deployment: {
          environment: 'development',
          deployedAt: new Date().toISOString(),
        },
      }

      await regressionDetector.saveMetricsToHistory(mockMetrics)
      const regressionAlerts =
        await regressionDetector.analyzeRegression(mockMetrics)
      // Should be empty due to insufficient history

      // Step 3: Validate overall budget
      const mockLighthouseResults = {
        categories: {
          performance: { score: 0.98 },
          accessibility: { score: 0.96 },
          bestPractices: { score: 0.97 },
          seo: { score: 0.98 },
        },
        audits: {
          'largest-contentful-paint': { numericValue: 950 },
          'cumulative-layout-shift': { numericValue: 0.04 },
          'first-contentful-paint': { numericValue: 1100 },
          'total-blocking-time': { numericValue: 120 },
        },
      }

      const budgetResult = await budgetValidator.validatePerformanceBudget(
        mockLighthouseResults,
        mockBundleStats
      )

      expect(budgetResult.passed).toBe(true)
      expect(budgetResult.score).toBeGreaterThanOrEqual(90)

      // Generate comprehensive reports
      const bundleReport = bundleMonitor.generateReport(
        mockBundleStats,
        bundleAlerts
      )
      const regressionReport = regressionDetector.generateRegressionReport(
        regressionAlerts,
        mockMetrics
      )
      const budgetReport = budgetValidator.generateBudgetReport(budgetResult)

      expect(bundleReport).toContain('Bundle Size Report')
      expect(regressionReport).toContain(
        'Performance Regression Analysis Report'
      )
      expect(budgetReport).toContain('Performance Budget Validation Report')
    })

    it('should handle error conditions gracefully', async () => {
      const validator = new PerformanceBudgetValidator(
        DEFAULT_PERFORMANCE_BUDGET
      )

      // Test with invalid/missing data
      const result = await validator.validatePerformanceBudget(null, undefined)

      expect(result.passed).toBe(false)
      expect(
        result.violations.some((v) => v.category === 'real_user_metrics')
      ).toBe(true)
      expect(result.metadata.confidence).toBeLessThan(1.0)
    })
  })
})
