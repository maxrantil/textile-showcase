// ABOUTME: Performance testing utilities for validating optimization features
// Provides helpers for measuring TTI, bundle analysis, and progressive hydration effectiveness

// Mock PerformanceObserver for Jest environment
const mockPerformanceObserver = class {
  callback: (list: { getEntries: () => PerformanceEntry[] }) => void
  options?: PerformanceObserverInit

  constructor(
    callback: (list: { getEntries: () => PerformanceEntry[] }) => void
  ) {
    this.callback = callback
  }

  observe(options: PerformanceObserverInit) {
    this.options = options
    // Simulate performance entries for testing
    setTimeout(() => {
      const mockEntries: PerformanceEntry[] = [
        {
          name: 'first-contentful-paint',
          startTime: 800,
          duration: 0,
          entryType: 'paint',
          toJSON: () => ({}),
        } as PerformanceEntry,
        {
          name: 'layout-shift',
          startTime: 1200,
          duration: 0,
          entryType: 'layout-shift',
          toJSON: () => ({}),
          value: 0.1,
          hadRecentInput: false,
        } as PerformanceEntry,
        {
          name: 'longtask',
          startTime: 1000,
          duration: 100,
          entryType: 'longtask',
          toJSON: () => ({}),
        } as PerformanceEntry,
      ]
      this.callback({ getEntries: () => mockEntries })
    }, 10)
  }

  disconnect() {}
}

// Use mock in test environment
const PerformanceObserverToUse =
  typeof window !== 'undefined' && 'PerformanceObserver' in window
    ? window.PerformanceObserver
    : mockPerformanceObserver

// Mock performance.getEntriesByType for Jest environment
if (typeof performance !== 'undefined' && !performance.getEntriesByType) {
  performance.getEntriesByType = (type: string): PerformanceEntryList => {
    // Return mock performance entries for testing
    if (type === 'navigation') {
      return [
        {
          name: 'navigation',
          startTime: 0,
          duration: 1200,
          entryType: 'navigation',
          toJSON: () => ({}),
          domContentLoadedEventEnd: 1000,
          domContentLoadedEventStart: 900,
          loadEventEnd: 1200,
          loadEventStart: 1100,
          fetchStart: 100,
        } as PerformanceNavigationTiming,
      ]
    }
    if (type === 'resource') {
      return [
        {
          name: 'chunk-123.js',
          startTime: 200,
          duration: 50,
          entryType: 'resource',
          toJSON: () => ({}),
          transferSize: 45000,
          decodedBodySize: 98000,
        } as PerformanceResourceTiming,
        {
          name: 'vendor-456.js',
          startTime: 250,
          duration: 80,
          entryType: 'resource',
          toJSON: () => ({}),
          transferSize: 78000,
          decodedBodySize: 156000,
        } as PerformanceResourceTiming,
      ]
    }
    return []
  }
}

export interface PerformanceMetrics {
  tti: number // Time to Interactive
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  cls: number // Cumulative Layout Shift
  tbt: number // Total Blocking Time
  fid: number // First Input Delay
}

export interface BundleAnalysis {
  totalSize: number
  mainBundle: number
  vendorBundle: number
  dynamicChunks: Array<{
    name: string
    size: number
    contains: string[]
  }>
  compressionRatio: number
}

export interface HydrationMetrics {
  startTime: number
  endTime: number
  duration: number
  componentsHydrated: string[]
  deferredComponents: string[]
  errors: string[]
}

/**
 * Measures progressive hydration performance
 */
export function measureProgressiveHydration(): Promise<HydrationMetrics> {
  return new Promise((resolve) => {
    const metrics: HydrationMetrics = {
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      componentsHydrated: [],
      deferredComponents: [],
      errors: [],
    }

    // Track component hydration events
    const hydrationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element

            // Track gallery components
            if (element.getAttribute('data-testid')?.includes('gallery')) {
              metrics.componentsHydrated.push(
                element.getAttribute('data-testid') || 'unknown'
              )
            }
          }
        })
      })
    })

    hydrationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Complete measurement after timeout
    setTimeout(() => {
      hydrationObserver.disconnect()
      metrics.endTime = performance.now()
      metrics.duration = metrics.endTime - metrics.startTime
      resolve(metrics)
    }, 3000)
  })
}

/**
 * Measures Core Web Vitals with focus on performance optimizations
 */
export function measureCoreWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: PerformanceMetrics = {
      tti: 0,
      fcp: 0,
      lcp: 0,
      cls: 0,
      tbt: 0,
      fid: 0,
    }

    // First Contentful Paint
    new PerformanceObserverToUse((list) => {
      const entries = list.getEntries()
      const fcpEntry = entries.find(
        (entry) => entry.name === 'first-contentful-paint'
      )
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime
      }
    }).observe({ entryTypes: ['paint'] })

    // Largest Contentful Paint
    new PerformanceObserverToUse((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.lcp = lastEntry.startTime
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Cumulative Layout Shift
    new PerformanceObserverToUse((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        // CLS specific properties accessed through unknown cast for layout-shift entries
        const clsEntry = entry as unknown as {
          hadRecentInput?: boolean
          value?: number
        }
        if (!clsEntry.hadRecentInput) {
          metrics.cls += clsEntry.value || 0
        }
      })
    }).observe({ entryTypes: ['layout-shift'] })

    // Total Blocking Time (approximate)
    new PerformanceObserverToUse((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        // Longtask entries have duration property
        if (entry.duration > 50) {
          metrics.tbt += entry.duration - 50
        }
      })
    }).observe({ entryTypes: ['longtask'] })

    // First Input Delay
    new PerformanceObserverToUse((list) => {
      const entries = list.getEntries()
      const fidEntry = entries[0] as PerformanceEventTiming
      metrics.fid = fidEntry.processingStart - fidEntry.startTime
    }).observe({ entryTypes: ['first-input'] })

    // Estimate Time to Interactive
    setTimeout(() => {
      metrics.tti = estimateTimeToInteractive()
      resolve(metrics)
    }, 5000)
  })
}

/**
 * Estimates Time to Interactive based on long tasks and network activity
 */
function estimateTimeToInteractive(): number {
  const navigationEntry = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming

  if (!navigationEntry) {
    return 0
  }

  // Simple TTI estimation: domContentLoaded + buffer for hydration
  const baseTime = navigationEntry.domContentLoadedEventEnd
  const longTasks = performance.getEntriesByType('longtask')

  // Add penalty for long tasks that block interactivity
  const longTaskPenalty = longTasks.reduce((total, task) => {
    return total + Math.max(0, task.duration - 50) // Tasks >50ms block interactivity
  }, 0)

  return baseTime + longTaskPenalty
}

/**
 * Analyzes bundle size and dynamic chunk loading effectiveness
 */
export async function analyzeBundleEfficiency(): Promise<BundleAnalysis> {
  const analysis: BundleAnalysis = {
    totalSize: 0,
    mainBundle: 0,
    vendorBundle: 0,
    dynamicChunks: [],
    compressionRatio: 0,
  }

  // Analyze resource loading
  const resources = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[]

  resources.forEach((resource) => {
    const url = resource.name
    const transferSize = resource.transferSize || 0
    const decodedSize = resource.decodedBodySize || 0

    analysis.totalSize += transferSize

    // Categorize bundles
    if (url.includes('main') || url.includes('index')) {
      analysis.mainBundle += transferSize
    } else if (url.includes('vendor') || url.includes('chunk')) {
      analysis.vendorBundle += transferSize
    } else if (url.includes('Gallery')) {
      // Dynamic chunk for gallery components
      analysis.dynamicChunks.push({
        name: extractChunkName(url),
        size: transferSize,
        contains: detectChunkContents(url),
      })
    }

    // Calculate compression ratio
    if (decodedSize > 0) {
      analysis.compressionRatio = transferSize / decodedSize
    }
  })

  return analysis
}

/**
 * Validates that dynamic imports are working correctly
 */
export async function validateDynamicImports(): Promise<{
  successful: string[]
  failed: string[]
  loadTimes: { [key: string]: number }
}> {
  const results = {
    successful: [] as string[],
    failed: [] as string[],
    loadTimes: {} as { [key: string]: number },
  }

  const imports = ['@/components/Gallery', '@/components/ui/LoadingSpinner']

  for (const importPath of imports) {
    try {
      const startTime = performance.now()
      await import(importPath)
      const loadTime = performance.now() - startTime

      results.successful.push(importPath)
      results.loadTimes[importPath] = loadTime
    } catch {
      results.failed.push(importPath)
    }
  }

  return results
}

/**
 * Measures progressive hydration effectiveness
 */
export function measureHydrationEffectiveness(): Promise<{
  immediateComponents: string[]
  deferredComponents: string[]
  idleTimeComponents: string[]
  totalHydrationTime: number
  interactivityDelay: number
}> {
  return new Promise((resolve) => {
    const results = {
      immediateComponents: [] as string[],
      deferredComponents: [] as string[],
      idleTimeComponents: [] as string[],
      totalHydrationTime: 0,
      interactivityDelay: 0,
    }

    const startTime = performance.now()
    let firstInteraction = 0

    // Track first user interaction
    const trackFirstInteraction = () => {
      if (firstInteraction === 0) {
        firstInteraction = performance.now()
        results.interactivityDelay = firstInteraction - startTime
      }
    }

    document.addEventListener('click', trackFirstInteraction, { once: true })
    document.addEventListener('keydown', trackFirstInteraction, { once: true })

    // Track component hydration
    const componentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            const testId = element.getAttribute('data-testid')

            if (testId?.includes('gallery')) {
              const currentTime = performance.now()
              const timeSinceStart = currentTime - startTime

              if (timeSinceStart < 100) {
                results.immediateComponents.push(testId)
              } else if (timeSinceStart < 500) {
                results.deferredComponents.push(testId)
              } else {
                results.idleTimeComponents.push(testId)
              }
            }
          }
        })
      })
    })

    componentObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    setTimeout(() => {
      componentObserver.disconnect()
      results.totalHydrationTime = performance.now() - startTime
      resolve(results)
    }, 3000)
  })
}

/**
 * Tests error handling during dynamic imports
 */
export async function testDynamicImportErrorHandling(): Promise<{
  gracefulFailures: string[]
  catastrophicFailures: string[]
  fallbacksWorking: boolean
}> {
  const results = {
    gracefulFailures: [] as string[],
    catastrophicFailures: [] as string[],
    fallbacksWorking: false,
  }

  try {
    // Test import of non-existent module - using dynamic path to avoid TS error
    const nonExistentPath = '@/components/non-existent/Component'
    await import(/* @vite-ignore */ nonExistentPath)
  } catch {
    results.gracefulFailures.push('non-existent-component')
  }

  // Check if fallback UI is displayed
  const fallbackElements = document.querySelectorAll(
    '[data-testid="gallery-loading-skeleton"]'
  )
  results.fallbacksWorking = fallbackElements.length > 0

  return results
}

/**
 * Validates performance budget compliance
 */
export function validatePerformanceBudget(metrics: PerformanceMetrics): {
  passed: boolean
  violations: string[]
  score: number
} {
  const violations: string[] = []
  let score = 100

  // TTI Budget: <2000ms (target after optimization)
  if (metrics.tti > 2000) {
    violations.push(`TTI: ${metrics.tti}ms (budget: 2000ms)`)
    score -= 30
  }

  // FCP Budget: <1200ms
  if (metrics.fcp > 1200) {
    violations.push(`FCP: ${metrics.fcp}ms (budget: 1200ms)`)
    score -= 20
  }

  // LCP Budget: <2500ms
  if (metrics.lcp > 2500) {
    violations.push(`LCP: ${metrics.lcp}ms (budget: 2500ms)`)
    score -= 25
  }

  // CLS Budget: <0.1
  if (metrics.cls > 0.1) {
    violations.push(`CLS: ${metrics.cls} (budget: 0.1)`)
    score -= 15
  }

  // TBT Budget: <200ms
  if (metrics.tbt > 200) {
    violations.push(`TBT: ${metrics.tbt}ms (budget: 200ms)`)
    score -= 10
  }

  return {
    passed: violations.length === 0,
    violations,
    score: Math.max(0, score),
  }
}

// Helper functions
function extractChunkName(url: string): string {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return filename.split('.')[0] || 'unknown'
}

function detectChunkContents(url: string): string[] {
  const contents: string[] = []

  if (url.includes('Gallery')) contents.push('Gallery')
  if (url.includes('Desktop')) contents.push('Desktop')
  if (url.includes('Mobile')) contents.push('Mobile')
  if (url.includes('Loading')) contents.push('LoadingSpinner')

  return contents
}
