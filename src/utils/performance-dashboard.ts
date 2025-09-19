// ABOUTME: Performance monitoring dashboard with real-time alerting and historical analysis
// Provides comprehensive performance insights for textile-showcase with automated alerts

import type {
  PerformanceMetric,
  MetricSeries,
  AlertRule,
  DashboardConfig,
  PerformanceAnalysis,
} from '../types/performance'
import { DEFAULT_PERFORMANCE_BUDGET } from '../types/performance'

/**
 * Performance dashboard with real-time monitoring and alerting
 */
export class PerformanceDashboard {
  private metrics: Map<string, MetricSeries> = new Map()
  private alerts: AlertRule[] = []
  private config: DashboardConfig
  private alertHistory: Array<{
    rule: AlertRule
    metric: MetricSeries
    timestamp: number
  }> = []
  private subscribers: Map<string, ((metric: MetricSeries | null) => void)[]> =
    new Map()

  constructor(config: DashboardConfig) {
    this.config = config
    this.initializeDefaultAlerts()
    this.startMonitoring()
  }

  /**
   * Initialize default alert rules based on performance targets
   */
  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertRule[] = [
      // Core Web Vitals critical alerts
      {
        metric: 'LCP',
        threshold: 1200, // 1.2s
        operator: '>',
        severity: 'critical',
        duration: 5000, // 5 seconds
        message: 'Largest Contentful Paint exceeded 1.2s target',
        destinations: ['console', 'analytics'],
        enabled: true,
      },
      {
        metric: 'FCP',
        threshold: 1200, // 1.2s
        operator: '>',
        severity: 'warning',
        duration: 5000,
        message: 'First Contentful Paint exceeded 1.2s target',
        destinations: ['console', 'analytics'],
        enabled: true,
      },
      {
        metric: 'CLS',
        threshold: 0.1,
        operator: '>',
        severity: 'critical',
        duration: 3000,
        message: 'Cumulative Layout Shift exceeded 0.1 threshold',
        destinations: ['console', 'analytics'],
        enabled: true,
      },
      {
        metric: 'FID',
        threshold: 100, // 100ms
        operator: '>',
        severity: 'warning',
        duration: 3000,
        message: 'First Input Delay exceeded 100ms threshold',
        destinations: ['console', 'analytics'],
        enabled: true,
      },
      {
        metric: 'TTFB',
        threshold: 800, // 800ms
        operator: '>',
        severity: 'warning',
        duration: 5000,
        message: 'Time to First Byte exceeded 800ms threshold',
        destinations: ['console', 'analytics'],
        enabled: true,
      },

      // Performance score alerts
      {
        metric: 'lighthouse-score',
        threshold: 98,
        operator: '<',
        severity: 'critical',
        duration: 10000,
        message: 'Lighthouse Performance Score below 98% target',
        destinations: ['console', 'analytics'],
        enabled: true,
      },

      // Resource budget alerts
      {
        metric: 'bundle-size',
        threshold: 1500000, // 1.5MB
        operator: '>',
        severity: 'warning',
        duration: 0,
        message: 'Bundle size exceeded 1.5MB budget',
        destinations: ['console', 'analytics'],
        enabled: true,
      },

      // Service worker performance alerts
      {
        metric: 'cache-hit-ratio',
        threshold: 85, // 85%
        operator: '<',
        severity: 'warning',
        duration: 30000,
        message: 'Cache hit ratio below 85% threshold',
        destinations: ['console', 'analytics'],
        enabled: true,
      },

      // User experience alerts
      {
        metric: 'bounce-rate',
        threshold: 40, // 40%
        operator: '>',
        severity: 'info',
        duration: 60000,
        message: 'Bounce rate above 40% - potential performance impact',
        destinations: ['analytics'],
        enabled: true,
      },
    ]

    this.alerts = [...defaultAlerts, ...this.config.alerts]
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    // Check alerts every 5 seconds
    setInterval(() => {
      this.checkAlerts()
    }, 5000)

    // Update dashboard every 30 seconds
    setInterval(() => {
      this.updateDashboard()
    }, 30000)

    // Cleanup old data every 5 minutes
    setInterval(() => {
      this.cleanupOldData()
    }, 300000)

    console.log('[Dashboard] Performance monitoring started')
  }

  /**
   * Add performance metric to dashboard
   */
  addMetric(metric: PerformanceMetric): void {
    const series =
      this.metrics.get(metric.name) || this.createMetricSeries(metric.name)
    this.updateMetricSeries(series, metric.value, metric.timestamp)
    this.metrics.set(metric.name, series)

    // Notify subscribers
    this.notifySubscribers(metric.name, series)

    // Check if this metric triggers any alerts
    this.checkMetricAlerts(metric.name, metric.value)
  }

  /**
   * Create new metric series
   */
  private createMetricSeries(name: string): MetricSeries {
    return {
      name,
      current: 0,
      previous: 0,
      trend: 'stable',
      changePercent: 0,
      history: [],
      stats: {
        min: Infinity,
        max: -Infinity,
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
      },
    }
  }

  /**
   * Update metric series with new data point
   */
  private updateMetricSeries(
    series: MetricSeries,
    value: number,
    timestamp: number
  ): void {
    // Update current and previous values
    series.previous = series.current
    series.current = value

    // Calculate trend and change percentage
    if (series.previous > 0) {
      const change = value - series.previous
      series.changePercent = (change / series.previous) * 100

      if (Math.abs(series.changePercent) < 5) {
        series.trend = 'stable'
      } else if (change > 0) {
        series.trend = 'up'
      } else {
        series.trend = 'down'
      }
    }

    // Add to history
    series.history.push({
      value,
      timestamp: timestamp || Date.now(),
    })

    // Limit history to last 1000 points
    if (series.history.length > 1000) {
      series.history = series.history.slice(-1000)
    }

    // Update statistics
    this.updateStatistics(series)
  }

  /**
   * Update statistical calculations for metric series
   */
  private updateStatistics(series: MetricSeries): void {
    if (series.history.length === 0) return

    const values = series.history.map((h) => h.value).sort((a, b) => a - b)

    series.stats.min = values[0]
    series.stats.max = values[values.length - 1]
    series.stats.average =
      values.reduce((sum, val) => sum + val, 0) / values.length

    // Calculate percentiles
    const medianIndex = Math.floor(values.length / 2)
    series.stats.median =
      values.length % 2 === 0
        ? (values[medianIndex - 1] + values[medianIndex]) / 2
        : values[medianIndex]

    series.stats.p95 = values[Math.floor(values.length * 0.95)] || 0
    series.stats.p99 = values[Math.floor(values.length * 0.99)] || 0
  }

  /**
   * Check all alert rules against current metrics
   */
  private checkAlerts(): void {
    const now = Date.now()

    this.alerts.forEach((rule) => {
      if (!rule.enabled) return

      const metric = this.metrics.get(rule.metric)
      if (!metric) return

      const isTriggered = this.evaluateAlertRule(rule, metric.current)

      if (isTriggered) {
        // Check duration threshold
        const recentAlerts = this.alertHistory.filter(
          (alert) =>
            alert.rule.metric === rule.metric &&
            alert.timestamp > now - (rule.duration || 0)
        )

        if (recentAlerts.length === 0 || !rule.duration) {
          this.triggerAlert(rule, metric)
        }
      }
    })
  }

  /**
   * Check alerts for a specific metric
   */
  private checkMetricAlerts(metricName: string, value: number): void {
    const relevantAlerts = this.alerts.filter(
      (alert) => alert.metric === metricName && alert.enabled
    )

    relevantAlerts.forEach((rule) => {
      if (this.evaluateAlertRule(rule, value)) {
        const metric = this.metrics.get(metricName)
        if (metric) {
          this.triggerAlert(rule, metric)
        }
      }
    })
  }

  /**
   * Evaluate if an alert rule is triggered
   */
  private evaluateAlertRule(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case '>':
        return value > rule.threshold
      case '<':
        return value < rule.threshold
      case '>=':
        return value >= rule.threshold
      case '<=':
        return value <= rule.threshold
      case '==':
        return value === rule.threshold
      case '!=':
        return value !== rule.threshold
      default:
        return false
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    rule: AlertRule,
    metric: MetricSeries
  ): Promise<void> {
    const alert = {
      rule,
      metric,
      timestamp: Date.now(),
    }

    // Add to alert history
    this.alertHistory.push(alert)

    // Limit alert history
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000)
    }

    // Send alert to destinations
    await this.sendAlert(alert)

    console.warn(`[Dashboard] 🚨 Alert triggered: ${rule.message}`, {
      metric: metric.name,
      value: metric.current,
      threshold: rule.threshold,
      severity: rule.severity,
    })
  }

  /**
   * Send alert to configured destinations
   */
  private async sendAlert(alert: {
    rule: AlertRule
    metric: MetricSeries
    timestamp: number
  }): Promise<void> {
    const { rule, metric } = alert

    for (const destination of rule.destinations || []) {
      try {
        switch (destination) {
          case 'console':
            this.sendConsoleAlert(rule, metric)
            break
          case 'analytics':
            await this.sendAnalyticsAlert(rule, metric)
            break
          case 'webhook':
            await this.sendWebhookAlert(rule, metric)
            break
          case 'email':
            await this.sendEmailAlert(rule, metric)
            break
          default:
            console.warn(
              `[Dashboard] Unknown alert destination: ${destination}`
            )
        }
      } catch (error) {
        console.error(
          `[Dashboard] Failed to send alert to ${destination}:`,
          error
        )
      }
    }
  }

  /**
   * Send console alert
   */
  private sendConsoleAlert(rule: AlertRule, metric: MetricSeries): void {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
    }

    console.warn(
      `${severityEmoji[rule.severity]} Performance Alert: ${rule.message}\n` +
        `   Metric: ${metric.name}\n` +
        `   Current: ${metric.current}\n` +
        `   Threshold: ${rule.threshold}\n` +
        `   Trend: ${metric.trend} (${metric.changePercent.toFixed(1)}%)\n` +
        `   Time: ${new Date().toISOString()}`
    )
  }

  /**
   * Send analytics alert
   */
  private async sendAnalyticsAlert(
    rule: AlertRule,
    metric: MetricSeries
  ): Promise<void> {
    // In a production environment, this would send to analytics service
    // For now, we'll log to console with analytics format
    const analyticsEvent = {
      event: 'performance_alert',
      properties: {
        metric_name: metric.name,
        metric_value: metric.current,
        threshold: rule.threshold,
        severity: rule.severity,
        trend: metric.trend,
        change_percent: metric.changePercent,
        timestamp: Date.now(),
      },
    }

    console.log('[Analytics] Performance alert:', analyticsEvent)

    // In production, uncomment and configure:
    // await analytics.track('performance_alert', analyticsEvent.properties)
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(
    rule: AlertRule,
    metric: MetricSeries
  ): Promise<void> {
    const webhookUrl = process.env.PERFORMANCE_WEBHOOK_URL
    if (!webhookUrl) return

    const payload = {
      alert: {
        message: rule.message,
        severity: rule.severity,
        metric: {
          name: metric.name,
          current: metric.current,
          threshold: rule.threshold,
          trend: metric.trend,
          changePercent: metric.changePercent,
        },
        timestamp: new Date().toISOString(),
      },
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error('[Dashboard] Webhook alert failed:', error)
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(
    rule: AlertRule,
    metric: MetricSeries
  ): Promise<void> {
    // In production, integrate with email service
    console.log('[Email] Performance alert would be sent:', {
      to: process.env.PERFORMANCE_ALERT_EMAIL,
      subject: `Performance Alert: ${rule.message}`,
      metric: metric.name,
      value: metric.current,
      threshold: rule.threshold,
      severity: rule.severity,
    })
  }

  /**
   * Update dashboard display
   */
  private updateDashboard(): void {
    // Notify all subscribers of dashboard update
    this.notifySubscribers('dashboard_update', null)

    // Log dashboard status
    const criticalAlerts = this.alertHistory.filter(
      (alert) =>
        alert.rule.severity === 'critical' &&
        alert.timestamp > Date.now() - 300000 // Last 5 minutes
    ).length

    if (criticalAlerts > 0) {
      console.warn(
        `[Dashboard] ${criticalAlerts} critical alerts in the last 5 minutes`
      )
    }
  }

  /**
   * Clean up old data to prevent memory issues
   */
  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - 3600000

    // Clean old alert history
    this.alertHistory = this.alertHistory.filter(
      (alert) => alert.timestamp > oneHourAgo
    )

    // Clean old metric history (keep last hour of detailed data)
    this.metrics.forEach((series) => {
      series.history = series.history.filter(
        (point) => point.timestamp > oneHourAgo
      )
    })

    console.log('[Dashboard] Cleaned up old performance data')
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(
    metricName: string,
    callback: (metric: MetricSeries | null) => void
  ): void {
    if (!this.subscribers.has(metricName)) {
      this.subscribers.set(metricName, [])
    }
    this.subscribers.get(metricName)!.push(callback)
  }

  /**
   * Unsubscribe from metric updates
   */
  unsubscribe(
    metricName: string,
    callback: (metric: MetricSeries | null) => void
  ): void {
    const callbacks = this.subscribers.get(metricName)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Notify subscribers of metric updates
   */
  private notifySubscribers(
    metricName: string,
    metric: MetricSeries | null
  ): void {
    const callbacks = this.subscribers.get(metricName) || []
    callbacks.forEach((callback) => {
      try {
        callback(metric)
      } catch (error) {
        console.error('[Dashboard] Subscriber callback error:', error)
      }
    })
  }

  /**
   * Get current performance analysis
   */
  getPerformanceAnalysis(): PerformanceAnalysis {
    const coreWebVitals = {
      LCP: this.getMetricAnalysis('LCP', 1200),
      FID: this.getMetricAnalysis('FID', 100),
      CLS: this.getMetricAnalysis('CLS', 0.1),
      FCP: this.getMetricAnalysis('FCP', 1200),
      TTFB: this.getMetricAnalysis('TTFB', 800),
    }

    // Calculate overall score based on Core Web Vitals
    const scores = Object.values(coreWebVitals).map((metric) =>
      this.getScoreFromRating(metric.rating)
    )
    const overallScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks()

    // Find optimization opportunities
    const opportunities = this.findOptimizationOpportunities()

    // Check performance budget
    const budgetStatus = this.checkPerformanceBudget()

    return {
      score: Math.round(overallScore),
      coreWebVitals,
      bottlenecks,
      opportunities,
      budgetStatus,
    }
  }

  /**
   * Get analysis for a specific metric
   */
  private getMetricAnalysis(
    name: string,
    threshold: number
  ): { value: number; rating: string } {
    const metric = this.metrics.get(name)
    if (!metric) {
      return { value: 0, rating: 'unknown' }
    }

    let rating = 'good'
    if (metric.current > threshold) {
      rating = metric.current > threshold * 2 ? 'poor' : 'needs-improvement'
    }

    return {
      value: metric.current,
      rating,
    }
  }

  /**
   * Convert rating to numeric score
   */
  private getScoreFromRating(rating: string): number {
    switch (rating) {
      case 'good':
        return 100
      case 'needs-improvement':
        return 75
      case 'poor':
        return 50
      default:
        return 0
    }
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(): Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    impact: number
    recommendation: string
  }> {
    const bottlenecks = []

    // Check LCP issues
    const lcp = this.metrics.get('LCP')
    if (lcp && lcp.current > 1200) {
      bottlenecks.push({
        type: 'LCP',
        severity:
          lcp.current > 2500 ? ('critical' as const) : ('high' as const),
        description: `Largest Contentful Paint is ${lcp.current}ms (target: <1200ms)`,
        impact: Math.round(((lcp.current - 1200) / 1200) * 100),
        recommendation:
          'Optimize images, preload critical resources, improve server response time',
      })
    }

    // Check CLS issues
    const cls = this.metrics.get('CLS')
    if (cls && cls.current > 0.1) {
      bottlenecks.push({
        type: 'CLS',
        severity:
          cls.current > 0.25 ? ('critical' as const) : ('high' as const),
        description: `Cumulative Layout Shift is ${cls.current} (target: <0.1)`,
        impact: Math.round(((cls.current - 0.1) / 0.1) * 100),
        recommendation:
          'Set explicit dimensions for images, reserve space for ads, optimize font loading',
      })
    }

    // Check bundle size
    const bundleSize = this.metrics.get('bundle-size')
    if (bundleSize && bundleSize.current > 1500000) {
      bottlenecks.push({
        type: 'Bundle Size',
        severity:
          bundleSize.current > 2000000
            ? ('critical' as const)
            : ('medium' as const),
        description: `Bundle size is ${Math.round(bundleSize.current / 1024)}KB (target: <1.5MB)`,
        impact: Math.round(((bundleSize.current - 1500000) / 1500000) * 100),
        recommendation:
          'Enable code splitting, remove unused code, optimize dependencies',
      })
    }

    return bottlenecks
  }

  /**
   * Find optimization opportunities
   */
  private findOptimizationOpportunities(): Array<{
    title: string
    description: string
    potentialSavings: number
    effort: 'low' | 'medium' | 'high'
    priority: number
  }> {
    const opportunities = []

    // Cache optimization opportunity
    const cacheHitRatio = this.metrics.get('cache-hit-ratio')
    if (cacheHitRatio && cacheHitRatio.current < 90) {
      opportunities.push({
        title: 'Improve Cache Strategy',
        description:
          'Optimize service worker caching to increase cache hit ratio',
        potentialSavings: Math.round((90 - cacheHitRatio.current) * 10), // ms
        effort: 'medium' as const,
        priority: 8,
      })
    }

    // Image optimization
    const lcp = this.metrics.get('LCP')
    if (lcp && lcp.current > 1000) {
      opportunities.push({
        title: 'Image Optimization',
        description: 'Implement WebP/AVIF formats and responsive images',
        potentialSavings: Math.round((lcp.current - 1000) * 0.3),
        effort: 'low' as const,
        priority: 9,
      })
    }

    // Code splitting
    const bundleSize = this.metrics.get('bundle-size')
    if (bundleSize && bundleSize.current > 1000000) {
      opportunities.push({
        title: 'Advanced Code Splitting',
        description: 'Implement route-based and component-based code splitting',
        potentialSavings: Math.round((bundleSize.current - 1000000) / 1000),
        effort: 'high' as const,
        priority: 7,
      })
    }

    return opportunities.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Check performance budget compliance
   */
  private checkPerformanceBudget(): {
    passed: boolean
    violations: Array<{
      metric: string
      actual: number
      budget: number
      severity: string
    }>
  } {
    const budget = DEFAULT_PERFORMANCE_BUDGET
    const violations = []

    // Check Lighthouse score
    const lighthouseScore = this.metrics.get('lighthouse-score')
    if (
      lighthouseScore &&
      lighthouseScore.current < budget.metrics.lighthouseScore
    ) {
      violations.push({
        metric: 'Lighthouse Score',
        actual: lighthouseScore.current,
        budget: budget.metrics.lighthouseScore,
        severity: 'critical',
      })
    }

    // Check Core Web Vitals
    const lcp = this.metrics.get('LCP')
    if (lcp && lcp.current > budget.metrics.largestContentfulPaint) {
      violations.push({
        metric: 'LCP',
        actual: lcp.current,
        budget: budget.metrics.largestContentfulPaint,
        severity: 'high',
      })
    }

    const fcp = this.metrics.get('FCP')
    if (fcp && fcp.current > budget.metrics.firstContentfulPaint) {
      violations.push({
        metric: 'FCP',
        actual: fcp.current,
        budget: budget.metrics.firstContentfulPaint,
        severity: 'medium',
      })
    }

    const cls = this.metrics.get('CLS')
    if (cls && cls.current > budget.metrics.cumulativeLayoutShift) {
      violations.push({
        metric: 'CLS',
        actual: cls.current,
        budget: budget.metrics.cumulativeLayoutShift,
        severity: 'high',
      })
    }

    return {
      passed: violations.length === 0,
      violations,
    }
  }

  /**
   * Get all current metrics
   */
  getMetrics(): Map<string, MetricSeries> {
    return new Map(this.metrics)
  }

  /**
   * Get alert history
   */
  getAlertHistory(): Array<{
    rule: AlertRule
    metric: MetricSeries
    timestamp: number
  }> {
    return [...this.alertHistory]
  }

  /**
   * Get dashboard configuration
   */
  getConfig(): DashboardConfig {
    return { ...this.config }
  }

  /**
   * Update alert rule
   */
  updateAlertRule(metric: string, updates: Partial<AlertRule>): void {
    const index = this.alerts.findIndex((rule) => rule.metric === metric)
    if (index > -1) {
      this.alerts[index] = { ...this.alerts[index], ...updates }
      console.log(`[Dashboard] Updated alert rule for ${metric}`)
    }
  }

  /**
   * Add new alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alerts.push(rule)
    console.log(`[Dashboard] Added alert rule for ${rule.metric}`)
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(metric: string): void {
    const index = this.alerts.findIndex((rule) => rule.metric === metric)
    if (index > -1) {
      this.alerts.splice(index, 1)
      console.log(`[Dashboard] Removed alert rule for ${metric}`)
    }
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: Object.fromEntries(this.metrics),
      alerts: this.alertHistory,
      config: this.config,
      timestamp: new Date().toISOString(),
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else {
      // Simple CSV export for metrics
      const csvLines = ['Metric,Current,Previous,Trend,Change%']
      this.metrics.forEach((metric) => {
        csvLines.push(
          `${metric.name},${metric.current},${metric.previous},${metric.trend},${metric.changePercent.toFixed(2)}`
        )
      })
      return csvLines.join('\n')
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all subscribers
    this.subscribers.clear()

    // Clear metrics and alerts
    this.metrics.clear()
    this.alerts = []
    this.alertHistory = []

    console.log('[Dashboard] Performance dashboard destroyed')
  }
}

// Factory function
export function createPerformanceDashboard(
  config: Partial<DashboardConfig> = {}
): PerformanceDashboard {
  const defaultConfig: DashboardConfig = {
    metrics: ['LCP', 'FCP', 'CLS', 'FID', 'TTFB', 'lighthouse-score'],
    refreshInterval: 30000,
    timeRange: {
      start: Date.now() - 3600000, // Last hour
      end: Date.now(),
    },
    charts: [
      {
        type: 'line',
        metrics: ['LCP', 'FCP'],
        title: 'Core Web Vitals - Paint Metrics',
      },
      {
        type: 'gauge',
        metrics: ['lighthouse-score'],
        title: 'Lighthouse Performance Score',
      },
      {
        type: 'bar',
        metrics: ['CLS', 'FID'],
        title: 'User Experience Metrics',
      },
    ],
    alerts: [],
  }

  return new PerformanceDashboard({ ...defaultConfig, ...config })
}

// Global dashboard instance
let globalDashboard: PerformanceDashboard | null = null

/**
 * Initialize global dashboard
 */
export function initializePerformanceDashboard(
  config?: Partial<DashboardConfig>
): PerformanceDashboard {
  if (globalDashboard) {
    console.warn('[Dashboard] Already initialized')
    return globalDashboard
  }

  globalDashboard = createPerformanceDashboard(config)
  console.log('[Dashboard] Performance dashboard initialized')
  return globalDashboard
}

/**
 * Get global dashboard instance
 */
export function getPerformanceDashboard(): PerformanceDashboard | null {
  return globalDashboard
}

/**
 * Destroy global dashboard
 */
export function destroyPerformanceDashboard(): void {
  if (globalDashboard) {
    globalDashboard.destroy()
    globalDashboard = null
  }
}
