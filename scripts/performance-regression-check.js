#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

// ABOUTME: Performance regression detection and automated rollback script
// Analyzes performance metrics and triggers rollback for critical regressions

const {
  PerformanceRegressionDetector,
  DEFAULT_REGRESSION_THRESHOLDS,
} = require('../src/utils/regression-detection.ts')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  historyFile: '.performance-history.json',
  reportFile: 'regression-analysis-report.md',
  enableAutoRollback:
    process.env.ENABLE_AUTO_ROLLBACK === 'true' ||
    process.argv.includes('--auto-rollback'),
  environment: process.env.NODE_ENV || process.env.ENVIRONMENT || 'development',
  buildId:
    process.env.BUILD_ID ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    `local-${Date.now()}`,
  gitCommit:
    process.env.GIT_COMMIT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    getCurrentGitCommit(),
  verbose: process.argv.includes('--verbose') || process.env.VERBOSE === 'true',
}

/**
 * Get current git commit hash
 */
function getCurrentGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch (error) {
    console.warn('Could not get git commit:', error.message)
    return 'unknown'
  }
}

/**
 * Extract Lighthouse metrics from results
 */
function extractLighthouseMetrics() {
  const lighthouseDir = '.lighthouseci'

  if (!fs.existsSync(lighthouseDir)) {
    throw new Error('Lighthouse results not found. Run Lighthouse CI first.')
  }

  try {
    // Find the most recent Lighthouse results file
    const files = fs
      .readdirSync(lighthouseDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => ({
        path: path.join(lighthouseDir, file),
        stats: fs.statSync(path.join(lighthouseDir, file)),
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())

    if (files.length === 0) {
      throw new Error('No Lighthouse JSON results found')
    }

    const resultPath = files[0].path
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))

    return {
      performanceScore: result.categories.performance.score,
      lcp: result.audits['largest-contentful-paint'].numericValue,
      cls: result.audits['cumulative-layout-shift'].numericValue,
      fid: result.audits['max-potential-fid']?.numericValue || 0,
      tbt: result.audits['total-blocking-time'].numericValue,
      speedIndex: result.audits['speed-index'].numericValue,
    }
  } catch (error) {
    throw new Error(`Failed to extract Lighthouse metrics: ${error.message}`)
  }
}

/**
 * Extract bundle size metrics from build output
 */
function extractBundleMetrics() {
  const bundleHistoryFile = '.bundle-history.json'

  if (!fs.existsSync(bundleHistoryFile)) {
    throw new Error('Bundle history not found. Run bundle size analysis first.')
  }

  try {
    const history = JSON.parse(fs.readFileSync(bundleHistoryFile, 'utf8'))
    if (history.length === 0) {
      throw new Error('No bundle history available')
    }

    // Get the most recent bundle stats
    const latestStats = history[history.length - 1]

    // Calculate asset type sizes
    const javascriptSize = latestStats.assets
      .filter((asset) => asset.type === 'js')
      .reduce((sum, asset) => sum + asset.size, 0)

    const cssSize = latestStats.assets
      .filter((asset) => asset.type === 'css')
      .reduce((sum, asset) => sum + asset.size, 0)

    return {
      totalSize: latestStats.totalSize,
      gzippedSize: latestStats.gzippedSize,
      javascriptSize,
      cssSize,
    }
  } catch (error) {
    throw new Error(`Failed to extract bundle metrics: ${error.message}`)
  }
}

/**
 * Extract Real User Metrics from monitoring system
 */
async function extractRealUserMetrics() {
  // This would integrate with the Phase 2C Day 1 RUM system
  // For now, return null to indicate no RUM data available

  try {
    // In a real implementation, this would query the RUM system:
    // const rumData = await fetch('/api/performance/rum-summary').then(r => r.json())

    // Placeholder for RUM integration
    return null
  } catch (error) {
    console.warn('Could not fetch Real User Metrics:', error.message)
    return null
  }
}

/**
 * Automated rollback callback
 */
async function performRollback(alert) {
  console.log(
    `🔄 Attempting automated rollback for ${alert.metric} regression...`
  )

  if (!CONFIG.enableAutoRollback) {
    console.log('⚠️ Auto-rollback is disabled. Manual intervention required.')
    return false
  }

  if (CONFIG.environment === 'production') {
    console.log(
      '🚨 Production environment detected. Initiating emergency rollback...'
    )

    try {
      // Get previous successful commit
      const previousCommit = execSync('git log --oneline -n 2 --format="%H"', {
        encoding: 'utf8',
      })
        .split('\n')[1]
        ?.trim()

      if (!previousCommit) {
        console.error('❌ Could not find previous commit for rollback')
        return false
      }

      // Create rollback branch
      const rollbackBranch = `hotfix/performance-rollback-${Date.now()}`
      execSync(`git checkout -b ${rollbackBranch}`, { stdio: 'inherit' })

      // Reset to previous commit
      execSync(`git reset --hard ${previousCommit}`, { stdio: 'inherit' })

      // Push rollback branch
      execSync(`git push origin ${rollbackBranch}`, { stdio: 'inherit' })

      console.log(`✅ Rollback branch created: ${rollbackBranch}`)
      console.log(`🔄 Manual deployment of rollback branch required`)

      // In a real deployment, this would trigger the deployment pipeline
      // execSync(`./scripts/deploy-emergency-rollback.sh ${rollbackBranch}`)

      return true
    } catch (error) {
      console.error('❌ Rollback failed:', error.message)
      return false
    }
  } else {
    console.log('⚠️ Non-production environment. Rollback simulation only.')
    console.log(`   Would rollback due to: ${alert.message}`)
    console.log(`   Severity: ${alert.severity}/10`)
    console.log(`   Confidence: ${(alert.confidence * 100).toFixed(1)}%`)
    return true
  }
}

/**
 * Main regression detection function
 */
async function detectPerformanceRegression() {
  console.log('🔍 Starting performance regression analysis...')

  try {
    // Initialize regression detector
    const detector = new PerformanceRegressionDetector(
      DEFAULT_REGRESSION_THRESHOLDS,
      CONFIG.historyFile,
      performRollback
    )

    // Collect current performance metrics
    console.log('📊 Collecting performance metrics...')

    const lighthouseMetrics = extractLighthouseMetrics()
    const bundleMetrics = extractBundleMetrics()
    const realUserMetrics = await extractRealUserMetrics()

    const currentMetrics = {
      timestamp: new Date().toISOString(),
      buildId: CONFIG.buildId,
      gitCommit: CONFIG.gitCommit,
      lighthouse: lighthouseMetrics,
      bundleSize: bundleMetrics,
      realUserMetrics,
      deployment: {
        environment: CONFIG.environment,
        deployedAt: new Date().toISOString(),
      },
    }

    if (CONFIG.verbose) {
      console.log('Current Metrics:')
      console.log(`- Performance Score: ${lighthouseMetrics.performanceScore}`)
      console.log(`- LCP: ${lighthouseMetrics.lcp}ms`)
      console.log(`- CLS: ${lighthouseMetrics.cls}`)
      console.log(`- Bundle Size: ${formatSize(bundleMetrics.totalSize)}`)
    }

    // Analyze for regressions
    console.log('🔬 Analyzing performance regressions...')
    const regressionAlerts = await detector.analyzeRegression(currentMetrics)

    // Process alerts
    await detector.processRegressionAlerts(regressionAlerts)

    // Save metrics to history
    await detector.saveMetricsToHistory(currentMetrics)

    // Generate report
    const report = detector.generateRegressionReport(
      regressionAlerts,
      currentMetrics
    )
    fs.writeFileSync(CONFIG.reportFile, report)
    console.log(`📄 Regression analysis report saved to: ${CONFIG.reportFile}`)

    // Summary
    const critical = regressionAlerts.filter((a) => a.type === 'critical')
    const major = regressionAlerts.filter((a) => a.type === 'major')
    const minor = regressionAlerts.filter((a) => a.type === 'minor')
    const improvements = regressionAlerts.filter(
      (a) => a.type === 'improvement'
    )

    console.log('\n📋 Regression Analysis Summary:')
    console.log(`🚨 Critical Regressions: ${critical.length}`)
    console.log(`⚠️ Major Regressions: ${major.length}`)
    console.log(`📉 Minor Regressions: ${minor.length}`)
    console.log(`📈 Improvements: ${improvements.length}`)

    // Exit with appropriate code
    if (critical.length > 0) {
      console.error('\n❌ Critical performance regressions detected')
      if (CONFIG.enableAutoRollback) {
        console.log('🔄 Automated rollback has been triggered')
      } else {
        console.log('⚠️ Manual intervention required (auto-rollback disabled)')
      }
      process.exit(1)
    } else if (major.length > 0) {
      console.warn(
        '\n⚠️ Major performance regressions detected - investigation required'
      )
      process.exit(0) // Warning but not blocking
    } else if (minor.length > 0) {
      console.log(
        '\n📉 Minor performance regressions detected - monitoring recommended'
      )
    } else if (improvements.length > 0) {
      console.log('\n🎉 Performance improvements detected!')
    } else {
      console.log('\n✅ No significant performance regressions detected')
    }
  } catch (error) {
    console.error('❌ Regression detection failed:', error.message)
    if (CONFIG.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

/**
 * Format bytes into human-readable string
 */
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Performance Regression Detection Script

Usage: node scripts/performance-regression-check.js [options]

Options:
  --auto-rollback  Enable automated rollback for critical regressions
  --verbose        Show detailed information
  --help          Show this help message

Environment Variables:
  ENABLE_AUTO_ROLLBACK   Set to 'true' to enable automated rollback
  ENVIRONMENT           Deployment environment (development/staging/production)
  BUILD_ID              Unique build identifier
  GIT_COMMIT            Git commit hash
  VERBOSE               Set to 'true' to enable verbose output

Examples:
  npm run test:regression
  node scripts/performance-regression-check.js --verbose
  node scripts/performance-regression-check.js --auto-rollback

Prerequisites:
  1. Run Lighthouse CI to generate performance data
  2. Run bundle size analysis to generate bundle data
  3. Ensure sufficient historical data (10+ data points)
`)
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  showHelp()
  process.exit(0)
}

// Run regression detection
detectPerformanceRegression().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
