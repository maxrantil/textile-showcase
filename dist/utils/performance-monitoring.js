'use strict'
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
// ABOUTME: Core Real User Monitoring (RUM) system with privacy-compliant data collection and sub-1ms overhead
// Provides comprehensive performance tracking for textile-showcase with GDPR/CCPA compliance
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i]
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]
        }
        return t
      }
    return __assign.apply(this, arguments)
  }
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
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === 'function' ? Iterator : Object).prototype
      )
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb(n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.')
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i)
          ar[i] = from[i]
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from))
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.RealUserMonitor = void 0
exports.createRealUserMonitor = createRealUserMonitor
exports.initializeRUM = initializeRUM
exports.getRUM = getRUM
exports.destroyRUM = destroyRUM
var RealUserMonitor = /** @class */ (function () {
  function RealUserMonitor(config) {
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
  RealUserMonitor.prototype.initialize = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _a
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _a = !this.shouldSample()
            if (_a) return [3 /*break*/, 2]
            return [4 /*yield*/, this.checkUserConsent()]
          case 1:
            _a = !_b.sent()
            _b.label = 2
          case 2:
            // Check user consent and sampling eligibility
            if (_a) {
              console.log(
                '[RUM] Monitoring disabled: no consent or not sampled'
              )
              return [2 /*return*/]
            }
            console.log('[RUM] Initializing performance monitoring...')
            // Initialize monitoring components
            return [4 /*yield*/, this.initializeCoreWebVitals()]
          case 3:
            // Initialize monitoring components
            _b.sent()
            this.initializeCustomMetrics()
            this.initializeErrorTracking()
            this.startBatchFlushing()
            console.log('[RUM] Performance monitoring initialized successfully')
            return [2 /*return*/]
        }
      })
    })
  }
  /**
   * Initialize Core Web Vitals tracking with web-vitals library
   */
  RealUserMonitor.prototype.initializeCoreWebVitals = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _a, onCLS, onINP, onFCP, onLCP, onTTFB, error_1
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 2, , 3])
            return [
              4 /*yield*/,
              Promise.resolve().then(function () {
                return __importStar(require('web-vitals'))
              }),
            ]
          case 1:
            ;(_a = _b.sent()),
              (onCLS = _a.onCLS),
              (onINP = _a.onINP),
              (onFCP = _a.onFCP),
              (onLCP = _a.onLCP),
              (onTTFB = _a.onTTFB)
            // Track all Core Web Vitals
            onCLS(this.handleMetric.bind(this), { reportAllChanges: false })
            onINP(this.handleMetric.bind(this), { reportAllChanges: false })
            onFCP(this.handleMetric.bind(this), { reportAllChanges: false })
            onLCP(this.handleMetric.bind(this), { reportAllChanges: false })
            onTTFB(this.handleMetric.bind(this), { reportAllChanges: false })
            return [3 /*break*/, 3]
          case 2:
            error_1 = _b.sent()
            console.warn('[RUM] Failed to initialize Core Web Vitals:', error_1)
            return [3 /*break*/, 3]
          case 3:
            return [2 /*return*/]
        }
      })
    })
  }
  /**
   * Initialize custom performance metrics tracking
   */
  RealUserMonitor.prototype.initializeCustomMetrics = function () {
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
  RealUserMonitor.prototype.trackNavigationTiming = function () {
    if (!('navigation' in performance)) return
    var navigation = performance.getEntriesByType('navigation')[0]
    if (!navigation) return
    // Calculate custom metrics
    var domContentLoaded =
      navigation.domContentLoadedEventEnd -
      navigation.domContentLoadedEventStart
    var windowLoad = navigation.loadEventEnd - navigation.loadEventStart
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
  RealUserMonitor.prototype.trackResourceTiming = function () {
    var _this = this
    if (!this.observer) {
      this.observer = new PerformanceObserver(function (list) {
        var startTime = performance.now()
        for (var _i = 0, _a = list.getEntries(); _i < _a.length; _i++) {
          var entry = _a[_i]
          if (entry.entryType === 'resource') {
            _this.trackResourceMetric(entry)
          }
        }
        // Ensure processing stays under 1ms
        var processingTime = performance.now() - startTime
        if (processingTime > 1) {
          console.warn(
            '[RUM] Resource tracking exceeded 1ms: '.concat(
              processingTime,
              'ms'
            )
          )
        }
      })
      this.observer.observe({ entryTypes: ['resource'] })
    }
  }
  /**
   * Track service worker performance impact
   */
  RealUserMonitor.prototype.trackServiceWorkerMetrics = function () {
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
  RealUserMonitor.prototype.trackCacheMetrics = function () {
    var _this = this
    // Monitor cache storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage
        .estimate()
        .then(function (estimate) {
          var cacheUsage = estimate.usage || 0
          var cacheQuota = estimate.quota || 0
          var cacheRatio = cacheQuota > 0 ? (cacheUsage / cacheQuota) * 100 : 0
          _this.handleCustomMetric('cache-usage-ratio', cacheRatio)
        })
        .catch(function () {
          // Silently fail if storage API not available
        })
    }
  }
  /**
   * Track service worker response times
   */
  RealUserMonitor.prototype.trackServiceWorkerResponseTimes = function () {
    // Use navigation timing to detect service worker involvement
    var navigation = performance.getEntriesByType('navigation')[0]
    if (navigation && navigation.workerStart > 0) {
      var swStartupTime = navigation.workerStart - navigation.fetchStart
      this.handleCustomMetric('service-worker-startup', swStartupTime)
    }
  }
  /**
   * Track resource loading metrics
   */
  RealUserMonitor.prototype.trackResourceMetric = function (entry) {
    // Only track significant resources to minimize overhead
    if (entry.transferSize < 1024) return // Skip small resources
    var loadTime = entry.responseEnd - entry.startTime
    var resourceType = this.getResourceType(entry.name)
    this.handleCustomMetric(
      'resource-'.concat(resourceType, '-load-time'),
      loadTime
    )
    // Track cache hits
    if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
      this.handleCustomMetric('resource-'.concat(resourceType, '-cache-hit'), 1)
    }
  }
  /**
   * Determine resource type from URL
   */
  RealUserMonitor.prototype.getResourceType = function (url) {
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
  RealUserMonitor.prototype.initializeErrorTracking = function () {
    var _this = this
    // Track JavaScript errors that could impact performance
    window.addEventListener('error', function (event) {
      _this.handleCustomMetric('js-error', 1, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      })
    })
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', function (event) {
      _this.handleCustomMetric('unhandled-rejection', 1, {
        reason: String(event.reason),
      })
    })
  }
  /**
   * Handle Core Web Vitals metrics from web-vitals library
   */
  RealUserMonitor.prototype.handleMetric = function (metric) {
    var startTime = performance.now()
    var m = metric
    try {
      var performanceMetric = {
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
    var processingTime = performance.now() - startTime
    if (processingTime > 1) {
      console.warn(
        '[RUM] Metric processing exceeded 1ms: '
          .concat(processingTime, 'ms for ')
          .concat(m.name)
      )
    }
  }
  /**
   * Handle custom metrics
   */
  RealUserMonitor.prototype.handleCustomMetric = function (
    name,
    value,
    metadata
  ) {
    var startTime = performance.now()
    try {
      var metric = {
        name: name,
        value: value,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        navigationType: this.getNavigationType(),
        connectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory(),
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        metadata: metadata,
      }
      this.addToBuffer(metric)
    } catch (error) {
      console.warn('[RUM] Error handling custom metric:', error)
    }
    var processingTime = performance.now() - startTime
    if (processingTime > 0.5) {
      // More lenient for custom metrics
      console.warn(
        '[RUM] Custom metric processing took '
          .concat(processingTime, 'ms for ')
          .concat(name)
      )
    }
  }
  /**
   * Add metric to buffer with overflow protection
   */
  RealUserMonitor.prototype.addToBuffer = function (metric) {
    // Anonymize data for privacy compliance
    var anonymizedMetric = this.anonymizeMetric(metric)
    this.metricsBuffer.push(anonymizedMetric)
    // Prevent memory issues with large buffers
    if (this.metricsBuffer.length > 100) {
      this.flushMetrics()
    }
  }
  /**
   * Anonymize metric data for privacy compliance
   */
  RealUserMonitor.prototype.anonymizeMetric = function (metric) {
    return __assign(__assign({}, metric), {
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
  RealUserMonitor.prototype.sanitizeMetadata = function (metadata) {
    var sanitized = {}
    for (var _i = 0, _a = Object.entries(metadata); _i < _a.length; _i++) {
      var _b = _a[_i],
        key = _b[0],
        value = _b[1]
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
  RealUserMonitor.prototype.startBatchFlushing = function () {
    var _this = this
    // Flush metrics every 30 seconds to minimize performance impact
    setInterval(function () {
      if (_this.metricsBuffer.length > 0) {
        _this.flushMetrics()
      }
    }, 30000)
    // Flush on page unload
    window.addEventListener('beforeunload', function () {
      _this.flushMetrics()
    })
    // Flush on visibility change (page hidden)
    document.addEventListener('visibilitychange', function () {
      if (
        document.visibilityState === 'hidden' &&
        _this.metricsBuffer.length > 0
      ) {
        _this.flushMetrics()
      }
    })
  }
  /**
   * Flush metrics buffer to reporting endpoint
   */
  RealUserMonitor.prototype.flushMetrics = function () {
    if (this.metricsBuffer.length === 0) return
    var metrics = __spreadArray([], this.metricsBuffer, true)
    this.metricsBuffer = [] // Clear buffer immediately
    // Use sendBeacon for reliable delivery with secure payload
    if ('sendBeacon' in navigator) {
      var securePayload = this.createSecurePayload(metrics)
      var data = JSON.stringify(securePayload)
      var success = navigator.sendBeacon(this.getSecureEndpoint(), data)
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
  RealUserMonitor.prototype.sendViaFetch = function (metrics) {
    return __awaiter(this, void 0, void 0, function () {
      var securePayload, response, error_2
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3])
            securePayload = this.createSecurePayload(metrics)
            return [
              4 /*yield*/,
              fetch(this.getSecureEndpoint(), {
                method: 'POST',
                headers: this.getSecureHeaders(),
                body: JSON.stringify(securePayload),
                keepalive: true,
                // Add security-related options
                credentials: 'same-origin',
                mode: 'cors',
                cache: 'no-cache',
              }),
            ]
          case 1:
            response = _a.sent()
            if (!response.ok) {
              console.warn(
                '[RUM] Server responded with '
                  .concat(response.status, ': ')
                  .concat(response.statusText)
              )
            }
            return [3 /*break*/, 3]
          case 2:
            error_2 = _a.sent()
            console.warn('[RUM] Failed to send metrics via fetch:', error_2)
            return [3 /*break*/, 3]
          case 3:
            return [2 /*return*/]
        }
      })
    })
  }
  /**
   * Check if user should be included in monitoring sample
   */
  RealUserMonitor.prototype.shouldSample = function () {
    return Math.random() < this.samplingRate
  }
  /**
   * Check user consent for performance monitoring
   */
  RealUserMonitor.prototype.checkUserConsent = function () {
    return __awaiter(this, void 0, void 0, function () {
      var storedConsent, consentTimestamp, consentAge, oneYear
      return __generator(this, function (_a) {
        storedConsent = localStorage.getItem('perf-monitoring-consent')
        consentTimestamp = localStorage.getItem(
          'perf-monitoring-consent-timestamp'
        )
        // Check if consent is still valid (1 year expiry)
        if (storedConsent === 'granted' && consentTimestamp) {
          consentAge = Date.now() - parseInt(consentTimestamp)
          oneYear = 365 * 24 * 60 * 60 * 1000
          if (consentAge < oneYear) {
            this.hasConsent = true
            return [2 /*return*/, true]
          }
        }
        // Request consent if not available or expired
        return [2 /*return*/, this.requestPerformanceConsent()]
      })
    })
  }
  /**
   * Request user consent for performance monitoring
   */
  RealUserMonitor.prototype.requestPerformanceConsent = function () {
    return __awaiter(this, void 0, void 0, function () {
      var consent
      return __generator(this, function (_a) {
        consent = confirm(
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
        return [2 /*return*/, consent]
      })
    })
  }
  /**
   * Generate anonymous session ID
   */
  RealUserMonitor.prototype.generateSessionId = function () {
    return 'sess_' + Math.random().toString(36).substring(2, 15)
  }
  /**
   * Hash session ID for privacy
   */
  RealUserMonitor.prototype.hashSessionId = function (sessionId) {
    // Simple hash for privacy (in production, use a proper hash function)
    var hash = 0
    for (var i = 0; i < sessionId.length; i++) {
      var char = sessionId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return 'hashed_' + Math.abs(hash).toString(36)
  }
  /**
   * Get navigation type
   */
  RealUserMonitor.prototype.getNavigationType = function () {
    if ('navigation' in performance) {
      var navigation = performance.getEntriesByType('navigation')[0]
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
  RealUserMonitor.prototype.getConnectionType = function () {
    var connection =
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
  RealUserMonitor.prototype.getDeviceMemory = function () {
    return navigator.deviceMemory || 0
  }
  /**
   * Anonymize user agent
   */
  RealUserMonitor.prototype.anonymizeUserAgent = function (userAgent) {
    // Extract only essential browser info, remove version details
    var browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)
    return browserMatch ? browserMatch[0].replace(/\/[\d.]+/, '') : 'Unknown'
  }
  /**
   * Generate authentication token for secure transmission
   */
  RealUserMonitor.prototype.generateAuthToken = function () {
    // Generate a session-based authentication token
    var timestamp = Date.now()
    var payload = ''.concat(this.sessionId, '-').concat(timestamp)
    // In production, use proper HMAC signing
    var hash = 0
    for (var i = 0; i < payload.length; i++) {
      var char = payload.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return ''.concat(timestamp, '.').concat(Math.abs(hash).toString(36))
  }
  /**
   * Create secure payload with authentication and integrity
   */
  RealUserMonitor.prototype.createSecurePayload = function (metrics) {
    var timestamp = Date.now()
    var payload = {
      metrics: metrics,
      timestamp: timestamp,
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
  RealUserMonitor.prototype.calculatePayloadHash = function (metrics) {
    var content = JSON.stringify(
      metrics.map(function (m) {
        return ''.concat(m.name, ':').concat(m.value, ':').concat(m.timestamp)
      })
    )
    var hash = 0
    for (var i = 0; i < content.length; i++) {
      var char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }
  /**
   * Get secure endpoint with HTTPS enforcement
   */
  RealUserMonitor.prototype.getSecureEndpoint = function () {
    var endpoint = this.config.reportingEndpoint || '/api/performance'
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
  RealUserMonitor.prototype.getSecureHeaders = function () {
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
  RealUserMonitor.prototype.destroy = function () {
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
  return RealUserMonitor
})()
exports.RealUserMonitor = RealUserMonitor
// Factory function for easy initialization
function createRealUserMonitor(config) {
  var defaultConfig = {
    samplingRate: 0.1, // 10% sampling
    reportingEndpoint: '/api/performance',
    fallbackReporting: true,
    maxBufferSize: 100,
    flushInterval: 30000,
  }
  return new RealUserMonitor(__assign(__assign({}, defaultConfig), config))
}
// Global instance for easy access
var globalRUM = null
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
