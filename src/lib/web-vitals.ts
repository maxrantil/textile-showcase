// ABOUTME: Core Web Vitals tracking for Real User Monitoring (RUM)
// Issue #41: Performance Excellence - tracks LCP, FID, CLS, FCP, TTFB

import type { Metric } from 'web-vitals'

export interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

export interface WebVitalsData {
  lcp?: WebVitalsMetric
  fcp?: WebVitalsMetric
  cls?: WebVitalsMetric
  inp?: WebVitalsMetric
  ttfb?: WebVitalsMetric
}

type WebVitalsCallback = (metric: WebVitalsMetric) => void

// Issue #41: Queue for metrics that fire before analytics loads
const metricsQueue: WebVitalsMetric[] = []
let analyticsFlushInterval: ReturnType<typeof setInterval> | null = null

/**
 * Converts web-vitals Metric to our WebVitalsMetric format
 */
function formatMetric(metric: Metric): WebVitalsMetric {
  return {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  }
}

/**
 * Flushes queued metrics to analytics when available
 */
function flushMetricsQueue(): void {
  if (typeof window === 'undefined' || !('umami' in window)) {
    return
  }

  const umami = window.umami as {
    track: (event: string, data?: Record<string, unknown>) => void
  }

  // Flush all queued metrics
  while (metricsQueue.length > 0) {
    const queuedMetric = metricsQueue.shift()!
    umami.track('web-vital', {
      metric: queuedMetric.name,
      value: Math.round(queuedMetric.value),
      rating: queuedMetric.rating,
    })
  }

  // Clear the interval once queue is flushed
  if (analyticsFlushInterval) {
    clearInterval(analyticsFlushInterval)
    analyticsFlushInterval = null
  }
}

/**
 * Reports Web Vitals to analytics (Umami) if available
 * If analytics not ready, queues metrics for later delivery
 */
function reportToAnalytics(metric: WebVitalsMetric): void {
  // Report to Umami if available
  if (typeof window !== 'undefined' && 'umami' in window) {
    const umami = window.umami as {
      track: (event: string, data?: Record<string, unknown>) => void
    }

    // Flush any queued metrics first
    flushMetricsQueue()

    // Report current metric
    umami.track('web-vital', {
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
    })
  } else if (typeof window !== 'undefined') {
    // Issue #41: Queue metric for when analytics loads
    metricsQueue.push(metric)

    // Set up interval to check for analytics load (only once)
    if (!analyticsFlushInterval) {
      analyticsFlushInterval = setInterval(() => {
        if ('umami' in window) {
          flushMetricsQueue()
        }
      }, 1000) // Check every second

      // Clear interval after 10 seconds to avoid memory leak
      setTimeout(() => {
        if (analyticsFlushInterval) {
          clearInterval(analyticsFlushInterval)
          analyticsFlushInterval = null
        }
      }, 10000)
    }
  }

  // Log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    const ratingEmoji =
      metric.rating === 'good'
        ? '✅'
        : metric.rating === 'needs-improvement'
          ? '⚠️'
          : '❌'
    console.log(
      `[Web Vitals] ${ratingEmoji} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`
    )
  }
}

/**
 * Checks if a metric value exceeds the performance budget threshold
 */
function checkPerformanceBudget(metric: WebVitalsMetric): boolean {
  const budgets: Record<string, number> = {
    LCP: 2500, // 2.5s - Good threshold
    FCP: 1800, // 1.8s - Good threshold
    CLS: 0.1, // 0.1 - Good threshold
    INP: 200, // 200ms - Good threshold (replaces FID)
    TTFB: 800, // 800ms - Good threshold
  }

  const budget = budgets[metric.name]
  if (budget && metric.value > budget) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Performance Budget] ⚠️ ${metric.name} exceeded budget: ${metric.value.toFixed(2)} > ${budget}`
      )
    }
    return false
  }
  return true
}

/**
 * Initializes Core Web Vitals tracking
 * Call this once in your app (e.g., in _app.tsx or layout.tsx)
 */
export async function initWebVitals(
  callback?: WebVitalsCallback
): Promise<void> {
  // Only run in browser environment with PerformanceObserver support
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return
  }

  const handleMetric = (metric: Metric) => {
    const formatted = formatMetric(metric)

    // Report to analytics
    reportToAnalytics(formatted)

    // Check performance budget
    checkPerformanceBudget(formatted)

    // Call custom callback if provided
    callback?.(formatted)
  }

  try {
    // Dynamic import to avoid SSR/test environment issues
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')

    // Track all Core Web Vitals
    onCLS(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
    onINP(handleMetric) // INP replaces FID in Core Web Vitals

    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals] ✅ Core Web Vitals tracking initialized')
    }
  } catch {
    // Silently fail in environments that don't support web-vitals
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Web Vitals] ⚠️ Could not initialize tracking')
    }
  }
}

/**
 * Collects all Web Vitals for one-time reporting
 * Returns a promise that resolves with all collected metrics
 */
export async function collectWebVitals(
  timeoutMs = 10000
): Promise<WebVitalsData> {
  // Only run in browser environment with PerformanceObserver support
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return {}
  }

  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')

    return new Promise((resolve) => {
      const data: WebVitalsData = {}
      let resolved = false

      const checkComplete = () => {
        // Resolve when we have LCP and CLS (the most critical metrics)
        // or when timeout is reached
        if (!resolved && data.lcp && data.cls) {
          resolved = true
          resolve(data)
        }
      }

      onCLS((metric) => {
        data.cls = formatMetric(metric)
        checkComplete()
      })
      onFCP((metric) => {
        data.fcp = formatMetric(metric)
      })
      onLCP((metric) => {
        data.lcp = formatMetric(metric)
        checkComplete()
      })
      onTTFB((metric) => {
        data.ttfb = formatMetric(metric)
      })
      onINP((metric) => {
        data.inp = formatMetric(metric)
      })

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          resolve(data)
        }
      }, timeoutMs)
    })
  } catch {
    return {}
  }
}

/**
 * Gets the performance score based on Web Vitals
 * Score is 0-100, with 100 being perfect
 */
export function calculatePerformanceScore(data: WebVitalsData): number {
  let score = 100

  // LCP scoring (40% weight - most important)
  if (data.lcp) {
    if (data.lcp.rating === 'poor') score -= 40
    else if (data.lcp.rating === 'needs-improvement') score -= 20
  }

  // CLS scoring (25% weight)
  if (data.cls) {
    if (data.cls.rating === 'poor') score -= 25
    else if (data.cls.rating === 'needs-improvement') score -= 12
  }

  // INP scoring (25% weight)
  if (data.inp) {
    if (data.inp.rating === 'poor') score -= 25
    else if (data.inp.rating === 'needs-improvement') score -= 12
  }

  // FCP scoring (5% weight)
  if (data.fcp) {
    if (data.fcp.rating === 'poor') score -= 5
    else if (data.fcp.rating === 'needs-improvement') score -= 2
  }

  // TTFB scoring (5% weight)
  if (data.ttfb) {
    if (data.ttfb.rating === 'poor') score -= 5
    else if (data.ttfb.rating === 'needs-improvement') score -= 2
  }

  return Math.max(0, Math.min(100, score))
}
