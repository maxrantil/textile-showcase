// ABOUTME: TypeScript types for performance monitoring system with RUM and Core Web Vitals tracking
// Provides comprehensive type definitions for textile-showcase performance infrastructure

/**
 * Core performance metric collected by RUM system
 */
export interface PerformanceMetric {
  /** Metric name (e.g., 'LCP', 'FID', 'CLS') */
  name: string

  /** Metric value in milliseconds or score */
  value: number

  /** Timestamp when metric was collected */
  timestamp: number

  /** Anonymous session identifier */
  sessionId: string

  /** Metric rating (good, needs-improvement, poor) */
  rating?: 'good' | 'needs-improvement' | 'poor' | 'unknown'

  /** Delta from previous measurement */
  delta?: number

  /** Unique metric ID */
  id?: string

  /** Navigation type (navigate, reload, back-forward) */
  navigationType: string

  /** Connection type (4g, 3g, slow-2g, etc.) */
  connectionType: string

  /** Device memory in GB */
  deviceMemory: number

  /** Hardware concurrency (CPU cores) */
  hardwareConcurrency: number

  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Configuration for Real User Monitoring system
 */
export interface RUMConfig {
  /** Sampling rate (0-1, default: 0.1 for 10%) */
  samplingRate: number

  /** Endpoint for sending performance data */
  reportingEndpoint: string

  /** Enable fallback reporting via fetch */
  fallbackReporting: boolean

  /** Maximum buffer size before forced flush */
  maxBufferSize: number

  /** Buffer flush interval in milliseconds */
  flushInterval: number

  /** Enable Core Web Vitals tracking */
  enableCoreWebVitals?: boolean

  /** Enable custom metrics tracking */
  enableCustomMetrics?: boolean

  /** Enable error tracking */
  enableErrorTracking?: boolean

  /** Privacy settings */
  privacy?: {
    /** Hash session IDs */
    hashSessionIds: boolean

    /** Anonymize user agents */
    anonymizeUserAgents: boolean

    /** Round timestamps to nearest minute */
    roundTimestamps: boolean
  }
}

/**
 * Core Web Vitals thresholds
 */
export interface CoreWebVitalsThresholds {
  /** Largest Contentful Paint (LCP) */
  LCP: {
    good: number // ≤ 2.5s
    needsImprovement: number // ≤ 4.0s
    poor: number // > 4.0s
  }

  /** First Input Delay (FID) */
  FID: {
    good: number // ≤ 100ms
    needsImprovement: number // ≤ 300ms
    poor: number // > 300ms
  }

  /** Cumulative Layout Shift (CLS) */
  CLS: {
    good: number // ≤ 0.1
    needsImprovement: number // ≤ 0.25
    poor: number // > 0.25
  }

  /** First Contentful Paint (FCP) */
  FCP: {
    good: number // ≤ 1.8s
    needsImprovement: number // ≤ 3.0s
    poor: number // > 3.0s
  }

  /** Time to First Byte (TTFB) */
  TTFB: {
    good: number // ≤ 800ms
    needsImprovement: number // ≤ 1800ms
    poor: number // > 1800ms
  }
}

/**
 * Performance metric series for tracking over time
 */
export interface MetricSeries {
  /** Metric name */
  name: string

  /** Current value */
  current: number

  /** Previous value */
  previous: number

  /** Trend direction */
  trend: 'up' | 'down' | 'stable'

  /** Percentage change */
  changePercent: number

  /** Historical values */
  history: Array<{
    value: number
    timestamp: number
  }>

  /** Statistical data */
  stats: {
    min: number
    max: number
    average: number
    median: number
    p95: number
    p99: number
  }
}

/**
 * Performance alert rule
 */
export interface AlertRule {
  /** Metric name to monitor */
  metric: string

  /** Threshold value that triggers alert */
  threshold: number

  /** Comparison operator */
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='

  /** Alert severity */
  severity: 'info' | 'warning' | 'critical'

  /** Minimum duration before alerting */
  duration?: number

  /** Alert message template */
  message?: string

  /** Alert destinations */
  destinations?: string[]

  /** Whether alert is enabled */
  enabled: boolean
}

/**
 * Performance dashboard configuration
 */
export interface DashboardConfig {
  /** Metrics to display */
  metrics: string[]

  /** Refresh interval in milliseconds */
  refreshInterval: number

  /** Time range for historical data */
  timeRange: {
    start: number
    end: number
  }

  /** Chart configuration */
  charts: {
    type: 'line' | 'bar' | 'gauge'
    metrics: string[]
    title: string
    color?: string
  }[]

  /** Alert rules */
  alerts: AlertRule[]
}

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  /** Resource size budgets */
  resourceSizes: {
    /** Total bundle size limit in bytes */
    totalSize: number

    /** Individual chunk size limit in bytes */
    chunkSize: number

    /** Image size limit in bytes */
    imageSize: number

    /** Font size limit in bytes */
    fontsize: number
  }

  /** Performance metric budgets */
  metrics: {
    /** Lighthouse performance score (0-100) */
    lighthouseScore: number

    /** First Contentful Paint in milliseconds */
    firstContentfulPaint: number

    /** Largest Contentful Paint in milliseconds */
    largestContentfulPaint: number

    /** Time to Interactive in milliseconds */
    timeToInteractive: number

    /** Cumulative Layout Shift */
    cumulativeLayoutShift: number

    /** First Input Delay in milliseconds */
    firstInputDelay: number
  }

  /** Network conditions for testing */
  networkConditions: {
    /** Connection type */
    type: '4g' | '3g' | 'slow-2g'

    /** Download speed in Kbps */
    downloadSpeed: number

    /** Upload speed in Kbps */
    uploadSpeed: number

    /** Round trip time in milliseconds */
    rtt: number
  }
}

/**
 * Lighthouse CI configuration
 */
export interface LighthouseCIConfig {
  /** URLs to audit */
  urls: string[]

  /** Number of runs per URL */
  numberOfRuns: number

  /** Performance budget */
  budget: PerformanceBudget

  /** Chrome flags for testing */
  chromeFlags: string[]

  /** Assertions for CI */
  assertions: Record<
    string,
    [string, { minScore?: number; maxNumericValue?: number }]
  >

  /** Upload configuration */
  upload: {
    target: 'filesystem' | 'temporary-public-storage'
    outputDir?: string
  }
}

/**
 * Service Worker performance metrics
 */
export interface ServiceWorkerMetrics {
  /** Service worker installation time */
  installTime: number

  /** Service worker activation time */
  activationTime: number

  /** Cache hit ratio percentage */
  cacheHitRatio: number

  /** Average response time with service worker */
  responseTime: number

  /** Cache storage usage in bytes */
  cacheUsage: number

  /** Cache quota in bytes */
  cacheQuota: number

  /** Background sync queue size */
  syncQueueSize: number

  /** Failed requests count */
  failedRequests: number
}

/**
 * Progressive hydration metrics
 */
export interface HydrationMetrics {
  /** Components hydrated count */
  hydratedComponents: number

  /** Total hydration time */
  totalHydrationTime: number

  /** Average component hydration time */
  averageHydrationTime: number

  /** Hydration queue size */
  queueSize: number

  /** Critical components hydrated */
  criticalComponentsHydrated: number

  /** Non-critical components hydrated */
  nonCriticalComponentsHydrated: number
}

/**
 * Network information extended interface
 */
export interface NetworkInfo {
  /** Connection type */
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'

  /** Downlink speed estimate in Mbps */
  downlink: number

  /** Round trip time estimate in milliseconds */
  rtt: number

  /** Data saver mode enabled */
  saveData: boolean

  /** Connection type */
  type:
    | 'bluetooth'
    | 'cellular'
    | 'ethernet'
    | 'wifi'
    | 'other'
    | 'unknown'
    | 'none'
}

/**
 * Device information
 */
export interface DeviceInfo {
  /** Device memory in GB */
  memory: number

  /** Hardware concurrency (CPU cores) */
  hardwareConcurrency: number

  /** Screen resolution */
  screenResolution: {
    width: number
    height: number
    pixelRatio: number
  }

  /** Color depth */
  colorDepth: number

  /** Touch support */
  touchSupport: boolean

  /** Browser information */
  browser: {
    name: string
    version: string
    engine: string
  }
}

/**
 * User session information
 */
export interface SessionInfo {
  /** Anonymous session ID */
  sessionId: string

  /** Session start time */
  startTime: number

  /** Page views in session */
  pageViews: number

  /** Total session duration */
  duration: number

  /** Bounce rate indicator */
  isBounce: boolean

  /** Returning user indicator */
  isReturningUser: boolean
}

/**
 * Performance analysis result
 */
export interface PerformanceAnalysis {
  /** Overall performance score */
  score: number

  /** Core Web Vitals assessment */
  coreWebVitals: {
    LCP: { value: number; rating: string }
    FID: { value: number; rating: string }
    CLS: { value: number; rating: string }
    FCP: { value: number; rating: string }
    TTFB: { value: number; rating: string }
  }

  /** Identified bottlenecks */
  bottlenecks: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    impact: number
    recommendation: string
  }>

  /** Optimization opportunities */
  opportunities: Array<{
    title: string
    description: string
    potentialSavings: number
    effort: 'low' | 'medium' | 'high'
    priority: number
  }>

  /** Performance budget status */
  budgetStatus: {
    passed: boolean
    violations: Array<{
      metric: string
      actual: number
      budget: number
      severity: string
    }>
  }
}

/**
 * Default Core Web Vitals thresholds based on Google recommendations
 */
export const DEFAULT_CORE_WEB_VITALS_THRESHOLDS: CoreWebVitalsThresholds = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
    poor: Infinity,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
    poor: Infinity,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
    poor: Infinity,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
    poor: Infinity,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
    poor: Infinity,
  },
}

/**
 * Default performance budget for textile-showcase
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  resourceSizes: {
    totalSize: 1500000, // 1.5MB
    chunkSize: 250000, // 250KB
    imageSize: 500000, // 500KB
    fontsize: 100000, // 100KB
  },
  metrics: {
    lighthouseScore: 98,
    firstContentfulPaint: 1200,
    largestContentfulPaint: 1200,
    timeToInteractive: 2000,
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100,
  },
  networkConditions: {
    type: '4g',
    downloadSpeed: 1600,
    uploadSpeed: 750,
    rtt: 150,
  },
}
