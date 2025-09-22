#!/usr/bin/env node
'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const fs_1 = __importDefault(require('fs'))
const child_process_1 = require('child_process')
// ABOUTME: Real-world performance validation script for production readiness assessment
// Tests performance under realistic user scenarios and network conditions
const real_world_performance_validator_1 = require('../src/utils/real-world-performance-validator')
/**
 * Main validation function
 */
async function runRealWorldValidation() {
  console.log('🌍 Real-World Performance Validation')
  console.log('='.repeat(50))
  console.log('Testing performance under realistic conditions...\n')
  try {
    const validator =
      new real_world_performance_validator_1.RealWorldPerformanceValidator()
    const startTime = Date.now()
    // Run comprehensive validation
    const report = await validator.validateRealWorldPerformance()
    const duration = Date.now() - startTime
    // Display results
    console.log('\n' + '='.repeat(60))
    console.log('🏁 REAL-WORLD VALIDATION COMPLETE')
    console.log('='.repeat(60))
    console.log(`⏱️  Total Duration: ${formatDuration(duration)}`)
    console.log(
      `📊 Scenarios: ${report.summary.passed}/${report.summary.totalScenarios} passed`
    )
    console.log(
      `🏢 Business Risk: ${report.businessImpact.overallRisk.toUpperCase()}`
    )
    console.log(
      `🚀 Production Ready: ${report.readinessAssessment.productionReady ? 'YES ✅' : 'NO ❌'}`
    )
    if (report.summary.criticalFailures > 0) {
      console.log(`🚨 Critical Failures: ${report.summary.criticalFailures}`)
    }
    // Show key findings
    console.log('\n📋 Key Findings:')
    const worstCase = report.results.sort(
      (a, b) => b.violations.length - a.violations.length
    )[0]
    if (worstCase && worstCase.violations.length > 0) {
      console.log(`   📉 Most Challenging: ${worstCase.scenario.name}`)
      console.log(`      Network: ${worstCase.scenario.networkCondition.name}`)
      console.log(`      Issues: ${worstCase.violations.length} violations`)
    }
    const bestCase = report.results
      .filter((r) => r.passed)
      .sort(
        (a, b) =>
          b.actualMetrics.performanceScore - a.actualMetrics.performanceScore
      )[0]
    if (bestCase) {
      console.log(`   📈 Best Performance: ${bestCase.scenario.name}`)
      console.log(
        `      Score: ${(bestCase.actualMetrics.performanceScore * 100).toFixed(1)}%`
      )
      console.log(`      LCP: ${bestCase.actualMetrics.lcp}ms`)
    }
    // Business impact summary
    console.log('\n💼 Business Impact:')
    console.log(
      `   💰 Revenue Risk: ${report.businessImpact.estimatedRevenueImpact}`
    )
    if (report.businessImpact.priorityRecommendations.length > 0) {
      console.log('\n🎯 Priority Actions:')
      report.businessImpact.priorityRecommendations
        .slice(0, 3)
        .forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec.recommendation}`)
          console.log(`      ROI: ${rec.estimatedROI}`)
        })
    }
    // Production readiness assessment
    if (report.readinessAssessment.productionReady) {
      console.log('\n🚀 PRODUCTION DEPLOYMENT APPROVED')
      console.log('   All critical performance criteria met')
      console.log('   Business risk within acceptable limits')
      console.log('\n📋 Next Steps:')
      report.readinessAssessment.nextSteps.forEach((step) => {
        console.log(`   • ${step}`)
      })
    } else {
      console.log('\n🛑 PRODUCTION DEPLOYMENT BLOCKED')
      if (report.readinessAssessment.blockers.length > 0) {
        console.log('\n❌ Critical Issues:')
        report.readinessAssessment.blockers.forEach((blocker) => {
          console.log(`   • ${blocker}`)
        })
      }
      console.log('\n🔧 Required Actions:')
      report.readinessAssessment.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`)
      })
    }
    // Scenario breakdown
    console.log('\n📱 Scenario Results:')
    report.results.forEach((result) => {
      const status = result.passed ? '✅' : '❌'
      const risk = getRiskEmoji(result.businessImpact.overallRisk)
      console.log(`   ${status} ${result.scenario.name} ${risk}`)
      console.log(
        `      ${result.scenario.device} | ${result.scenario.networkCondition.name}`
      )
      if (result.violations.length > 0) {
        const criticalCount = result.violations.filter(
          (v) => v.severity === 'critical'
        ).length
        const errorCount = result.violations.filter(
          (v) => v.severity === 'error'
        ).length
        console.log(
          `      Issues: ${criticalCount} critical, ${errorCount} errors`
        )
      }
    })
    console.log(`\n📄 Detailed reports saved:`)
    console.log('   • real-world-performance-report.json')
    console.log('   • real-world-performance-summary.md')
    // Exit with appropriate code
    if (report.readinessAssessment.productionReady) {
      console.log('\n🎉 Ready for Phase 2C delivery!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Optimization required before delivery')
      process.exit(1)
    }
  } catch (error) {
    const err = error
    console.error('❌ Real-world validation failed:', err.message)
    if (process.env.VERBOSE || process.argv.includes('--verbose')) {
      console.error(err.stack)
    }
    process.exit(1)
  }
}
/**
 * Get risk emoji
 */
function getRiskEmoji(risk) {
  switch (risk) {
    case 'critical':
      return '🔴'
    case 'high':
      return '🟠'
    case 'medium':
      return '🟡'
    case 'low':
      return '🟢'
    default:
      return '⚪'
  }
}
/**
 * Format duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}
/**
 * Show help information
 */
function showHelp() {
  console.log(`
Real-World Performance Validation Script

Usage: node scripts/real-world-validation.js [options]

Options:
  --verbose    Show detailed error information
  --help       Show this help message

Environment Variables:
  VERBOSE      Set to 'true' to enable verbose output

Examples:
  npm run test:real-world-performance
  node scripts/real-world-validation.js --verbose

Real-World Test Scenarios:
  🏠 First Time Visitor - Home Page (Mobile 4G)
     Critical business impact - first impression matters

  📄 Project Discovery - Sustainable Packaging (Desktop Cable)
     Core business flow - showcasing capabilities

  🌍 Emerging Market Access - Contact Page (Mobile 3G)
     Challenging conditions - accessibility focus

  📧 Emergency Network - About Page (Poor Mobile)
     Edge case - minimum viable performance

  🏢 Enterprise Client - Desktop Fiber (High Expectations)
     Premium user experience requirements

Network Conditions Tested:
  • Fiber Broadband (100 Mbps, 20ms RTT)
  • Cable Broadband (50 Mbps, 30ms RTT)
  • 4G Mobile (4 Mbps, 70ms RTT)
  • 3G Mobile (1 Mbps, 200ms RTT)
  • Poor Mobile Signal (100 Kbps, 1000ms RTT)

Business Metrics Evaluated:
  • Bounce rate impact estimates
  • Conversion rate impact estimates
  • SEO ranking implications
  • User experience assessment
  • Revenue risk analysis

Production Readiness Criteria:
  ✅ No critical performance violations
  ✅ Business risk within acceptable limits
  ✅ Core user flows performing well
  ✅ Performance graceful degradation
`)
}
/**
 * Pre-flight checks
 */
function runPreflightChecks() {
  const checks = [
    {
      name: 'Build directory exists',
      check: () => fs_1.default.existsSync('.next'),
      message: 'Run "npm run build" first',
    },
    {
      name: 'Lighthouse CLI available',
      check: () => {
        try {
          ;(0, child_process_1.execSync)('npx lighthouse --version', {
            stdio: 'ignore',
          })
          return true
        } catch (_a) {
          return false
        }
      },
      message: 'Install Lighthouse CLI: npm install -g lighthouse',
    },
    {
      name: 'Network simulation support',
      check: () => true, // Lighthouse handles this
      message: 'Lighthouse network simulation ready',
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
runPreflightChecks()
runRealWorldValidation().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
