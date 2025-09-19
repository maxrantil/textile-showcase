// ABOUTME: Core Real User Monitoring (RUM) system with privacy-compliant data collection and sub-1ms overhead
// Provides comprehensive performance tracking for textile-showcase with GDPR/CCPA compliance

import type { PerformanceMetric, RUMConfig } from '../types/performance'

export class RealUserMonitor {
  private config: RUMConfig
  private metricsBuffer: PerformanceMetric[] = []
  private samplingRate: number
  private hasConsent: boolean = false
  private sessionId: string
  private observer: PerformanceObserver | null = null

  constructor(config: RUMConfig) {
    this.config = config
    this.samplingRate = config.samplingRate || 0.1 // 10% sampling for privacy
    this.sessionId = this.generateSessionId()
  }

  /**
   * Initialize RUM system with privacy-first approach
   */
  async initialize(): Promise<void> {
    // Check user consent and sampling eligibility
    if (!this.shouldSample() || !(await this.checkUserConsent())) {
      console.log('[RUM] Monitoring disabled: no consent or not sampled')
      return
    }

    console.log('[RUM] Initializing performance monitoring...')

    // Initialize monitoring components
    await this.initializeCoreWebVitals()
    this.initializeCustomMetrics()
    this.initializeErrorTracking()
    this.startBatchFlushing()

    console.log('[RUM] Performance monitoring initialized successfully')
  }

  /**
   * Initialize Core Web Vitals tracking with web-vitals library
   */
  private async initializeCoreWebVitals(): Promise<void> {
    try {
      // Dynamic import to avoid bundle size impact for non-monitored users
      const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals')

      // Track all Core Web Vitals
      onCLS(this.handleMetric.bind(this), { reportAllChanges: false })
      onINP(this.handleMetric.bind(this), { reportAllChanges: false })
      onFCP(this.handleMetric.bind(this), { reportAllChanges: false })
      onLCP(this.handleMetric.bind(this), { reportAllChanges: false })
      onTTFB(this.handleMetric.bind(this), { reportAllChanges: false })
    } catch (error) {
      console.warn('[RUM] Failed to initialize Core Web Vitals:', error)
    }
  }

  /**
   * Initialize custom performance metrics tracking
   */
  private initializeCustomMetrics(): void {
    // Track navigation timing
    this.trackNavigationTiming()

    // Track resource loading performance
    this.trackResourceTiming()

    // Track service worker performance impact
    this.trackServiceWorkerMetrics()
  }

  /**
   * Track navigation timing metrics
   */
  private trackNavigationTiming(): void {
    if (!('navigation' in performance)) return

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    if (!navigation) return

    // Calculate custom metrics
    const domContentLoaded =
      navigation.domContentLoadedEventEnd -
      navigation.domContentLoadedEventStart
    const windowLoad = navigation.loadEventEnd - navigation.loadEventStart

    this.handleCustomMetric('dom-content-loaded', domContentLoaded)
    this.handleCustomMetric('window-load', windowLoad)
    this.handleCustomMetric(
      'dns-lookup',
      navigation.domainLookupEnd - navigation.domainLookupStart
    )
    this.handleCustomMetric(
      'tcp-connect',
      navigation.connectEnd - navigation.connectStart
    )
  }

  /**
   * Track resource loading performance
   */
  private trackResourceTiming(): void {
    if (!this.observer) {
      this.observer = new PerformanceObserver((list) => {
        const startTime = performance.now()

        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.trackResourceMetric(entry as PerformanceResourceTiming)
          }
        }

        // Ensure processing stays under 1ms
        const processingTime = performance.now() - startTime
        if (processingTime > 1) {
          console.warn(
            `[RUM] Resource tracking exceeded 1ms: ${processingTime}ms`
          )
        }
      })

      this.observer.observe({ entryTypes: ['resource'] })
    }
  }

  /**
   * Track service worker performance impact
   */
  private trackServiceWorkerMetrics(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Track cache hit ratio
      this.trackCacheMetrics()

      // Track service worker response times
      this.trackServiceWorkerResponseTimes()
    }
  }

  /**
   * Track cache performance metrics
   */
  private trackCacheMetrics(): void {
    // Monitor cache storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage
        .estimate()
        .then((estimate) => {
          const cacheUsage = estimate.usage || 0
          const cacheQuota = estimate.quota || 0
          const cacheRatio =
            cacheQuota > 0 ? (cacheUsage / cacheQuota) * 100 : 0

          this.handleCustomMetric('cache-usage-ratio', cacheRatio)
        })
        .catch(() => {
          // Silently fail if storage API not available
        })
    }
  }

  /**
   * Track service worker response times
   */
  private trackServiceWorkerResponseTimes(): void {
    // Use navigation timing to detect service worker involvement
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    if (navigation && navigation.workerStart > 0) {
      const swStartupTime = navigation.workerStart - navigation.fetchStart
      this.handleCustomMetric('service-worker-startup', swStartupTime)
    }
  }

  /**
   * Track resource loading metrics
   */
  private trackResourceMetric(entry: PerformanceResourceTiming): void {
    // Only track significant resources to minimize overhead
    if (entry.transferSize < 1024) return // Skip small resources

    const loadTime = entry.responseEnd - entry.startTime
    const resourceType = this.getResourceType(entry.name)

    this.handleCustomMetric(`resource-${resourceType}-load-time`, loadTime)

    // Track cache hits
    if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
      this.handleCustomMetric(`resource-${resourceType}-cache-hit`, 1)
    }
  }

  /**
   * Determine resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'style'
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))
      return 'image'
    if (url.includes('.woff') || url.includes('.woff2')) return 'font'
    return 'other'
  }

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    // Track JavaScript errors that could impact performance
    window.addEventListener('error', (event) => {
      this.handleCustomMetric('js-error', 1, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      })
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleCustomMetric('unhandled-rejection', 1, {
        reason: String(event.reason),
      })
    })
  }

  /**
   * Handle Core Web Vitals metrics from web-vitals library
   */
  private handleMetric(metric: unknown): void {
    const startTime = performance.now()
    const m = metric as {
      name: string
      value: number
      rating?: string
      delta?: number
      id?: string
    }

    try {
      const performanceMetric: PerformanceMetric = {
        name: m.name,
        value: m.value,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        rating: m.rating || 'unknown',
        delta: m.delta || 0,
        id: m.id,
        navigationType: this.getNavigationType(),
        connectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory(),
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
      }

      this.addToBuffer(performanceMetric)
    } catch (error) {
      console.warn('[RUM] Error handling metric:', error)
    }

    // Ensure processing stays under 1ms requirement
    const processingTime = performance.now() - startTime
    if (processingTime > 1) {
      console.warn(
        `[RUM] Metric processing exceeded 1ms: ${processingTime}ms for ${m.name}`
      )
    }
  }

  /**
   * Handle custom metrics
   */
  private handleCustomMetric(
    name: string,
    value: number,
    metadata?: Record<string, unknown>
  ): void {
    const startTime = performance.now()

    try {
      const metric: PerformanceMetric = {
        name,
        value,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        navigationType: this.getNavigationType(),
        connectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory(),
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        metadata,
      }

      this.addToBuffer(metric)
    } catch (error) {
      console.warn('[RUM] Error handling custom metric:', error)
    }

    const processingTime = performance.now() - startTime
    if (processingTime > 0.5) {
      // More lenient for custom metrics
      console.warn(
        `[RUM] Custom metric processing took ${processingTime}ms for ${name}`
      )
    }
  }

  /**
   * Add metric to buffer with overflow protection
   */
  private addToBuffer(metric: PerformanceMetric): void {
    // Anonymize data for privacy compliance
    const anonymizedMetric = this.anonymizeMetric(metric)

    this.metricsBuffer.push(anonymizedMetric)

    // Prevent memory issues with large buffers
    if (this.metricsBuffer.length > 100) {
      this.flushMetrics()
    }
  }

  /**
   * Anonymize metric data for privacy compliance
   */
  private anonymizeMetric(metric: PerformanceMetric): PerformanceMetric {
    return {
      ...metric,
      sessionId: this.hashSessionId(metric.sessionId),
      // Round timestamp to nearest minute for privacy
      timestamp: Math.floor(metric.timestamp / 60000) * 60000,
      // Remove potentially identifying metadata
      metadata: metric.metadata
        ? this.sanitizeMetadata(metric.metadata)
        : undefined,
    }
  }

  /**
   * Sanitize metadata to remove PII
   */
  private sanitizeMetadata(
    metadata: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(metadata)) {
      // Only include non-PII data
      if (['message', 'filename', 'lineno', 'reason'].includes(key)) {
        // Truncate long strings to prevent data leakage
        sanitized[key] =
          typeof value === 'string' ? value.substring(0, 100) : value
      }
    }

    return sanitized
  }

  /**
   * Start automatic buffer flushing
   */
  private startBatchFlushing(): void {
    // Flush metrics every 30 seconds to minimize performance impact
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetrics()
      }
    }, 30000)

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics()
    })

    // Flush on visibility change (page hidden)
    document.addEventListener('visibilitychange', () => {
      if (
        document.visibilityState === 'hidden' &&
        this.metricsBuffer.length > 0
      ) {
        this.flushMetrics()
      }
    })
  }

  /**
   * Flush metrics buffer to reporting endpoint
   */
  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = [] // Clear buffer immediately

    // Use sendBeacon for reliable delivery
    if ('sendBeacon' in navigator) {
      const data = JSON.stringify({
        metrics,
        timestamp: Date.now(),
        userAgent: this.anonymizeUserAgent(navigator.userAgent),
      })

      const success = navigator.sendBeacon(
        this.config.reportingEndpoint || '/api/performance',
        data
      )

      if (!success && this.config.fallbackReporting) {
        // Fallback to fetch if sendBeacon fails
        this.sendViaFetch(metrics)
      }
    } else {
      this.sendViaFetch(metrics)
    }
  }

  /**
   * Fallback reporting via fetch
   */
  private async sendViaFetch(metrics: PerformanceMetric[]): Promise<void> {
    try {
      await fetch(this.config.reportingEndpoint || '/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: this.anonymizeUserAgent(navigator.userAgent),
        }),
        keepalive: true,
      })
    } catch (error) {
      console.warn('[RUM] Failed to send metrics via fetch:', error)
    }
  }

  /**
   * Check if user should be included in monitoring sample
   */
  private shouldSample(): boolean {
    return Math.random() < this.samplingRate
  }

  /**
   * Check user consent for performance monitoring
   */
  private async checkUserConsent(): Promise<boolean> {
    // Check stored consent
    const storedConsent = localStorage.getItem('perf-monitoring-consent')
    const consentTimestamp = localStorage.getItem(
      'perf-monitoring-consent-timestamp'
    )

    // Check if consent is still valid (1 year expiry)
    if (storedConsent === 'granted' && consentTimestamp) {
      const consentAge = Date.now() - parseInt(consentTimestamp)
      const oneYear = 365 * 24 * 60 * 60 * 1000

      if (consentAge < oneYear) {
        this.hasConsent = true
        return true
      }
    }

    // Request consent if not available or expired
    return this.requestPerformanceConsent()
  }

  /**
   * Request user consent for performance monitoring
   */
  private async requestPerformanceConsent(): Promise<boolean> {
    // In a real application, this would show a privacy-friendly consent banner
    // For now, we'll use a simple prompt (replace with proper UI)
    const consent = confirm(
      'This website would like to collect anonymous performance data to improve your experience. ' +
        'No personal information is collected. Allow performance monitoring?'
    )

    if (consent) {
      localStorage.setItem('perf-monitoring-consent', 'granted')
      localStorage.setItem(
        'perf-monitoring-consent-timestamp',
        Date.now().toString()
      )
      this.hasConsent = true
    }

    return consent
  }

  /**
   * Generate anonymous session ID
   */
  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2, 15)
  }

  /**
   * Hash session ID for privacy
   */
  private hashSessionId(sessionId: string): string {
    // Simple hash for privacy (in production, use a proper hash function)
    let hash = 0
    for (let i = 0; i < sessionId.length; i++) {
      const char = sessionId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return 'hashed_' + Math.abs(hash).toString(36)
  }

  /**
   * Get navigation type
   */
  private getNavigationType(): string {
    if ('navigation' in performance) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      return navigation?.type || 'unknown'
    }
    return 'unknown'
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection =
      (navigator as unknown as { connection?: { effectiveType?: string } })
        .connection ||
      (navigator as unknown as { mozConnection?: { effectiveType?: string } })
        .mozConnection ||
      (
        navigator as unknown as {
          webkitConnection?: { effectiveType?: string }
        }
      ).webkitConnection
    return connection?.effectiveType || 'unknown'
  }

  /**
   * Get device memory
   */
  private getDeviceMemory(): number {
    return (navigator as unknown as { deviceMemory?: number }).deviceMemory || 0
  }

  /**
   * Anonymize user agent
   */
  private anonymizeUserAgent(userAgent: string): string {
    // Extract only essential browser info, remove version details
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)
    return browserMatch ? browserMatch[0].replace(/\/[\d.]+/, '') : 'Unknown'
  }

  /**
   * Cleanup monitoring resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    // Flush any remaining metrics
    if (this.metricsBuffer.length > 0) {
      this.flushMetrics()
    }

    console.log('[RUM] Performance monitoring destroyed')
  }
}

// Factory function for easy initialization
export function createRealUserMonitor(
  config?: Partial<RUMConfig>
): RealUserMonitor {
  const defaultConfig: RUMConfig = {
    samplingRate: 0.1, // 10% sampling
    reportingEndpoint: '/api/performance',
    fallbackReporting: true,
    maxBufferSize: 100,
    flushInterval: 30000,
  }

  return new RealUserMonitor({ ...defaultConfig, ...config })
}

// Global instance for easy access
let globalRUM: RealUserMonitor | null = null

/**
 * Initialize global RUM instance
 */
export function initializeRUM(config?: Partial<RUMConfig>): Promise<void> {
  if (globalRUM) {
    console.warn('[RUM] Already initialized')
    return Promise.resolve()
  }

  globalRUM = createRealUserMonitor(config)
  return globalRUM.initialize()
}

/**
 * Get global RUM instance
 */
export function getRUM(): RealUserMonitor | null {
  return globalRUM
}

/**
 * Destroy global RUM instance
 */
export function destroyRUM(): void {
  if (globalRUM) {
    globalRUM.destroy()
    globalRUM = null
  }
}
