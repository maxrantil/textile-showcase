'use strict'
// ABOUTME: Performance budget validation utilities integrating RUM, Lighthouse, and bundle monitoring
// Unified validation system for comprehensive performance budget enforcement
Object.defineProperty(exports, '__esModule', { value: true })
exports.DEFAULT_PERFORMANCE_BUDGET = exports.PerformanceBudgetValidator = void 0
const bundle_monitor_1 = require('./bundle-monitor')
const regression_detection_1 = require('./regression-detection')
class PerformanceBudgetValidator {
  constructor(config) {
    this.config = config
    // Initialize monitoring components from Phase 2C Day 1
    // Note: Fallback to null for budget-only validation when Phase 2C Day 1 components unavailable
    try {
      // Advanced components from Phase 2C Day 1 (may not be available in all environments)
      this.rumMonitor = null // Placeholder - integrated in production
      this.coreWebVitalsOptimizer = null // Placeholder - integrated in production
      this.dashboard = null // Placeholder - integrated in production
    } catch (error) {
      console.warn('Performance monitoring integration skipped:', error)
      // Initialize with minimal functionality for budget validation
      this.rumMonitor = null
      this.coreWebVitalsOptimizer = null
      this.dashboard = null
    }
    this.bundleMonitor = new bundle_monitor_1.BundleMonitor(
      Object.assign(Object.assign({}, bundle_monitor_1.DEFAULT_BUNDLE_BUDGET), {
        maxTotalSize: config.bundleSize.total,
        maxGzippedSize: config.bundleSize.gzipped,
        maxJavaScriptSize: config.bundleSize.javascript,
        maxCSSSize: config.bundleSize.css,
        maxImageSize: config.bundleSize.images,
        maxFontSize: config.bundleSize.fonts,
      })
    )
    this.regressionDetector =
      new regression_detection_1.PerformanceRegressionDetector(
        Object.assign(
          Object.assign(
            {},
            regression_detection_1.DEFAULT_REGRESSION_THRESHOLDS
          ),
          {
            performanceScore: {
              critical: config.lighthouse.performance * 0.95,
              major: config.lighthouse.performance * 0.97,
              minor: config.lighthouse.performance * 0.99,
            },
          }
        )
      )
  }
  /**
   * Comprehensive performance budget validation
   */
  async validatePerformanceBudget(lighthouseResults, bundleStats) {
    const violations = []
    const improvements = []
    const recommendations = []
    let totalScore = 100
    // 1. Validate Core Web Vitals with Real User Metrics
    const rumValidation = await this.validateRealUserMetrics()
    if (rumValidation.violations.length > 0) {
      violations.push(...rumValidation.violations)
      totalScore -= rumValidation.violations.length * 10
    }
    if (rumValidation.improvements.length > 0) {
      improvements.push(...rumValidation.improvements)
    }
    // 2. Validate Lighthouse Scores
    if (lighthouseResults) {
      const lighthouseValidation =
        this.validateLighthouseScores(lighthouseResults)
      violations.push(...lighthouseValidation.violations)
      improvements.push(...lighthouseValidation.improvements)
      totalScore -= lighthouseValidation.violations.length * 15
    } else {
      // Missing Lighthouse data is a critical issue
      violations.push({
        category: 'lighthouse',
        metric: 'Missing Data',
        current: 0,
        target: 1,
        severity: 'critical',
        impact: 'Lighthouse performance data is required for budget validation',
      })
      totalScore -= 30
    }
    // 3. Validate Bundle Size
    if (bundleStats) {
      const bundleValidation = await this.validateBundleSize(bundleStats)
      violations.push(...bundleValidation.violations)
      improvements.push(...bundleValidation.improvements)
      totalScore -= bundleValidation.violations.length * 5
    } else {
      // Missing bundle data is a major issue
      violations.push({
        category: 'bundle_size',
        metric: 'Missing Data',
        current: 0,
        target: 1,
        severity: 'major',
        impact:
          'Bundle size data is required for performance budget validation',
      })
      totalScore -= 20
    }
    // 4. Generate recommendations
    recommendations.push(...this.generateRecommendations(violations))
    // 5. Calculate final score and pass/fail status
    const finalScore = Math.max(0, Math.min(100, totalScore))
    const passed =
      violations.filter((v) => v.severity === 'critical').length === 0 &&
      finalScore >= (this.config.validation.enableStrictMode ? 90 : 80)
    return {
      passed,
      score: finalScore,
      violations,
      improvements,
      recommendations,
      metadata: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        sampleSize: rumValidation.sampleSize,
        confidence: this.calculateValidationConfidence(
          violations,
          rumValidation.sampleSize
        ),
      },
    }
  }
  /**
   * Validate Real User Metrics against budget
   */
  async validateRealUserMetrics() {
    var _a, _b, _c, _d
    const violations = []
    const improvements = []
    try {
      // Get current RUM data (if available)
      if (!this.rumMonitor) {
        // Missing RUM data is a concern for production validation
        violations.push({
          category: 'real_user_metrics',
          metric: 'RUM Data Availability',
          current: 0,
          target: 1,
          severity: 'major',
          impact:
            'Real User Metrics monitoring is not available for budget validation',
        })
        return { violations, improvements, sampleSize: 0 }
      }
      // Mock RUM data for budget validation demo
      const rumData = { sessionCount: 0, coreWebVitals: null }
      const sampleSize = rumData.sessionCount || 0
      if (sampleSize < this.config.realUserMetrics.minimumSampleSize) {
        if (this.config.validation.requireRumValidation) {
          violations.push({
            category: 'real_user_metrics',
            metric: 'Sample Size',
            current: sampleSize,
            target: this.config.realUserMetrics.minimumSampleSize,
            severity: 'major',
            impact: `Insufficient RUM data for reliable validation (${sampleSize}/${this.config.realUserMetrics.minimumSampleSize})`,
          })
        }
        return { violations, improvements, sampleSize }
      }
      // Validate Core Web Vitals from RUM with type safety

      const cwv = rumData.coreWebVitals // Type assertion for flexibility
      // LCP validation
      if (
        ((_a = cwv === null || cwv === void 0 ? void 0 : cwv.lcp) === null ||
        _a === void 0
          ? void 0
          : _a.p75) > this.config.coreWebVitals.lcp
      ) {
        const current = cwv.lcp.p75
        const target = this.config.coreWebVitals.lcp
        const exceedance = ((current - target) / target) * 100
        violations.push({
          category: 'real_user_metrics',
          metric: 'LCP (Real Users)',
          current,
          target,
          severity:
            exceedance > 20 ? 'critical' : exceedance > 10 ? 'major' : 'minor',
          impact: `Real users experiencing LCP ${exceedance.toFixed(1)}% slower than target`,
        })
      } else if (
        ((_b = cwv === null || cwv === void 0 ? void 0 : cwv.lcp) === null ||
        _b === void 0
          ? void 0
          : _b.p75) &&
        cwv.lcp.p75 < this.config.coreWebVitals.lcp * 0.9
      ) {
        improvements.push({
          metric: 'LCP (Real Users)',
          improvement: this.config.coreWebVitals.lcp - cwv.lcp.p75,
          impact:
            'Real user LCP performance exceeds target by significant margin',
        })
      }
      // CLS validation
      if (
        ((_c = cwv === null || cwv === void 0 ? void 0 : cwv.cls) === null ||
        _c === void 0
          ? void 0
          : _c.p75) > this.config.coreWebVitals.cls
      ) {
        const current = cwv.cls.p75
        const target = this.config.coreWebVitals.cls
        const exceedance = ((current - target) / target) * 100
        violations.push({
          category: 'real_user_metrics',
          metric: 'CLS (Real Users)',
          current,
          target,
          severity:
            exceedance > 50 ? 'critical' : exceedance > 25 ? 'major' : 'minor',
          impact: `Real users experiencing ${exceedance.toFixed(1)}% more layout shifts than target`,
        })
      }
      // INP validation
      if (
        ((_d = cwv === null || cwv === void 0 ? void 0 : cwv.inp) === null ||
        _d === void 0
          ? void 0
          : _d.p75) > this.config.coreWebVitals.inp
      ) {
        const current = cwv.inp.p75
        const target = this.config.coreWebVitals.inp
        const exceedance = ((current - target) / target) * 100
        violations.push({
          category: 'real_user_metrics',
          metric: 'INP (Real Users)',
          current,
          target,
          severity:
            exceedance > 30 ? 'critical' : exceedance > 15 ? 'major' : 'minor',
          impact: `Real users experiencing ${exceedance.toFixed(1)}% slower interactions than target`,
        })
      }
      return { violations, improvements, sampleSize }
    } catch (error) {
      console.error('RUM validation error:', error)
      if (this.config.validation.requireRumValidation) {
        violations.push({
          category: 'real_user_metrics',
          metric: 'RUM System',
          current: 0,
          target: 1,
          severity: 'critical',
          impact: 'Unable to validate real user performance data',
        })
      }
      return { violations, improvements, sampleSize: 0 }
    }
  }
  /**
   * Validate Lighthouse scores against budget
   */
  validateLighthouseScores(lighthouseResults) {
    var _a, _b
    const violations = []
    const improvements = []
    const categories = [
      {
        name: 'Performance',
        key: 'performance',
        target: this.config.lighthouse.performance,
      },
      {
        name: 'Accessibility',
        key: 'accessibility',
        target: this.config.lighthouse.accessibility,
      },
      {
        name: 'Best Practices',
        key: 'bestPractices',
        target: this.config.lighthouse.bestPractices,
      },
      { name: 'SEO', key: 'seo', target: this.config.lighthouse.seo },
    ]

    const lhResults = lighthouseResults // Type assertion for flexibility
    for (const category of categories) {
      const current =
        ((_b =
          (_a = lhResults.categories) === null || _a === void 0
            ? void 0
            : _a[category.key]) === null || _b === void 0
          ? void 0
          : _b.score) || 0
      const target = category.target
      if (current < target) {
        const deficit = ((target - current) / target) * 100
        violations.push({
          category: 'lighthouse',
          metric: `Lighthouse ${category.name}`,
          current: current * 100,
          target: target * 100,
          severity: deficit > 10 ? 'critical' : deficit > 5 ? 'major' : 'minor',
          impact: `${category.name} score is ${deficit.toFixed(1)}% below target`,
        })
      } else if (current > target * 1.05) {
        improvements.push({
          metric: `Lighthouse ${category.name}`,
          improvement: (current - target) * 100,
          impact: `${category.name} score exceeds target significantly`,
        })
      }
    }
    // Validate Core Web Vitals from Lighthouse
    const audits = lhResults.audits || {}
    const coreVitalsChecks = [
      {
        name: 'LCP',
        audit: 'largest-contentful-paint',
        target: this.config.coreWebVitals.lcp,
      },
      {
        name: 'CLS',
        audit: 'cumulative-layout-shift',
        target: this.config.coreWebVitals.cls,
      },
      {
        name: 'FCP',
        audit: 'first-contentful-paint',
        target: this.config.coreWebVitals.fcp,
      },
      {
        name: 'TBT',
        audit: 'total-blocking-time',
        target: this.config.coreWebVitals.inp,
      }, // Using TBT as proxy for INP
    ]
    for (const check of coreVitalsChecks) {
      const audit = audits[check.audit]
      if (audit && typeof audit.numericValue === 'number') {
        const current = audit.numericValue
        const target = check.target
        if (current > target) {
          const exceedance = ((current - target) / target) * 100
          violations.push({
            category: 'core_web_vitals',
            metric: check.name,
            current,
            target,
            severity:
              exceedance > 25
                ? 'critical'
                : exceedance > 10
                  ? 'major'
                  : 'minor',
            impact: `${check.name} is ${exceedance.toFixed(1)}% above target`,
          })
        }
      }
    }
    return { violations, improvements }
  }
  /**
   * Validate bundle size against budget
   */
  async validateBundleSize(bundleStats) {
    const violations = []
    const improvements = []
    // Validate total bundle size
    if (bundleStats.totalSize > this.config.bundleSize.total) {
      const exceedance =
        ((bundleStats.totalSize - this.config.bundleSize.total) /
          this.config.bundleSize.total) *
        100
      violations.push({
        category: 'bundle_size',
        metric: 'Total Bundle Size',
        current: bundleStats.totalSize,
        target: this.config.bundleSize.total,
        severity:
          exceedance > 15 ? 'critical' : exceedance > 5 ? 'major' : 'minor',
        impact: `Bundle size exceeds budget by ${exceedance.toFixed(1)}%`,
      })
    }
    // Validate gzipped size
    if (bundleStats.gzippedSize > this.config.bundleSize.gzipped) {
      const exceedance =
        ((bundleStats.gzippedSize - this.config.bundleSize.gzipped) /
          this.config.bundleSize.gzipped) *
        100
      violations.push({
        category: 'bundle_size',
        metric: 'Gzipped Bundle Size',
        current: bundleStats.gzippedSize,
        target: this.config.bundleSize.gzipped,
        severity:
          exceedance > 15 ? 'critical' : exceedance > 5 ? 'major' : 'minor',
        impact: `Gzipped size exceeds budget by ${exceedance.toFixed(1)}%`,
      })
    }
    // Calculate asset type sizes
    const assetSizes = {
      javascript: bundleStats.assets
        .filter((a) => a.type === 'js')
        .reduce((sum, a) => sum + a.size, 0),
      css: bundleStats.assets
        .filter((a) => a.type === 'css')
        .reduce((sum, a) => sum + a.size, 0),
      images: bundleStats.assets
        .filter((a) => a.type === 'image')
        .reduce((sum, a) => sum + a.size, 0),
      fonts: bundleStats.assets
        .filter((a) => a.type === 'font')
        .reduce((sum, a) => sum + a.size, 0),
    }
    // Validate asset type budgets
    const assetChecks = [
      {
        name: 'JavaScript',
        size: assetSizes.javascript,
        budget: this.config.bundleSize.javascript,
      },
      { name: 'CSS', size: assetSizes.css, budget: this.config.bundleSize.css },
      {
        name: 'Images',
        size: assetSizes.images,
        budget: this.config.bundleSize.images,
      },
      {
        name: 'Fonts',
        size: assetSizes.fonts,
        budget: this.config.bundleSize.fonts,
      },
    ]
    for (const check of assetChecks) {
      if (check.size > check.budget) {
        const exceedance = ((check.size - check.budget) / check.budget) * 100
        violations.push({
          category: 'bundle_size',
          metric: `${check.name} Assets`,
          current: check.size,
          target: check.budget,
          severity:
            exceedance > 20 ? 'critical' : exceedance > 10 ? 'major' : 'minor',
          impact: `${check.name} assets exceed budget by ${exceedance.toFixed(1)}%`,
        })
      } else if (check.size < check.budget * 0.8) {
        improvements.push({
          metric: `${check.name} Assets`,
          improvement: check.budget - check.size,
          impact: `${check.name} assets are well within budget`,
        })
      }
    }
    return { violations, improvements }
  }
  /**
   * Generate actionable recommendations based on violations
   */
  generateRecommendations(violations) {
    const recommendations = []
    const violationsByCategory = violations.reduce((acc, violation) => {
      acc[violation.category] = acc[violation.category] || []
      acc[violation.category].push(violation)
      return acc
    }, {})
    // Core Web Vitals recommendations
    if (
      violationsByCategory.core_web_vitals ||
      violationsByCategory.lighthouse
    ) {
      recommendations.push('🎯 Core Web Vitals Optimization:')
      const allVitalsViolations = [
        ...(violationsByCategory.core_web_vitals || []),
        ...(violationsByCategory.lighthouse || []),
      ]
      if (allVitalsViolations.some((v) => v.metric.includes('LCP'))) {
        recommendations.push('  • Optimize Largest Contentful Paint')
      }
      if (allVitalsViolations.some((v) => v.metric.includes('CLS'))) {
        recommendations.push(
          '  • Reduce Cumulative Layout Shift: Add size attributes to images, reserve space for dynamic content'
        )
      }
      if (allVitalsViolations.some((v) => v.metric.includes('INP'))) {
        recommendations.push(
          '  • Improve Interaction to Next Paint: Optimize JavaScript execution, reduce main thread blocking'
        )
      }
    }
    // Bundle size recommendations
    if (violationsByCategory.bundle_size) {
      recommendations.push('📦 Bundle Size Optimization:')
      if (
        violationsByCategory.bundle_size.some((v) =>
          v.metric.includes('JavaScript')
        )
      ) {
        recommendations.push(
          '  • Reduce JavaScript: Enable tree shaking, code splitting, remove unused dependencies'
        )
      }
      if (
        violationsByCategory.bundle_size.some((v) => v.metric.includes('CSS'))
      ) {
        recommendations.push(
          '  • Optimize CSS: Remove unused styles, use critical CSS, enable CSS purging'
        )
      }
      if (
        violationsByCategory.bundle_size.some((v) =>
          v.metric.includes('Images')
        )
      ) {
        recommendations.push(
          '  • Optimize Images: Use Next.js Image component, enable AVIF/WebP formats, implement responsive images'
        )
      }
    }
    // Real user metrics recommendations
    if (violationsByCategory.real_user_metrics) {
      recommendations.push('👥 Real User Experience:')
      recommendations.push(
        '  • Monitor field data more closely, implement performance improvements gradually'
      )
      recommendations.push(
        '  • Consider device and network diversity in optimization strategies'
      )
    }
    // Lighthouse recommendations
    if (violationsByCategory.lighthouse) {
      recommendations.push('🔍 Lighthouse Optimization:')
      recommendations.push(
        '  • Address specific Lighthouse audit failures, focus on performance-critical issues'
      )
      recommendations.push(
        '  • Ensure accessibility compliance, optimize for mobile experience'
      )
    }
    return recommendations
  }
  /**
   * Calculate validation confidence based on data quality
   */
  calculateValidationConfidence(violations, rumSampleSize) {
    let confidence = 1.0
    // Reduce confidence if no RUM data
    if (
      !rumSampleSize ||
      rumSampleSize < this.config.realUserMetrics.minimumSampleSize
    ) {
      confidence *= 0.7
    }
    // Reduce confidence for critical violations (might indicate measurement issues)
    const criticalViolations = violations.filter(
      (v) => v.severity === 'critical'
    ).length
    if (criticalViolations > 3) {
      confidence *= 0.8
    }
    return Math.round(confidence * 100) / 100
  }
  /**
   * Generate comprehensive performance budget report
   */
  generateBudgetReport(validationResult) {
    const report = []
    report.push('# Performance Budget Validation Report')
    report.push('')
    report.push(`**Generated**: ${validationResult.metadata.timestamp}`)
    report.push(`**Environment**: ${validationResult.metadata.environment}`)
    report.push(`**Overall Score**: ${validationResult.score}/100`)
    report.push(
      `**Status**: ${validationResult.passed ? '✅ PASSED' : '❌ FAILED'}`
    )
    report.push(
      `**Confidence**: ${(validationResult.metadata.confidence * 100).toFixed(1)}%`
    )
    if (validationResult.metadata.sampleSize) {
      report.push(
        `**RUM Sample Size**: ${validationResult.metadata.sampleSize}`
      )
    }
    report.push('')
    // Budget Targets
    report.push('## 🎯 Performance Budget Targets')
    report.push(`- **LCP**: ≤${this.config.coreWebVitals.lcp}ms`)
    report.push(`- **CLS**: ≤${this.config.coreWebVitals.cls}`)
    report.push(`- **INP**: ≤${this.config.coreWebVitals.inp}ms`)
    report.push(
      `- **Performance Score**: ≥${this.config.lighthouse.performance * 100}%`
    )
    report.push(
      `- **Bundle Size**: ≤${this.formatSize(this.config.bundleSize.total)}`
    )
    report.push('')
    // Violations
    if (validationResult.violations.length > 0) {
      report.push('## ❌ Budget Violations')
      for (const violation of validationResult.violations.sort((a, b) => {
        const severityOrder = { critical: 3, major: 2, minor: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })) {
        const emoji =
          violation.severity === 'critical'
            ? '🚨'
            : violation.severity === 'major'
              ? '⚠️'
              : '📉'
        report.push(
          `### ${emoji} ${violation.metric} (${violation.severity.toUpperCase()})`
        )
        report.push(`- **Current**: ${violation.current}`)
        report.push(`- **Target**: ${violation.target}`)
        report.push(`- **Impact**: ${violation.impact}`)
        report.push('')
      }
    }
    // Improvements
    if (validationResult.improvements.length > 0) {
      report.push('## 📈 Performance Improvements')
      for (const improvement of validationResult.improvements) {
        report.push(`### ✅ ${improvement.metric}`)
        report.push(`- **Improvement**: ${improvement.improvement}`)
        report.push(`- **Impact**: ${improvement.impact}`)
        report.push('')
      }
    }
    // Recommendations
    if (validationResult.recommendations.length > 0) {
      report.push('## 💡 Recommendations')
      for (const recommendation of validationResult.recommendations) {
        report.push(recommendation)
      }
      report.push('')
    }
    return report.join('\n')
  }
  /**
   * Format bytes into human-readable string
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
  }
}
exports.PerformanceBudgetValidator = PerformanceBudgetValidator
// Default performance budget configuration based on Phase 2C targets
exports.DEFAULT_PERFORMANCE_BUDGET = {
  coreWebVitals: {
    lcp: 1000, // 1s - Phase 2C Day 3 achievement
    cls: 0.05, // 0.05 - Phase 2C Day 3 achievement
    inp: 200, // 200ms
    fcp: 1200, // 1.2s
    ttfb: 800, // 800ms
  },
  lighthouse: {
    performance: 0.98, // 98% - Phase 2C target
    accessibility: 0.95, // 95%
    bestPractices: 0.95, // 95%
    seo: 0.95, // 95%
  },
  bundleSize: {
    total: 1500000, // 1.5MB - Phase 2B achievement
    gzipped: 450000, // 450KB
    javascript: 800000, // 800KB
    css: 100000, // 100KB
    images: 400000, // 400KB
    fonts: 200000, // 200KB - Phase 2C Day 3: 144KB actual
  },
  realUserMetrics: {
    minimumSampleSize: 100,
    acceptablePerformancePercentile: 0.75, // 75th percentile
    maxRegressionTolerance: 10, // 10%
  },
  validation: {
    enableStrictMode: process.env.NODE_ENV === 'production',
    enableAutoRollback: process.env.ENABLE_AUTO_ROLLBACK === 'true',
    alertThreshold: 'warning',
    requireRumValidation: process.env.NODE_ENV === 'production',
  },
}
