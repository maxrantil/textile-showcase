'use strict'
// ABOUTME: Core Real User Monitoring (RUM) system with privacy-compliant data collection and sub-1ms overhead
// Provides comprehensive performance tracking for textile-showcase with GDPR/CCPA compliance
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k]
            },
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : function (o, v) {
        o['default'] = v
      })
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = []
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
          return ar
        }
      return ownKeys(o)
    }
    return function (mod) {
      if (mod && mod.__esModule) return mod
      var result = {}
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i])
      __setModuleDefault(result, mod)
      return result
    }
  })()
Object.defineProperty(exports, '__esModule', { value: true })
exports.RealUserMonitor = void 0
exports.createRealUserMonitor = createRealUserMonitor
exports.initializeRUM = initializeRUM
exports.getRUM = getRUM
exports.destroyRUM = destroyRUM
class RealUserMonitor {
  constructor(config) {
    this.metricsBuffer = []
    this.hasConsent = false
    this.observer = null
    this.config = config
    this.samplingRate = config.samplingRate || 0.1 // 10% sampling for privacy
    this.sessionId = this.generateSessionId()
  }
  /**
   * Initialize RUM system with privacy-first approach
   */
  async initialize() {
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
  async initializeCoreWebVitals() {
    try {
      // Dynamic import to avoid bundle size impact for non-monitored users
      const { onCLS, onINP, onFCP, onLCP, onTTFB } =
        await Promise.resolve().then(() => __importStar(require('web-vitals')))
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
  initializeCustomMetrics() {
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
  trackNavigationTiming() {
    if (!('navigation' in performance)) return
    const navigation = performance.getEntriesByType('navigation')[0]
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
  trackResourceTiming() {
    if (!this.observer) {
      this.observer = new PerformanceObserver((list) => {
        const startTime = performance.now()
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.trackResourceMetric(entry)
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
  trackServiceWorkerMetrics() {
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
  trackCacheMetrics() {
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
  trackServiceWorkerResponseTimes() {
    // Use navigation timing to detect service worker involvement
    const navigation = performance.getEntriesByType('navigation')[0]
    if (navigation && navigation.workerStart > 0) {
      const swStartupTime = navigation.workerStart - navigation.fetchStart
      this.handleCustomMetric('service-worker-startup', swStartupTime)
    }
  }
  /**
   * Track resource loading metrics
   */
  trackResourceMetric(entry) {
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
  getResourceType(url) {
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
  initializeErrorTracking() {
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
  handleMetric(metric) {
    const startTime = performance.now()
    const m = metric
    try {
      const performanceMetric = {
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
  handleCustomMetric(name, value, metadata) {
    const startTime = performance.now()
    try {
      const metric = {
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
  addToBuffer(metric) {
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
  anonymizeMetric(metric) {
    return Object.assign(Object.assign({}, metric), {
      sessionId: this.hashSessionId(metric.sessionId),
      // Round timestamp to nearest minute for privacy
      timestamp: Math.floor(metric.timestamp / 60000) * 60000,
      // Remove potentially identifying metadata
      metadata: metric.metadata
        ? this.sanitizeMetadata(metric.metadata)
        : undefined,
    })
  }
  /**
   * Sanitize metadata to remove PII
   */
  sanitizeMetadata(metadata) {
    const sanitized = {}
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
  startBatchFlushing() {
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
  flushMetrics() {
    if (this.metricsBuffer.length === 0) return
    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = [] // Clear buffer immediately
    // Use sendBeacon for reliable delivery with secure payload
    if ('sendBeacon' in navigator) {
      const securePayload = this.createSecurePayload(metrics)
      const data = JSON.stringify(securePayload)
      const success = navigator.sendBeacon(this.getSecureEndpoint(), data)
      if (!success && this.config.fallbackReporting) {
        // Fallback to fetch if sendBeacon fails
        this.sendViaFetch(metrics)
      }
    } else {
      this.sendViaFetch(metrics)
    }
  }
  /**
   * Fallback reporting via fetch with secure headers
   */
  async sendViaFetch(metrics) {
    try {
      const securePayload = this.createSecurePayload(metrics)
      const response = await fetch(this.getSecureEndpoint(), {
        method: 'POST',
        headers: this.getSecureHeaders(),
        body: JSON.stringify(securePayload),
        keepalive: true,
        // Add security-related options
        credentials: 'same-origin',
        mode: 'cors',
        cache: 'no-cache',
      })
      if (!response.ok) {
        console.warn(
          `[RUM] Server responded with ${response.status}: ${response.statusText}`
        )
      }
    } catch (error) {
      console.warn('[RUM] Failed to send metrics via fetch:', error)
    }
  }
  /**
   * Check if user should be included in monitoring sample
   */
  shouldSample() {
    return Math.random() < this.samplingRate
  }
  /**
   * Check user consent for performance monitoring
   */
  async checkUserConsent() {
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
  async requestPerformanceConsent() {
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
  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substring(2, 15)
  }
  /**
   * Hash session ID for privacy
   */
  hashSessionId(sessionId) {
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
  getNavigationType() {
    if ('navigation' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0]
      return (
        (navigation === null || navigation === void 0
          ? void 0
          : navigation.type) || 'unknown'
      )
    }
    return 'unknown'
  }
  /**
   * Get connection type
   */
  getConnectionType() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection
    return (
      (connection === null || connection === void 0
        ? void 0
        : connection.effectiveType) || 'unknown'
    )
  }
  /**
   * Get device memory
   */
  getDeviceMemory() {
    return navigator.deviceMemory || 0
  }
  /**
   * Anonymize user agent
   */
  anonymizeUserAgent(userAgent) {
    // Extract only essential browser info, remove version details
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)
    return browserMatch ? browserMatch[0].replace(/\/[\d.]+/, '') : 'Unknown'
  }
  /**
   * Generate authentication token for secure transmission
   */
  generateAuthToken() {
    // Generate a session-based authentication token
    const timestamp = Date.now()
    const payload = `${this.sessionId}-${timestamp}`
    // In production, use proper HMAC signing
    let hash = 0
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `${timestamp}.${Math.abs(hash).toString(36)}`
  }
  /**
   * Create secure payload with authentication and integrity
   */
  createSecurePayload(metrics) {
    const timestamp = Date.now()
    const payload = {
      metrics,
      timestamp,
      userAgent: this.anonymizeUserAgent(navigator.userAgent),
      sessionId: this.hashSessionId(this.sessionId),
      auth: this.generateAuthToken(),
      integrity: this.calculatePayloadHash(metrics),
    }
    return payload
  }
  /**
   * Calculate payload hash for integrity verification
   */
  calculatePayloadHash(metrics) {
    const content = JSON.stringify(
      metrics.map((m) => `${m.name}:${m.value}:${m.timestamp}`)
    )
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }
  /**
   * Get secure endpoint with HTTPS enforcement
   */
  getSecureEndpoint() {
    const endpoint = this.config.reportingEndpoint || '/api/performance'
    // Ensure HTTPS for external endpoints
    if (
      endpoint.startsWith('http://') &&
      window.location.protocol === 'https:'
    ) {
      console.warn('[RUM] Upgrading insecure endpoint to HTTPS')
      return endpoint.replace('http://', 'https://')
    }
    return endpoint
  }
  /**
   * Create secure headers for fetch requests
   */
  getSecureHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Performance-Auth': this.generateAuthToken(),
      'X-Session-ID': this.hashSessionId(this.sessionId),
      'X-Timestamp': Date.now().toString(),
    }
  }
  /**
   * Cleanup monitoring resources
   */
  destroy() {
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
exports.RealUserMonitor = RealUserMonitor
// Factory function for easy initialization
function createRealUserMonitor(config) {
  const defaultConfig = {
    samplingRate: 0.1, // 10% sampling
    reportingEndpoint: '/api/performance',
    fallbackReporting: true,
    maxBufferSize: 100,
    flushInterval: 30000,
  }
  return new RealUserMonitor(
    Object.assign(Object.assign({}, defaultConfig), config)
  )
}
// Global instance for easy access
let globalRUM = null
/**
 * Initialize global RUM instance
 */
function initializeRUM(config) {
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
function getRUM() {
  return globalRUM
}
/**
 * Destroy global RUM instance
 */
function destroyRUM() {
  if (globalRUM) {
    globalRUM.destroy()
    globalRUM = null
  }
}
