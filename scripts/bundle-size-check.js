#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

// ABOUTME: Bundle size validation script for CI/CD pipeline
// Analyzes Next.js build output and validates against performance budgets

const {
  BundleMonitor,
  DEFAULT_BUNDLE_BUDGET,
} = require('./compiled/bundle-monitor.js')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  buildDir: '.next',
  outputFile: 'bundle-size-report.md',
  historyFile: '.bundle-history.json',
  exitOnError: process.env.CI === 'true' || process.argv.includes('--strict'),
  verbose: process.argv.includes('--verbose') || process.env.VERBOSE === 'true',
}

// Enhanced budget for stricter CI enforcement
const CI_BUDGET = {
  ...DEFAULT_BUNDLE_BUDGET,
  // Slightly stricter limits for CI to catch regressions early
  maxTotalSize: DEFAULT_BUNDLE_BUDGET.maxTotalSize * 0.95, // 5% buffer
  maxGzippedSize: DEFAULT_BUNDLE_BUDGET.maxGzippedSize * 0.95,
  regressionThreshold: 3, // More sensitive in CI
  warningThreshold: 1,
}

/**
 * Main bundle size validation function
 */
async function validateBundleSize() {
  console.log('🔍 Starting bundle size validation...')

  try {
    // Initialize bundle monitor
    const budget = process.env.CI ? CI_BUDGET : DEFAULT_BUNDLE_BUDGET
    const monitor = new BundleMonitor(budget, CONFIG.historyFile, handleAlert)

    // Analyze current build
    console.log(`📊 Analyzing build directory: ${CONFIG.buildDir}`)
    const stats = await monitor.analyzeBuild(CONFIG.buildDir)

    if (CONFIG.verbose) {
      console.log('Bundle Statistics:')
      console.log(`- Total Size: ${formatSize(stats.totalSize)}`)
      console.log(`- Gzipped Size: ${formatSize(stats.gzippedSize)}`)
      console.log(`- Chunks: ${stats.chunks.length}`)
      console.log(`- Assets: ${stats.assets.length}`)
    }

    // Validate against budgets
    console.log('⚖️  Validating against performance budgets...')
    const alerts = await monitor.validateBundle(stats)

    // Process alerts
    await monitor.processAlerts(alerts)

    // Save to history for regression tracking
    await monitor.saveToHistory(stats)

    // Generate report
    const report = monitor.generateReport(stats, alerts)
    fs.writeFileSync(CONFIG.outputFile, report)
    console.log(`📄 Report saved to: ${CONFIG.outputFile}`)

    // Summary
    const errors = alerts.filter((a) => a.type === 'error')
    const warnings = alerts.filter((a) => a.type === 'warning')
    const infos = alerts.filter((a) => a.type === 'info')

    console.log('\n📋 Validation Summary:')
    console.log(`✅ Build analyzed successfully`)
    console.log(
      `📊 Total size: ${formatSize(stats.totalSize)} (budget: ${formatSize(budget.maxTotalSize)})`
    )
    console.log(
      `🗜️  Gzipped size: ${formatSize(stats.gzippedSize)} (budget: ${formatSize(budget.maxGzippedSize)})`
    )

    if (infos.length > 0) {
      console.log(`📈 Optimizations: ${infos.length}`)
    }
    if (warnings.length > 0) {
      console.log(`⚠️  Warnings: ${warnings.length}`)
    }
    if (errors.length > 0) {
      console.log(`🚨 Errors: ${errors.length}`)
    }

    // Exit with appropriate code
    if (errors.length > 0 && CONFIG.exitOnError) {
      console.error(
        '\n❌ Bundle size validation failed due to budget violations'
      )
      process.exit(1)
    } else if (errors.length > 0) {
      console.warn(
        '\n⚠️  Bundle size validation completed with errors (non-blocking)'
      )
    } else if (warnings.length > 0) {
      console.log('\n✅ Bundle size validation completed with warnings')
    } else {
      console.log('\n🎉 Bundle size validation passed successfully!')
    }
  } catch (error) {
    console.error('❌ Bundle size validation failed:', error.message)
    if (CONFIG.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

/**
 * Handle alerts during validation
 */
function handleAlert(alert) {
  // Could integrate with external alerting systems here
  // For now, just log to console (already handled by processAlerts)

  // In CI/CD, could post to Slack, Discord, etc.
  if (process.env.SLACK_WEBHOOK_URL && alert.type === 'error') {
    // Example: postToSlack(alert)
  }

  // In CI/CD, could comment on PR
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_PR_NUMBER) {
    // Example: commentOnPR(alert)
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
Bundle Size Validation Script

Usage: node scripts/bundle-size-check.js [options]

Options:
  --strict     Exit with error code on budget violations (default in CI)
  --verbose    Show detailed information
  --help       Show this help message

Environment Variables:
  CI           Set to 'true' to enable strict mode
  VERBOSE      Set to 'true' to enable verbose output

Examples:
  npm run check-bundle-size
  node scripts/bundle-size-check.js --verbose
  node scripts/bundle-size-check.js --strict
`)
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  showHelp()
  process.exit(0)
}

// Run validation
validateBundleSize().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
