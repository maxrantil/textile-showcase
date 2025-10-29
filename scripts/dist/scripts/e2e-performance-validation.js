#!/usr/bin/env node
'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const fs_1 = __importDefault(require('fs'))
// ABOUTME: End-to-end performance validation script for final Phase 2C validation
// Runs comprehensive performance testing across all scenarios and generates reports
const e2e_performance_validator_1 = require('../src/utils/e2e-performance-validator')
// Configuration
const CONFIG = Object.assign(
  {
    scenarios: [
      {
        name: 'Desktop - Home Page - Optimal',
        url: 'http://localhost:3000',
        device: 'desktop',
        networkThrottling: 'no-throttling',
        viewport: { width: 1920, height: 1080 },
      },
      {
        name: 'Mobile - Home Page - Fast 3G',
        url: 'http://localhost:3000',
        device: 'mobile',
        networkThrottling: 'fast-3g',
        viewport: { width: 375, height: 667 },
      },
      {
        name: 'Desktop - Project Page - Optimal',
        url: 'http://localhost:3000/project/sustainable-packaging-solutions',
        device: 'desktop',
        networkThrottling: 'no-throttling',
        viewport: { width: 1920, height: 1080 },
      },
      {
        name: 'Mobile - Project Page - Fast 3G',
        url: 'http://localhost:3000/project/sustainable-packaging-solutions',
        device: 'mobile',
        networkThrottling: 'fast-3g',
        viewport: { width: 375, height: 667 },
      },
      {
        name: 'Mobile - Contact Page - Slow 3G',
        url: 'http://localhost:3000/contact',
        device: 'mobile',
        networkThrottling: 'slow-3g',
        viewport: { width: 375, height: 667 },
      },
      {
        name: 'Desktop - About Page - DSL',
        url: 'http://localhost:3000/about',
        device: 'desktop',
        networkThrottling: 'dsl',
        viewport: { width: 1366, height: 768 },
      },
    ],
    // Phase 2C final targets - strict enforcement
    thresholds: {
      lighthouse: {
        performance: 0.98, // 98% - Phase 2C target
        accessibility: 0.95, // 95%
        bestPractices: 0.95, // 95%
        seo: 0.95, // 95%
      },
      coreWebVitals: {
        lcp: 1000, // <1s - Phase 2C achievement
        cls: 0.05, // <0.05 - Phase 2C achievement
        inp: 200, // <200ms
        fcp: 1000, // <1s
        ttfb: 600, // <600ms
      },
      bundleSize: {
        total: 1500000, // 1.5MB - Phase 2A achievement
        gzipped: 450000, // 450KB
        javascript: 800000, // 800KB
        css: 100000, // 100KB
        images: 500000, // 500KB
        fonts: 200000, // 200KB
      },
    },
    testing: {
      iterations: process.env.CI ? 3 : 5, // More iterations locally for confidence
      parallelRuns: 1, // Sequential for stability
      warmupRuns: 1,
      timeout: 90000, // 90 seconds per test
      retryOnFailure: true,
      maxRetries: 2,
    },
    output: {
      reportDirectory: './e2e-performance-reports',
      formats: ['json', 'html', 'markdown'],
      includeRawData: true,
      screenshotOnFailure: true,
    },
  },
  process.env.CI && {
    testing: {
      iterations: 3,
      parallelRuns: 1,
      warmupRuns: 1,
      timeout: 120000, // Longer timeout in CI
      retryOnFailure: true,
      maxRetries: 1, // Fewer retries in CI
    },
  }
)
/**
 * Run comprehensive end-to-end performance validation
 */
async function runE2EValidation() {
  var _a, _b, _c
  console.log('🚀 Starting Phase 2C Final E2E Performance Validation...')
  console.log(
    `📊 Testing ${((_a = CONFIG.scenarios) === null || _a === void 0 ? void 0 : _a.length) || 0} scenarios with ${((_b = CONFIG.testing) === null || _b === void 0 ? void 0 : _b.iterations) || 0} iterations each`
  )
  try {
    // Initialize validator
    const validator = new e2e_performance_validator_1.E2EPerformanceValidator(
      CONFIG
    )
    // Run validation
    const startTime = Date.now()
    const report = await validator.runE2EValidation()
    const duration = Date.now() - startTime
    // Display results
    console.log('\n' + '='.repeat(60))
    console.log('📊 PHASE 2C FINAL VALIDATION RESULTS')
    console.log('='.repeat(60))
    console.log(`⏱️  Total Duration: ${formatDuration(duration)}`)
    console.log(`🎯 Overall Score: ${report.overall.score.toFixed(1)}%`)
    console.log(
      `📋 Tests: ${report.summary.passed}/${report.summary.totalTests} passed`
    )
    if (report.overall.passed) {
      console.log('✅ PHASE 2C VALIDATION: PASSED')
      console.log('🎉 All performance targets achieved!')
    } else {
      console.log('❌ PHASE 2C VALIDATION: FAILED')
      console.log('\n🚨 Critical Issues:')
      report.overall.criticalIssues.forEach((issue) => {
        console.log(`   • ${issue}`)
      })
    }
    if (report.summary.warnings > 0) {
      console.log(`\n⚠️  Warnings: ${report.summary.warnings}`)
    }
    // Scenario breakdown
    console.log('\n📋 Scenario Results:')
    Object.entries(report.scenarios).forEach(([name, scenario]) => {
      const status = scenario.passed ? '✅' : '❌'
      const perfScore = (
        scenario.averages.lighthouse.performance * 100
      ).toFixed(1)
      const lcp = scenario.averages.coreWebVitals.lcp.toFixed(0)
      const cls = scenario.averages.coreWebVitals.cls.toFixed(3)
      console.log(`   ${status} ${name}`)
      console.log(
        `      Performance: ${perfScore}% | LCP: ${lcp}ms | CLS: ${cls}`
      )
      if (!scenario.passed && scenario.failures.length > 0) {
        console.log(
          `      Failures: ${scenario.failures.slice(0, 2).join(', ')}${scenario.failures.length > 2 ? '...' : ''}`
        )
      }
    })
    // Key recommendations
    if (report.overall.recommendations.length > 0) {
      console.log('\n💡 Key Recommendations:')
      report.overall.recommendations.slice(0, 3).forEach((rec) => {
        console.log(`   • ${rec}`)
      })
      if (report.overall.recommendations.length > 3) {
        console.log(
          `   ... and ${report.overall.recommendations.length - 3} more (see full report)`
        )
      }
    }
    console.log(
      `\n📄 Detailed reports saved to: ${((_c = CONFIG.output) === null || _c === void 0 ? void 0 : _c.reportDirectory) || './e2e-performance-reports'}`
    )
    // Exit with appropriate code
    if (report.overall.passed) {
      console.log('\n🚀 Ready for Phase 2C delivery and production deployment!')
      process.exit(0)
    } else {
      console.log('\n🔧 Performance optimization required before delivery')
      process.exit(1)
    }
  } catch (error) {
    const err = error
    console.error('❌ E2E validation failed:', err.message)
    if (process.env.VERBOSE || process.argv.includes('--verbose')) {
      console.error(err.stack)
    }
    process.exit(1)
  }
}
/**
 * Show help information
 */
function showHelp() {
  console.log(`
End-to-End Performance Validation Script

Usage: node scripts/e2e-performance-validation.js [options]

Options:
  --verbose    Show detailed error information
  --help       Show this help message

Environment Variables:
  CI           Set to 'true' to enable CI-specific configuration
  VERBOSE      Set to 'true' to enable verbose output

Examples:
  npm run test:e2e-performance
  node scripts/e2e-performance-validation.js --verbose
  CI=true node scripts/e2e-performance-validation.js

Prerequisites:
  1. Application built (npm run build)
  2. Lighthouse CLI installed (npx lighthouse)
  3. Performance monitoring system functional

Phase 2C Validation Targets:
  • Lighthouse Performance Score: 98%+
  • LCP (Largest Contentful Paint): <1s
  • CLS (Cumulative Layout Shift): <0.05
  • Bundle Size: <1.5MB total, <450KB gzipped
  • All scenarios passing across devices and network conditions

This script validates the complete Phase 2C performance optimization
implementation and confirms readiness for production deployment.
`)
}
/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}
/**
 * Pre-flight checks
 */
function runPreflightChecks() {
  const checks = [
    {
      name: 'Node.js version',
      check: () =>
        process.version.startsWith('v18') || process.version.startsWith('v20'),
      message: 'Node.js 18+ required',
    },
    {
      name: 'Build directory',
      check: () => fs_1.default.existsSync('.next'),
      message: 'Run npm run build first',
    },
    {
      name: 'Package.json',
      check: () => fs_1.default.existsSync('package.json'),
      message: 'Must be run from project root',
    },
  ]
  console.log('🔍 Running pre-flight checks...')
  for (const check of checks) {
    try {
      if (!check.check()) {
        console.error(`❌ ${check.name}: ${check.message}`)
        process.exit(1)
      }
      console.log(`✅ ${check.name}`)
    } catch (error) {
      console.error(`❌ ${check.name}: ${check.message}`)
      process.exit(1)
    }
  }
  console.log('✅ Pre-flight checks passed\n')
}
// Handle command line arguments
if (process.argv.includes('--help')) {
  showHelp()
  process.exit(0)
}
// Run validation
console.log('🎯 Phase 2C Final E2E Performance Validation')
console.log('='.repeat(50))
runPreflightChecks()
runE2EValidation().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
