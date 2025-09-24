// ABOUTME: Bundle size monitoring and alerting system for performance budget enforcement
// Tracks bundle size changes, detects regressions, and triggers alerts

import fs from 'fs'
import path from 'path'

export interface BundleStats {
  totalSize: number
  gzippedSize: number
  chunks: Array<{
    name: string
    size: number
    gzippedSize?: number
    type: 'initial' | 'async' | 'runtime'
  }>
  assets: Array<{
    name: string
    size: number
    type: 'js' | 'css' | 'image' | 'font' | 'other'
  }>
  timestamp: string
  gitCommit?: string
  buildId?: string
}

export interface BundleBudget {
  // Total bundle size limits (in bytes)
  maxTotalSize: number
  maxGzippedSize: number

  // Individual chunk limits
  maxInitialChunkSize: number
  maxAsyncChunkSize: number

  // Asset type limits
  maxJavaScriptSize: number
  maxCSSSize: number
  maxImageSize: number
  maxFontSize: number

  // Regression thresholds (percentage increase)
  regressionThreshold: number
  warningThreshold: number
}

export interface BundleAlert {
  type: 'error' | 'warning' | 'info'
  category: 'size_limit' | 'regression' | 'budget_exceeded' | 'optimization'
  message: string
  details: {
    current: number
    threshold: number
    increase?: number
    percentage?: number
  }
  timestamp: string
}

export class BundleMonitor {
  private budgets: BundleBudget
  private historyFile: string
  private alertCallback?: (alert: BundleAlert) => void

  constructor(
    budgets: BundleBudget,
    historyFile: string = '.bundle-history.json',
    alertCallback?: (alert: BundleAlert) => void
  ) {
    this.budgets = budgets
    this.historyFile = historyFile
    this.alertCallback = alertCallback
  }

  /**
   * Analyze Next.js build output and extract bundle statistics
   * Focuses on client-side First Load JS (rootMainFiles + polyfillFiles)
   */
  async analyzeBuild(buildDir: string = '.next'): Promise<BundleStats> {
    const buildManifest = path.join(buildDir, 'build-manifest.json')

    if (!fs.existsSync(buildManifest)) {
      throw new Error(`Build manifest not found: ${buildManifest}`)
    }

    const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'))
    const chunks: BundleStats['chunks'] = []
    const assets: BundleStats['assets'] = []
    let totalSize = 0

    // Analyze First Load JS (rootMainFiles + polyfillFiles) - the critical client-side bundle
    const firstLoadFiles = [
      ...(manifest.rootMainFiles || []),
      ...(manifest.polyfillFiles || []),
    ]

    for (const file of firstLoadFiles) {
      // Files in manifest already include "static/" prefix, so join with buildDir directly
      const filePath = path.join(buildDir, file)

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        const chunkName = path.basename(file)

        const isJS = file.endsWith('.js')
        const isCSS = file.endsWith('.css')

        chunks.push({
          name: chunkName,
          size: stats.size,
          type: 'initial', // First Load JS is always initial
        })

        assets.push({
          name: file,
          size: stats.size,
          type: isJS ? 'js' : isCSS ? 'css' : 'other',
        })

        totalSize += stats.size
      }
    }

    // Analyze page-specific chunks (async chunks)
    for (const [page, files] of Object.entries(manifest.pages || {})) {
      const pageFiles = files as string[]
      for (const file of pageFiles) {
        // Skip files already counted in First Load JS
        if (firstLoadFiles.includes(file)) {
          continue
        }

        // Files in manifest already include "static/" prefix
        const filePath = path.join(buildDir, file)
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          const chunkName = `${page}-${path.basename(file)}`

          const isJS = file.endsWith('.js')
          const isCSS = file.endsWith('.css')

          chunks.push({
            name: chunkName,
            size: stats.size,
            type: 'async',
          })

          assets.push({
            name: file,
            size: stats.size,
            type: isJS ? 'js' : isCSS ? 'css' : 'other',
          })

          totalSize += stats.size
        }
      }
    }

    // Calculate gzipped size estimation (rough approximation)
    const gzippedSize = Math.round(totalSize * 0.3) // Typical gzip ratio

    const bundleStats: BundleStats = {
      totalSize,
      gzippedSize,
      chunks,
      assets,
      timestamp: new Date().toISOString(),
      gitCommit: process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA,
      buildId: process.env.BUILD_ID || process.env.VERCEL_DEPLOYMENT_ID,
    }

    return bundleStats
  }

  /**
   * Validate bundle against budgets and detect regressions
   */
  async validateBundle(stats: BundleStats): Promise<BundleAlert[]> {
    const alerts: BundleAlert[] = []

    // Check total size budget
    if (stats.totalSize > this.budgets.maxTotalSize) {
      alerts.push({
        type: 'error',
        category: 'size_limit',
        message: `Total bundle size exceeds budget`,
        details: {
          current: stats.totalSize,
          threshold: this.budgets.maxTotalSize,
          percentage: Math.round(
            ((stats.totalSize - this.budgets.maxTotalSize) /
              this.budgets.maxTotalSize) *
              100
          ),
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Check gzipped size budget
    if (stats.gzippedSize > this.budgets.maxGzippedSize) {
      alerts.push({
        type: 'error',
        category: 'size_limit',
        message: `Gzipped bundle size exceeds budget`,
        details: {
          current: stats.gzippedSize,
          threshold: this.budgets.maxGzippedSize,
          percentage: Math.round(
            ((stats.gzippedSize - this.budgets.maxGzippedSize) /
              this.budgets.maxGzippedSize) *
              100
          ),
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Check individual chunk sizes
    for (const chunk of stats.chunks) {
      const limit =
        chunk.type === 'initial'
          ? this.budgets.maxInitialChunkSize
          : this.budgets.maxAsyncChunkSize

      if (chunk.size > limit) {
        alerts.push({
          type: 'warning',
          category: 'size_limit',
          message: `Chunk "${chunk.name}" exceeds size limit`,
          details: {
            current: chunk.size,
            threshold: limit,
            percentage: Math.round(((chunk.size - limit) / limit) * 100),
          },
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Check asset type budgets
    const assetSizes = {
      js: stats.assets
        .filter((a) => a.type === 'js')
        .reduce((sum, a) => sum + a.size, 0),
      css: stats.assets
        .filter((a) => a.type === 'css')
        .reduce((sum, a) => sum + a.size, 0),
      image: stats.assets
        .filter((a) => a.type === 'image')
        .reduce((sum, a) => sum + a.size, 0),
      font: stats.assets
        .filter((a) => a.type === 'font')
        .reduce((sum, a) => sum + a.size, 0),
    }

    const budgetChecks = [
      {
        type: 'JavaScript',
        size: assetSizes.js,
        budget: this.budgets.maxJavaScriptSize,
      },
      { type: 'CSS', size: assetSizes.css, budget: this.budgets.maxCSSSize },
      {
        type: 'Images',
        size: assetSizes.image,
        budget: this.budgets.maxImageSize,
      },
      {
        type: 'Fonts',
        size: assetSizes.font,
        budget: this.budgets.maxFontSize,
      },
    ]

    for (const check of budgetChecks) {
      if (check.size > check.budget) {
        alerts.push({
          type: 'warning',
          category: 'budget_exceeded',
          message: `${check.type} assets exceed budget`,
          details: {
            current: check.size,
            threshold: check.budget,
            percentage: Math.round(
              ((check.size - check.budget) / check.budget) * 100
            ),
          },
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Check for regressions against historical data
    const regressionAlerts = await this.detectRegressions(stats)
    alerts.push(...regressionAlerts)

    return alerts
  }

  /**
   * Detect size regressions compared to previous builds
   */
  private async detectRegressions(
    currentStats: BundleStats
  ): Promise<BundleAlert[]> {
    const alerts: BundleAlert[] = []

    try {
      const history = await this.loadHistory()
      if (history.length === 0) {
        return alerts // No history to compare against
      }

      // Get the most recent previous build
      const previousStats = history[history.length - 1]

      // Check total size regression
      const sizeIncrease = currentStats.totalSize - previousStats.totalSize
      const sizeIncreasePercentage =
        (sizeIncrease / previousStats.totalSize) * 100

      if (sizeIncreasePercentage > this.budgets.regressionThreshold) {
        alerts.push({
          type: 'error',
          category: 'regression',
          message: `Significant bundle size regression detected`,
          details: {
            current: currentStats.totalSize,
            threshold:
              previousStats.totalSize *
              (1 + this.budgets.regressionThreshold / 100),
            increase: sizeIncrease,
            percentage: Math.round(sizeIncreasePercentage * 100) / 100,
          },
          timestamp: new Date().toISOString(),
        })
      } else if (sizeIncreasePercentage > this.budgets.warningThreshold) {
        alerts.push({
          type: 'warning',
          category: 'regression',
          message: `Bundle size increase detected`,
          details: {
            current: currentStats.totalSize,
            threshold:
              previousStats.totalSize *
              (1 + this.budgets.warningThreshold / 100),
            increase: sizeIncrease,
            percentage: Math.round(sizeIncreasePercentage * 100) / 100,
          },
          timestamp: new Date().toISOString(),
        })
      }

      // Check for significant improvements to celebrate
      if (sizeIncreasePercentage < -5) {
        alerts.push({
          type: 'info',
          category: 'optimization',
          message: `Bundle size optimization detected`,
          details: {
            current: currentStats.totalSize,
            threshold: previousStats.totalSize,
            increase: sizeIncrease,
            percentage: Math.round(sizeIncreasePercentage * 100) / 100,
          },
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.warn(
        'Could not load bundle history for regression detection:',
        error
      )
    }

    return alerts
  }

  /**
   * Save bundle statistics to history
   */
  async saveToHistory(stats: BundleStats): Promise<void> {
    try {
      const history = await this.loadHistory()
      history.push(stats)

      // Keep only last 50 builds to avoid file bloat
      if (history.length > 50) {
        history.splice(0, history.length - 50)
      }

      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2))
    } catch (error) {
      console.error('Failed to save bundle history:', error)
    }
  }

  /**
   * Load bundle history from file
   */
  private async loadHistory(): Promise<BundleStats[]> {
    try {
      if (fs.existsSync(this.historyFile)) {
        const content = fs.readFileSync(this.historyFile, 'utf8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.warn('Could not load bundle history:', error)
    }
    return []
  }

  /**
   * Process alerts and trigger notifications
   */
  async processAlerts(alerts: BundleAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Log to console
      const emoji =
        alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : '📊'
      console.log(`${emoji} Bundle Monitor: ${alert.message}`)
      console.log(`   Current: ${this.formatSize(alert.details.current)}`)
      console.log(`   Threshold: ${this.formatSize(alert.details.threshold)}`)

      if (alert.details.percentage) {
        const sign = alert.details.percentage > 0 ? '+' : ''
        console.log(`   Change: ${sign}${alert.details.percentage}%`)
      }

      // Trigger callback if provided
      if (this.alertCallback) {
        this.alertCallback(alert)
      }
    }
  }

  /**
   * Format bytes into human-readable string
   */
  private formatSize(bytes: number): string {
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
   * Generate bundle size report
   */
  generateReport(stats: BundleStats, alerts: BundleAlert[]): string {
    const report = []

    report.push('# Bundle Size Report')
    report.push('')
    report.push(`Generated: ${new Date().toISOString()}`)
    if (stats.gitCommit) report.push(`Git Commit: ${stats.gitCommit}`)
    if (stats.buildId) report.push(`Build ID: ${stats.buildId}`)
    report.push('')

    // Summary
    report.push('## Summary')
    report.push(`- Total Size: ${this.formatSize(stats.totalSize)}`)
    report.push(`- Gzipped Size: ${this.formatSize(stats.gzippedSize)}`)
    report.push(`- Chunks: ${stats.chunks.length}`)
    report.push(`- Assets: ${stats.assets.length}`)
    report.push('')

    // Alerts
    if (alerts.length > 0) {
      report.push('## Alerts')
      for (const alert of alerts) {
        const emoji =
          alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : '📊'
        report.push(
          `${emoji} **${alert.type.toUpperCase()}**: ${alert.message}`
        )
        report.push(`   - Current: ${this.formatSize(alert.details.current)}`)
        report.push(
          `   - Threshold: ${this.formatSize(alert.details.threshold)}`
        )
        if (alert.details.percentage) {
          const sign = alert.details.percentage > 0 ? '+' : ''
          report.push(`   - Change: ${sign}${alert.details.percentage}%`)
        }
        report.push('')
      }
    }

    // Largest chunks
    report.push('## Largest Chunks')
    const largestChunks = [...stats.chunks]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)

    for (const chunk of largestChunks) {
      report.push(
        `- ${chunk.name}: ${this.formatSize(chunk.size)} (${chunk.type})`
      )
    }
    report.push('')

    // Asset breakdown
    report.push('## Asset Breakdown')
    const assetTypes = stats.assets.reduce(
      (acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + asset.size
        return acc
      },
      {} as Record<string, number>
    )

    for (const [type, size] of Object.entries(assetTypes)) {
      report.push(`- ${type.toUpperCase()}: ${this.formatSize(size)}`)
    }

    return report.join('\n')
  }
}

// Default budget configuration based on actual Next.js 15 App Router performance
export const DEFAULT_BUNDLE_BUDGET: BundleBudget = {
  // Total bundle limits - based on Next.js actual output of ~1.22-1.28MB
  maxTotalSize: 5200000, // 5.2MB for client bundles (uncompressed, accounts for CI 5% reduction)
  maxGzippedSize: 1500000, // 1.5MB gzipped (matches Next.js First Load JS target)

  // Individual chunk limits
  maxInitialChunkSize: 600000, // 600KB for initial chunks (vendor bundles can be large)
  maxAsyncChunkSize: 300000, // 300KB for async chunks

  // Asset type limits - realistic for a modern Next.js app
  maxJavaScriptSize: 4500000, // 4.5MB for all client JS (uncompressed)
  maxCSSSize: 200000, // 200KB for all CSS
  maxImageSize: 400000, // 400KB for all images
  maxFontSize: 700000, // 700KB for all fonts (current: 644KB)

  // Regression thresholds
  regressionThreshold: 10, // 10% increase triggers error
  warningThreshold: 5, // 5% increase triggers warning
}
