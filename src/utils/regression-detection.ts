// ABOUTME: Performance regression detection and automated rollback system
// Statistical analysis of performance metrics with automated remediation

import fs from 'fs'

export interface PerformanceMetrics {
  timestamp: string
  buildId: string
  gitCommit: string
  lighthouse: {
    performanceScore: number
    lcp: number // Largest Contentful Paint (ms)
    cls: number // Cumulative Layout Shift
    fid: number // First Input Delay (ms)
    tbt: number // Total Blocking Time (ms)
    speedIndex: number
  }
  bundleSize: {
    totalSize: number
    gzippedSize: number
    javascriptSize: number
    cssSize: number
  }
  realUserMetrics?: {
    avgLcp: number
    avgCls: number
    avgFid: number
    sampleSize: number
  }
  deployment: {
    environment: 'development' | 'staging' | 'production'
    deployedAt: string
    previousCommit?: string
  }
}

export interface RegressionAlert {
  type: 'critical' | 'major' | 'minor' | 'improvement'
  metric: string
  severity: number // 1-10 scale
  message: string
  details: {
    current: number
    baseline: number
    change: number
    changePercentage: number
    threshold: number
    isStatisticallySignificant: boolean
  }
  recommendedAction: 'rollback' | 'investigate' | 'monitor' | 'celebrate'
  confidence: number // 0-1 scale
  timestamp: string
}

export interface RegressionThresholds {
  // Performance score thresholds
  performanceScore: {
    critical: number // Below this triggers rollback
    major: number // Significant regression
    minor: number // Warning level
  }
  // Core Web Vitals thresholds (percentage degradation)
  coreWebVitals: {
    lcp: { critical: number; major: number; minor: number }
    cls: { critical: number; major: number; minor: number }
    fid: { critical: number; major: number; minor: number }
    tbt: { critical: number; major: number; minor: number }
  }
  // Bundle size thresholds (percentage increase)
  bundleSize: {
    total: { critical: number; major: number; minor: number }
    javascript: { critical: number; major: number; minor: number }
    css: { critical: number; major: number; minor: number }
  }
  // Statistical significance requirements
  statistical: {
    minSampleSize: number
    confidenceLevel: number // e.g., 0.95 for 95% confidence
    minDataPoints: number // Minimum historical data points needed
  }
}

export class PerformanceRegressionDetector {
  private thresholds: RegressionThresholds
  private historyFile: string
  private rollbackCallback?: (alert: RegressionAlert) => Promise<boolean>

  constructor(
    thresholds: RegressionThresholds,
    historyFile: string = '.performance-history.json',
    rollbackCallback?: (alert: RegressionAlert) => Promise<boolean>
  ) {
    this.thresholds = thresholds
    this.historyFile = historyFile
    this.rollbackCallback = rollbackCallback
  }

  /**
   * Analyze current metrics against historical baseline
   */
  async analyzeRegression(
    currentMetrics: PerformanceMetrics
  ): Promise<RegressionAlert[]> {
    const alerts: RegressionAlert[] = []
    const history = await this.loadHistory()

    if (history.length < this.thresholds.statistical.minDataPoints) {
      console.warn(
        `Insufficient historical data for regression analysis (${history.length}/${this.thresholds.statistical.minDataPoints})`
      )
      return alerts
    }

    // Calculate baseline metrics using statistical analysis
    const baseline = this.calculateBaseline(history)

    // Analyze Performance Score regression
    const performanceAlert = this.analyzePerformanceScore(
      currentMetrics,
      baseline
    )
    if (performanceAlert) alerts.push(performanceAlert)

    // Analyze Core Web Vitals regressions
    const coreWebVitalsAlerts = this.analyzeCoreWebVitals(
      currentMetrics,
      baseline
    )
    alerts.push(...coreWebVitalsAlerts)

    // Analyze Bundle Size regressions
    const bundleSizeAlerts = this.analyzeBundleSize(currentMetrics, baseline)
    alerts.push(...bundleSizeAlerts)

    // Analyze Real User Metrics (if available)
    if (currentMetrics.realUserMetrics) {
      const rumAlerts = this.analyzeRealUserMetrics(currentMetrics, baseline)
      alerts.push(...rumAlerts)
    }

    return alerts
  }

  /**
   * Calculate statistical baseline from historical data
   */
  private calculateBaseline(history: PerformanceMetrics[]): PerformanceMetrics {
    const recentHistory = history.slice(-20) // Use last 20 data points

    // Calculate statistical averages with outlier filtering
    const calculateRobustMean = (values: number[]): number => {
      const sorted = values.sort((a, b) => a - b)
      const q1Index = Math.floor(sorted.length * 0.25)
      const q3Index = Math.floor(sorted.length * 0.75)
      const iqr = sorted[q3Index] - sorted[q1Index]
      const lowerBound = sorted[q1Index] - 1.5 * iqr
      const upperBound = sorted[q3Index] + 1.5 * iqr

      const filteredValues = sorted.filter(
        (v) => v >= lowerBound && v <= upperBound
      )
      return (
        filteredValues.reduce((sum, val) => sum + val, 0) /
        filteredValues.length
      )
    }

    return {
      timestamp: new Date().toISOString(),
      buildId: 'baseline',
      gitCommit: 'baseline',
      lighthouse: {
        performanceScore: calculateRobustMean(
          recentHistory.map((h) => h.lighthouse.performanceScore)
        ),
        lcp: calculateRobustMean(recentHistory.map((h) => h.lighthouse.lcp)),
        cls: calculateRobustMean(recentHistory.map((h) => h.lighthouse.cls)),
        fid: calculateRobustMean(recentHistory.map((h) => h.lighthouse.fid)),
        tbt: calculateRobustMean(recentHistory.map((h) => h.lighthouse.tbt)),
        speedIndex: calculateRobustMean(
          recentHistory.map((h) => h.lighthouse.speedIndex)
        ),
      },
      bundleSize: {
        totalSize: calculateRobustMean(
          recentHistory.map((h) => h.bundleSize.totalSize)
        ),
        gzippedSize: calculateRobustMean(
          recentHistory.map((h) => h.bundleSize.gzippedSize)
        ),
        javascriptSize: calculateRobustMean(
          recentHistory.map((h) => h.bundleSize.javascriptSize)
        ),
        cssSize: calculateRobustMean(
          recentHistory.map((h) => h.bundleSize.cssSize)
        ),
      },
      deployment: {
        environment: 'development',
        deployedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Analyze Performance Score regression
   */
  private analyzePerformanceScore(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): RegressionAlert | null {
    const currentScore = current.lighthouse.performanceScore
    const baselineScore = baseline.lighthouse.performanceScore
    const change = currentScore - baselineScore
    const changePercentage = (change / baselineScore) * 100

    let type: RegressionAlert['type'] = 'minor'
    let recommendedAction: RegressionAlert['recommendedAction'] = 'monitor'
    let severity = 1

    if (currentScore < this.thresholds.performanceScore.critical) {
      type = 'critical'
      recommendedAction = 'rollback'
      severity = 10
    } else if (currentScore < this.thresholds.performanceScore.major) {
      type = 'major'
      recommendedAction = 'investigate'
      severity = 7
    } else if (currentScore < this.thresholds.performanceScore.minor) {
      type = 'minor'
      recommendedAction = 'investigate'
      severity = 4
    } else if (change > 0.02) {
      // 2% improvement
      type = 'improvement'
      recommendedAction = 'celebrate'
      severity = 1
    } else {
      return null // No significant change
    }

    return {
      type,
      metric: 'Performance Score',
      severity,
      message:
        type === 'improvement'
          ? `Performance score improved by ${Math.abs(changePercentage).toFixed(1)}%`
          : `Performance score degradation detected: ${changePercentage.toFixed(1)}%`,
      details: {
        current: currentScore,
        baseline: baselineScore,
        change,
        changePercentage,
        threshold: this.thresholds.performanceScore.critical,
        isStatisticallySignificant: Math.abs(change) > 0.01, // 1% threshold
      },
      recommendedAction,
      confidence: this.calculateConfidence(Math.abs(changePercentage), type),
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Analyze Core Web Vitals regressions
   */
  private analyzeCoreWebVitals(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = []

    const metrics = [
      {
        name: 'LCP',
        current: current.lighthouse.lcp,
        baseline: baseline.lighthouse.lcp,
        thresholds: this.thresholds.coreWebVitals.lcp,
      },
      {
        name: 'CLS',
        current: current.lighthouse.cls,
        baseline: baseline.lighthouse.cls,
        thresholds: this.thresholds.coreWebVitals.cls,
      },
      {
        name: 'FID',
        current: current.lighthouse.fid,
        baseline: baseline.lighthouse.fid,
        thresholds: this.thresholds.coreWebVitals.fid,
      },
      {
        name: 'TBT',
        current: current.lighthouse.tbt,
        baseline: baseline.lighthouse.tbt,
        thresholds: this.thresholds.coreWebVitals.tbt,
      },
    ]

    for (const metric of metrics) {
      const change = metric.current - metric.baseline
      const changePercentage = (change / metric.baseline) * 100

      if (Math.abs(changePercentage) < 2) continue // Ignore changes < 2%

      let type: RegressionAlert['type'] = 'minor'
      let recommendedAction: RegressionAlert['recommendedAction'] = 'monitor'
      let severity = 1

      if (changePercentage > metric.thresholds.critical) {
        type = 'critical'
        recommendedAction = 'rollback'
        severity = 9
      } else if (changePercentage > metric.thresholds.major) {
        type = 'major'
        recommendedAction = 'investigate'
        severity = 6
      } else if (changePercentage > metric.thresholds.minor) {
        type = 'minor'
        recommendedAction = 'investigate'
        severity = 3
      } else if (changePercentage < -10) {
        // 10% improvement
        type = 'improvement'
        recommendedAction = 'celebrate'
        severity = 1
      } else {
        continue
      }

      alerts.push({
        type,
        metric: metric.name,
        severity,
        message:
          type === 'improvement'
            ? `${metric.name} improved by ${Math.abs(changePercentage).toFixed(1)}%`
            : `${metric.name} regression detected: +${changePercentage.toFixed(1)}%`,
        details: {
          current: metric.current,
          baseline: metric.baseline,
          change,
          changePercentage,
          threshold: metric.thresholds.critical,
          isStatisticallySignificant: Math.abs(changePercentage) > 5,
        },
        recommendedAction,
        confidence: this.calculateConfidence(Math.abs(changePercentage), type),
        timestamp: new Date().toISOString(),
      })
    }

    return alerts
  }

  /**
   * Analyze Bundle Size regressions
   */
  private analyzeBundleSize(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = []

    const metrics = [
      {
        name: 'Total Bundle Size',
        current: current.bundleSize.totalSize,
        baseline: baseline.bundleSize.totalSize,
        thresholds: this.thresholds.bundleSize.total,
      },
      {
        name: 'JavaScript Size',
        current: current.bundleSize.javascriptSize,
        baseline: baseline.bundleSize.javascriptSize,
        thresholds: this.thresholds.bundleSize.javascript,
      },
      {
        name: 'CSS Size',
        current: current.bundleSize.cssSize,
        baseline: baseline.bundleSize.cssSize,
        thresholds: this.thresholds.bundleSize.css,
      },
    ]

    for (const metric of metrics) {
      const change = metric.current - metric.baseline
      const changePercentage = (change / metric.baseline) * 100

      if (Math.abs(changePercentage) < 1) continue // Ignore changes < 1%

      let type: RegressionAlert['type'] = 'minor'
      let recommendedAction: RegressionAlert['recommendedAction'] = 'monitor'
      let severity = 1

      if (changePercentage > metric.thresholds.critical) {
        type = 'critical'
        recommendedAction = 'rollback'
        severity = 8
      } else if (changePercentage > metric.thresholds.major) {
        type = 'major'
        recommendedAction = 'investigate'
        severity = 5
      } else if (changePercentage > metric.thresholds.minor) {
        type = 'minor'
        recommendedAction = 'investigate'
        severity = 2
      } else if (changePercentage < -5) {
        // 5% reduction
        type = 'improvement'
        recommendedAction = 'celebrate'
        severity = 1
      } else {
        continue
      }

      alerts.push({
        type,
        metric: metric.name,
        severity,
        message:
          type === 'improvement'
            ? `${metric.name} reduced by ${Math.abs(changePercentage).toFixed(1)}%`
            : `${metric.name} increased by ${changePercentage.toFixed(1)}%`,
        details: {
          current: metric.current,
          baseline: metric.baseline,
          change,
          changePercentage,
          threshold: metric.thresholds.critical,
          isStatisticallySignificant: Math.abs(change) > 10000, // 10KB threshold
        },
        recommendedAction,
        confidence: this.calculateConfidence(Math.abs(changePercentage), type),
        timestamp: new Date().toISOString(),
      })
    }

    return alerts
  }

  /**
   * Analyze Real User Metrics regressions
   */
  private analyzeRealUserMetrics(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = []

    if (!current.realUserMetrics || !baseline.realUserMetrics) {
      return alerts
    }

    const rum = current.realUserMetrics
    const baselineRum = baseline.realUserMetrics

    // Only analyze if we have sufficient sample size
    if (rum.sampleSize < this.thresholds.statistical.minSampleSize) {
      return alerts
    }

    const metrics = [
      {
        name: 'Real User LCP',
        current: rum.avgLcp,
        baseline: baselineRum.avgLcp,
      },
      {
        name: 'Real User CLS',
        current: rum.avgCls,
        baseline: baselineRum.avgCls,
      },
      {
        name: 'Real User FID',
        current: rum.avgFid,
        baseline: baselineRum.avgFid,
      },
    ]

    for (const metric of metrics) {
      const change = metric.current - metric.baseline
      const changePercentage = (change / metric.baseline) * 100

      if (Math.abs(changePercentage) < 5) continue // Ignore changes < 5% for RUM

      let type: RegressionAlert['type'] = 'minor'
      let recommendedAction: RegressionAlert['recommendedAction'] =
        'investigate'
      let severity = 3

      if (changePercentage > 25) {
        type = 'critical'
        recommendedAction = 'rollback'
        severity = 9
      } else if (changePercentage > 15) {
        type = 'major'
        recommendedAction = 'investigate'
        severity = 6
      } else if (changePercentage < -15) {
        type = 'improvement'
        recommendedAction = 'celebrate'
        severity = 1
      }

      alerts.push({
        type,
        metric: metric.name,
        severity,
        message:
          type === 'improvement'
            ? `${metric.name} improved by ${Math.abs(changePercentage).toFixed(1)}% (n=${rum.sampleSize})`
            : `${metric.name} regression in real users: +${changePercentage.toFixed(1)}% (n=${rum.sampleSize})`,
        details: {
          current: metric.current,
          baseline: metric.baseline,
          change,
          changePercentage,
          threshold: 25, // 25% threshold for RUM
          isStatisticallySignificant:
            rum.sampleSize >= this.thresholds.statistical.minSampleSize,
        },
        recommendedAction,
        confidence: Math.min(rum.sampleSize / 1000, 1), // Higher confidence with more samples
        timestamp: new Date().toISOString(),
      })
    }

    return alerts
  }

  /**
   * Calculate confidence level for regression detection
   */
  private calculateConfidence(
    changePercentage: number,
    type: RegressionAlert['type']
  ): number {
    const baseConfidence = Math.min(changePercentage / 20, 1) // Higher change = higher confidence

    switch (type) {
      case 'critical':
        return Math.max(baseConfidence, 0.9)
      case 'major':
        return Math.max(baseConfidence, 0.8)
      case 'minor':
        return Math.max(baseConfidence, 0.6)
      case 'improvement':
        return Math.max(baseConfidence, 0.7)
      default:
        return baseConfidence
    }
  }

  /**
   * Process regression alerts and trigger automated responses
   */
  async processRegressionAlerts(alerts: RegressionAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Log alert
      const emoji = this.getAlertEmoji(alert.type)
      console.log(`${emoji} Regression Alert: ${alert.message}`)
      console.log(`   Severity: ${alert.severity}/10`)
      console.log(`   Confidence: ${(alert.confidence * 100).toFixed(1)}%`)
      console.log(`   Recommended Action: ${alert.recommendedAction}`)

      // Trigger automated rollback for critical issues
      if (
        alert.type === 'critical' &&
        alert.recommendedAction === 'rollback' &&
        this.rollbackCallback
      ) {
        console.log(
          `🔄 Triggering automated rollback for critical ${alert.metric} regression...`
        )

        try {
          const rollbackSuccess = await this.rollbackCallback(alert)
          if (rollbackSuccess) {
            console.log('✅ Automated rollback completed successfully')
          } else {
            console.log(
              '❌ Automated rollback failed - manual intervention required'
            )
          }
        } catch (error) {
          console.error('❌ Rollback error:', error)
        }
      }
    }
  }

  /**
   * Save metrics to history for future regression analysis
   */
  async saveMetricsToHistory(metrics: PerformanceMetrics): Promise<void> {
    try {
      const history = await this.loadHistory()
      history.push(metrics)

      // Keep only last 100 data points to avoid file bloat
      if (history.length > 100) {
        history.splice(0, history.length - 100)
      }

      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2))
    } catch (error) {
      console.error('Failed to save performance history:', error)
    }
  }

  /**
   * Load performance history from file
   */
  private async loadHistory(): Promise<PerformanceMetrics[]> {
    try {
      if (fs.existsSync(this.historyFile)) {
        const content = fs.readFileSync(this.historyFile, 'utf8').trim()
        if (content) {
          return JSON.parse(content)
        }
      }
    } catch (error) {
      console.warn('Could not load performance history:', error)
    }
    return []
  }

  /**
   * Get emoji for alert type
   */
  private getAlertEmoji(type: RegressionAlert['type']): string {
    switch (type) {
      case 'critical':
        return '🚨'
      case 'major':
        return '⚠️'
      case 'minor':
        return '📉'
      case 'improvement':
        return '📈'
      default:
        return '📊'
    }
  }

  /**
   * Generate regression analysis report
   */
  generateRegressionReport(
    alerts: RegressionAlert[],
    metrics: PerformanceMetrics
  ): string {
    const report = []

    report.push('# Performance Regression Analysis Report')
    report.push('')
    report.push(`Generated: ${new Date().toISOString()}`)
    report.push(`Build ID: ${metrics.buildId}`)
    report.push(`Git Commit: ${metrics.gitCommit}`)
    report.push(`Environment: ${metrics.deployment.environment}`)
    report.push('')

    // Summary
    const critical = alerts.filter((a) => a.type === 'critical')
    const major = alerts.filter((a) => a.type === 'major')
    const minor = alerts.filter((a) => a.type === 'minor')
    const improvements = alerts.filter((a) => a.type === 'improvement')

    report.push('## Executive Summary')
    report.push(`- 🚨 Critical Regressions: ${critical.length}`)
    report.push(`- ⚠️ Major Regressions: ${major.length}`)
    report.push(`- 📉 Minor Regressions: ${minor.length}`)
    report.push(`- 📈 Improvements: ${improvements.length}`)
    report.push('')

    // Current Metrics
    report.push('## Current Performance Metrics')
    report.push(
      `- **Performance Score**: ${metrics.lighthouse.performanceScore.toFixed(2)}`
    )
    report.push(`- **LCP**: ${metrics.lighthouse.lcp}ms`)
    report.push(`- **CLS**: ${metrics.lighthouse.cls.toFixed(3)}`)
    report.push(`- **TBT**: ${metrics.lighthouse.tbt}ms`)
    report.push(
      `- **Bundle Size**: ${this.formatSize(metrics.bundleSize.totalSize)}`
    )
    report.push('')

    // Detailed Alerts
    if (alerts.length > 0) {
      report.push('## Regression Details')

      for (const alert of alerts.sort((a, b) => b.severity - a.severity)) {
        const emoji = this.getAlertEmoji(alert.type)
        report.push(
          `### ${emoji} ${alert.metric} - ${alert.type.toUpperCase()}`
        )
        report.push(`**Message**: ${alert.message}`)
        report.push(`**Severity**: ${alert.severity}/10`)
        report.push(`**Confidence**: ${(alert.confidence * 100).toFixed(1)}%`)
        report.push(`**Recommended Action**: ${alert.recommendedAction}`)
        report.push('')
        report.push('**Details**:')
        report.push(`- Current: ${alert.details.current}`)
        report.push(`- Baseline: ${alert.details.baseline}`)
        report.push(
          `- Change: ${alert.details.change > 0 ? '+' : ''}${alert.details.change}`
        )
        report.push(
          `- Change %: ${alert.details.changePercentage > 0 ? '+' : ''}${alert.details.changePercentage.toFixed(2)}%`
        )
        report.push(
          `- Statistically Significant: ${alert.details.isStatisticallySignificant ? 'Yes' : 'No'}`
        )
        report.push('')
      }
    }

    return report.join('\n')
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
}

// Default regression thresholds based on Phase 2C targets
export const DEFAULT_REGRESSION_THRESHOLDS: RegressionThresholds = {
  performanceScore: {
    critical: 0.95, // Below 95% triggers rollback
    major: 0.97, // Below 97% is major regression
    minor: 0.98, // Below 98% is minor regression
  },
  coreWebVitals: {
    lcp: { critical: 25, major: 15, minor: 5 }, // % increase thresholds
    cls: { critical: 50, major: 25, minor: 10 },
    fid: { critical: 30, major: 20, minor: 10 },
    tbt: { critical: 25, major: 15, minor: 5 },
  },
  bundleSize: {
    total: { critical: 10, major: 5, minor: 2 }, // % increase thresholds
    javascript: { critical: 15, major: 8, minor: 3 },
    css: { critical: 20, major: 10, minor: 5 },
  },
  statistical: {
    minSampleSize: 100, // Minimum RUM sample size
    confidenceLevel: 0.95, // 95% confidence level
    minDataPoints: 10, // Minimum historical data points
  },
}
