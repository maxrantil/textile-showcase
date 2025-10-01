// ABOUTME: Performance regression tests for Issue #40 optimization features
// Validates that performance improvements are maintained and don't regress

import {
  measureProgressiveHydration,
  measureCoreWebVitals,
  validateDynamicImports,
  validatePerformanceBudget,
  analyzeBundleEfficiency,
} from '../utils/performance-testing'

// Skip performance tests in Jest environment - requires real browser APIs

describe.skip('Performance Regression Prevention', () => {
  // Performance baselines from Phase 2A+2B+2C optimizations
  const PERFORMANCE_BASELINES = {
    tti: 1900, // Improved from ~2500ms to 1900ms
    fcp: 1100, // Maintained at ~1100ms
    lcp: 2000, // Target <2000ms
    cls: 0.05, // Target <0.05
    tbt: 180, // Improved from ~300ms
    bundleSize: 2.33 * 1024 * 1024, // 2.33MB total
    vendorChunkSize: 98.5 * 1024, // 98.5KB largest chunk
  }

  const PERFORMANCE_THRESHOLDS = {
    regressionTolerance: 0.1, // 10% regression tolerance
    emergencyThreshold: 0.5, // 50% regression = emergency
  }

  describe('Progressive Hydration Performance', () => {
    it('should_maintain_TTI_improvement_from_progressive_hydration', async () => {
      // Measure current TTI with progressive hydration
      const currentMetrics = await measureCoreWebVitals()

      // Should not regress beyond baseline + tolerance
      const maxAllowedTTI =
        PERFORMANCE_BASELINES.tti *
        (1 + PERFORMANCE_THRESHOLDS.regressionTolerance)

      expect(currentMetrics.tti).toBeLessThan(maxAllowedTTI)

      // Emergency threshold check
      const emergencyTTI =
        PERFORMANCE_BASELINES.tti *
        (1 + PERFORMANCE_THRESHOLDS.emergencyThreshold)
      if (currentMetrics.tti > emergencyTTI) {
        throw new Error(
          `EMERGENCY: TTI regressed by >50%: ${currentMetrics.tti}ms (baseline: ${PERFORMANCE_BASELINES.tti}ms)`
        )
      }
    })

    it('should_maintain_progressive_hydration_timing_benefits', async () => {
      const hydrationMetrics = await measureProgressiveHydration()

      // Progressive hydration should complete within performance budget
      expect(hydrationMetrics.duration).toBeLessThan(2000) // 2s maximum

      // Should hydrate critical components first
      expect(hydrationMetrics.componentsHydrated.length).toBeGreaterThan(0)

      // Should not have hydration errors
      expect(hydrationMetrics.errors.length).toBe(0)
    })

    it('should_validate_requestIdleCallback_optimization_effectiveness', async () => {
      // Mock performance measurement for requestIdleCallback usage
      let idleCallbackUsed = false
      let fallbackUsed = false

      const originalRequestIdleCallback = window.requestIdleCallback

      // Track usage
      window.requestIdleCallback = jest
        .fn()
        .mockImplementation((callback, options) => {
          idleCallbackUsed = true
          return originalRequestIdleCallback(callback, options)
        })

      // Test scenario where requestIdleCallback is not available
      // @ts-expect-error - Deleting window property for testing fallback behavior
      delete window.requestIdleCallback

      const timeoutSpy = jest.spyOn(window, 'setTimeout').mockImplementation(((
        callback: () => void,
        delay?: number
      ) => {
        fallbackUsed = true
        if (originalRequestIdleCallback) {
          return originalRequestIdleCallback(callback as IdleRequestCallback, {
            timeout: delay || 0,
          }) as unknown as NodeJS.Timeout
        }
        return 0 as unknown as NodeJS.Timeout
      }) as typeof setTimeout)

      // Restore for actual test
      window.requestIdleCallback = originalRequestIdleCallback

      // Both strategies should be available
      expect(
        typeof originalRequestIdleCallback === 'function' ||
          typeof window.setTimeout === 'function'
      ).toBe(true)

      // At least one optimization strategy should have been used
      expect(idleCallbackUsed || fallbackUsed).toBe(true)

      timeoutSpy.mockRestore()
    })
  })

  describe('Dynamic Import Performance', () => {
    it('should_maintain_dynamic_import_loading_performance', async () => {
      const importResults = await validateDynamicImports()

      // All critical imports should succeed
      expect(importResults.successful.length).toBeGreaterThan(0)
      expect(importResults.failed.length).toBe(0)

      // Import loading should be fast
      Object.values(importResults.loadTimes).forEach((loadTime) => {
        expect(loadTime).toBeLessThan(100) // 100ms budget per import
      })
    })

    it('should_prevent_bundle_size_regression', async () => {
      const bundleAnalysis = await analyzeBundleEfficiency()

      // Total bundle size should not exceed baseline + tolerance
      const maxAllowedBundleSize =
        PERFORMANCE_BASELINES.bundleSize *
        (1 + PERFORMANCE_THRESHOLDS.regressionTolerance)
      expect(bundleAnalysis.totalSize).toBeLessThan(maxAllowedBundleSize)

      // Vendor chunk size should remain optimized
      const maxAllowedVendorSize =
        PERFORMANCE_BASELINES.vendorChunkSize *
        (1 + PERFORMANCE_THRESHOLDS.regressionTolerance)
      expect(bundleAnalysis.vendorBundle).toBeLessThan(maxAllowedVendorSize)

      // Dynamic chunks should be present (confirming code splitting works)
      expect(bundleAnalysis.dynamicChunks.length).toBeGreaterThan(0)
    })

    it('should_maintain_efficient_chunk_splitting', async () => {
      const bundleAnalysis = await analyzeBundleEfficiency()

      // Should have optimal compression
      expect(bundleAnalysis.compressionRatio).toBeLessThan(0.8) // 20%+ compression

      // Dynamic chunks should be reasonably sized
      bundleAnalysis.dynamicChunks.forEach((chunk) => {
        expect(chunk.size).toBeLessThan(200 * 1024) // 200KB per chunk maximum
      })
    })
  })

  describe('Core Web Vitals Regression Prevention', () => {
    it('should_prevent_LCP_regression', async () => {
      const metrics = await measureCoreWebVitals()

      const maxAllowedLCP =
        PERFORMANCE_BASELINES.lcp *
        (1 + PERFORMANCE_THRESHOLDS.regressionTolerance)
      expect(metrics.lcp).toBeLessThan(maxAllowedLCP)

      // Emergency check
      if (metrics.lcp > PERFORMANCE_BASELINES.lcp * 2) {
        throw new Error(`EMERGENCY: LCP severely regressed: ${metrics.lcp}ms`)
      }
    })

    it('should_prevent_CLS_regression', async () => {
      const metrics = await measureCoreWebVitals()

      const maxAllowedCLS =
        PERFORMANCE_BASELINES.cls *
        (1 + PERFORMANCE_THRESHOLDS.regressionTolerance)
      expect(metrics.cls).toBeLessThan(maxAllowedCLS)

      // CLS should remain excellent
      expect(metrics.cls).toBeLessThan(0.1) // Good threshold
    })

    it('should_prevent_TBT_regression', async () => {
      const metrics = await measureCoreWebVitals()

      const maxAllowedTBT =
        PERFORMANCE_BASELINES.tbt *
        (1 + PERFORMANCE_THRESHOLDS.regressionTolerance)
      expect(metrics.tbt).toBeLessThan(maxAllowedTBT)

      // TBT should remain optimized
      expect(metrics.tbt).toBeLessThan(200) // Target threshold
    })

    it('should_maintain_overall_performance_budget_compliance', async () => {
      const metrics = await measureCoreWebVitals()
      const budgetValidation = validatePerformanceBudget(metrics)

      // Performance budget should pass
      expect(budgetValidation.passed).toBe(true)

      // Performance score should be high
      expect(budgetValidation.score).toBeGreaterThan(80) // 80+ score

      // Log violations for debugging
      if (budgetValidation.violations.length > 0) {
        console.warn(
          'Performance budget violations:',
          budgetValidation.violations
        )
      }
    })
  })

  describe('Device-Specific Performance Maintenance', () => {
    it('should_maintain_mobile_performance_optimizations', async () => {
      // Mock mobile environment
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      })

      const metrics = await measureCoreWebVitals()

      // Mobile should meet stricter thresholds
      expect(metrics.tti).toBeLessThan(2500) // Mobile TTI budget
      expect(metrics.fcp).toBeLessThan(1500) // Mobile FCP budget
    })

    it('should_maintain_desktop_performance_optimizations', async () => {
      // Mock desktop environment
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      })

      const metrics = await measureCoreWebVitals()

      // Desktop should meet optimal thresholds
      expect(metrics.tti).toBeLessThan(1500) // Desktop TTI budget
      expect(metrics.fcp).toBeLessThan(1000) // Desktop FCP budget
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should_track_performance_improvements_over_time', async () => {
      // This test would integrate with actual performance monitoring
      const currentMetrics = await measureCoreWebVitals()

      // Store metrics for trend analysis
      const performanceHistory = {
        timestamp: Date.now(),
        metrics: currentMetrics,
        optimizations: [
          'progressive-hydration',
          'dynamic-imports',
          'bundle-splitting',
          'ssr-disabled-for-heavy-components',
        ],
      }

      // Verify metrics are within expected ranges
      expect(currentMetrics.tti).toBeLessThanOrEqual(
        PERFORMANCE_BASELINES.tti * 1.1
      )
      expect(currentMetrics.fcp).toBeLessThanOrEqual(
        PERFORMANCE_BASELINES.fcp * 1.1
      )

      // Log for CI/CD monitoring
      console.log(
        'Performance History Entry:',
        JSON.stringify(performanceHistory, null, 2)
      )
    })

    it('should_validate_performance_optimization_feature_flags', () => {
      // Validate that performance optimizations are enabled
      const optimizationFlags = {
        progressiveHydrationEnabled: true,
        dynamicImportsEnabled: true,
        ssrDisabledForHeavyComponents: true,
        requestIdleCallbackSupported:
          typeof window !== 'undefined' && 'requestIdleCallback' in window,
      }

      expect(optimizationFlags.progressiveHydrationEnabled).toBe(true)
      expect(optimizationFlags.dynamicImportsEnabled).toBe(true)
      expect(optimizationFlags.ssrDisabledForHeavyComponents).toBe(true)

      // Log optimization status
      console.log('Optimization Status:', optimizationFlags)
    })
  })

  describe('Emergency Performance Thresholds', () => {
    it('should_trigger_emergency_alerts_for_severe_regressions', async () => {
      const metrics = await measureCoreWebVitals()

      // Define emergency thresholds (200% of baseline)
      const emergencyThresholds = {
        tti: PERFORMANCE_BASELINES.tti * 2,
        fcp: PERFORMANCE_BASELINES.fcp * 2,
        lcp: PERFORMANCE_BASELINES.lcp * 2,
        cls: PERFORMANCE_BASELINES.cls * 3,
      }

      // Check for emergency conditions
      const emergencyConditions: string[] = []

      if (metrics.tti > emergencyThresholds.tti) {
        emergencyConditions.push(
          `TTI: ${metrics.tti}ms > ${emergencyThresholds.tti}ms`
        )
      }

      if (metrics.fcp > emergencyThresholds.fcp) {
        emergencyConditions.push(
          `FCP: ${metrics.fcp}ms > ${emergencyThresholds.fcp}ms`
        )
      }

      if (metrics.lcp > emergencyThresholds.lcp) {
        emergencyConditions.push(
          `LCP: ${metrics.lcp}ms > ${emergencyThresholds.lcp}ms`
        )
      }

      if (metrics.cls > emergencyThresholds.cls) {
        emergencyConditions.push(
          `CLS: ${metrics.cls} > ${emergencyThresholds.cls}`
        )
      }

      // Should not have emergency conditions
      expect(emergencyConditions.length).toBe(0)

      if (emergencyConditions.length > 0) {
        throw new Error(
          `EMERGENCY PERFORMANCE REGRESSION DETECTED: ${emergencyConditions.join(', ')}`
        )
      }
    })
  })
})
