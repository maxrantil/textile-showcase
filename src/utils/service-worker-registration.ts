// ABOUTME: Service worker registration and lifecycle management for Phase 2B Day 5
// Target: 50% faster repeat visits through intelligent caching

export interface ServiceWorkerConfig {
  scope: string
  updateViaCache: 'none' | 'imports' | 'all'
  skipWaiting: boolean
  clientsClaim: boolean
}

export interface CacheMetrics {
  totalSize: number
  hitRate: number
  missRate: number
  evictionCount: number
  cacheBreakdown: Record<string, { size: number; entries: number }>
}

export class ServiceWorkerManager {
  private config: ServiceWorkerConfig
  private updateCallbacks: Array<() => void> = []
  private cacheHitCallbacks: Array<(url: string, cacheTime: number) => void> =
    []

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = {
      scope: '/',
      updateViaCache: 'none',
      skipWaiting: false,
      clientsClaim: true,
      ...config,
    }
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: this.config.scope,
        updateViaCache: this.config.updateViaCache,
      })

      // Validate scope for security - handle test environment
      if (typeof location !== 'undefined') {
        const expectedScope = new URL(this.config.scope, location.origin).href
        if (registration.scope !== expectedScope) {
          throw new Error('Invalid service worker scope')
        }
      }

      // Set up update handling
      this.setupUpdateHandling(registration)

      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      return registration.unregister()
    }
    return false
  }

  async update(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return
    }

    // Add getRegistration method for tests
    const getRegistration =
      navigator.serviceWorker.getRegistration || (() => Promise.resolve(null))
    const registration = await getRegistration()

    if (registration) {
      await registration.update()

      // Handle waiting service worker
      if (registration.waiting) {
        if (registration.waiting.postMessage) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
        this.updateCallbacks.forEach((callback) => callback())
      }
    }
  }

  async getCacheMetrics(): Promise<CacheMetrics> {
    // This would be implemented with actual cache analysis
    return {
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      cacheBreakdown: {},
    }
  }

  onUpdateAvailable(callback: () => void): void {
    this.updateCallbacks.push(callback)
  }

  onCacheHit(callback: (url: string, cacheTime: number) => void): void {
    this.cacheHitCallbacks.push(callback)
  }

  onCacheReady(callback: (chunk: string) => void): void {
    // Implementation for cache ready callback
  }

  async warmCache(chunks: string[]): Promise<void> {
    // Implementation for cache warming
  }

  private setupUpdateHandling(registration: ServiceWorkerRegistration): void {
    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New service worker available
            this.updateCallbacks.forEach((callback) => callback())
          }
        })
      }
    })
  }
}
