// src/utils/performance.ts - Complete file with type fixes
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()

  start(name: string) {
    this.metrics.set(name, performance.now())
  }

  end(name: string): number {
    const startTime = this.metrics.get(name)
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`)
      return 0
    }
    const duration = performance.now() - startTime
    this.metrics.delete(name)
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }
    return duration
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    const result = await fn()
    this.end(name)
    return result
  }
}

export const perf = new PerformanceMonitor()

// Image preloading
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

export async function preloadImages(urls: string[]): Promise<void> {
  try {
    await Promise.all(urls.map(preloadImage))
  } catch (error) {
    console.warn('Some images failed to preload:', error)
  }
}

// Throttle and debounce
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean
  return (function(this: unknown, ...args: unknown[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout
  return (function(this: unknown, ...args: unknown[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }) as T
}

// Memory monitoring
interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
  memory: PerformanceMemory
}

export function getMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as PerformanceWithMemory).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    }
  }
  return null
}

export function logMemoryUsage(label?: string) {
  if (process.env.NODE_ENV === 'development') {
    const memory = getMemoryUsage()
    if (memory) {
      console.log(`🧠 Memory ${label ? `(${label})` : ''}: ${memory.used}MB / ${memory.total}MB (limit: ${memory.limit}MB)`)
    }
  }
}
