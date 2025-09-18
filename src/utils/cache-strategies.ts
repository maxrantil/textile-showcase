// ABOUTME: Multi-cache strategy implementation for service worker
// Provides cache-first, network-first, and stale-while-revalidate strategies

export interface CacheOptions {
  maxAge: number
  maxEntries: number
  maxSize: number
  networkTimeoutSeconds?: number
  fallbackUrl?: string
}

export interface CacheStrategy {
  name: string
  match: (request: Request) => boolean
  handler: CacheHandler
  options: CacheOptions
}

export type CacheHandler =
  | 'CacheFirst'
  | 'NetworkFirst'
  | 'StaleWhileRevalidate'
  | 'NetworkOnly'

export class IntelligentCacheManager {
  private config: {
    maxCacheSize: number
    maxEntries: number
  }

  constructor(config = { maxCacheSize: 50 * 1024 * 1024, maxEntries: 100 }) {
    this.config = config
  }

  async handleRequest(
    request: Request,
    strategy: CacheHandler
  ): Promise<Response> {
    switch (strategy) {
      case 'CacheFirst':
        return this.handleCacheFirst(request)
      case 'NetworkFirst':
        return this.handleNetworkFirst(request)
      case 'StaleWhileRevalidate':
        return this.handleStaleWhileRevalidate(request)
      case 'NetworkOnly':
        return fetch(request)
      default:
        return fetch(request)
    }
  }

  private async handleCacheFirst(request: Request): Promise<Response> {
    const cache = await caches.open('textile-cache-v1')
    const cached = await cache.match(request)

    if (cached) {
      return cached
    }

    const response = await fetch(request)
    if (response.ok) {
      await this.put(request, response.clone())
    }
    return response
  }

  private async handleNetworkFirst(request: Request): Promise<Response> {
    try {
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open('textile-cache-v1')
        await cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      const cache = await caches.open('textile-cache-v1')
      const cached = await cache.match(request)
      if (cached) {
        return cached
      }
      throw error
    }
  }

  private async handleStaleWhileRevalidate(
    request: Request
  ): Promise<Response> {
    const cache = await caches.open('textile-cache-v1')
    const cached = await cache.match(request)

    // Return cached response immediately if available
    if (cached) {
      // Check if stale (older than 24 hours)
      const cacheDate = new Date(cached.headers.get('date') || '')
      const isStale = Date.now() - cacheDate.getTime() > 24 * 60 * 60 * 1000

      if (isStale) {
        // Update cache in background
        fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response)
            }
          })
          .catch(() => {
            // Ignore background update failures
          })
      }

      return cached
    }

    // No cache, fetch from network
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  }

  async put(request: Request, response: Response): Promise<void> {
    // Check cache size limits before adding
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      if (estimate.usage && estimate.usage > this.config.maxCacheSize) {
        await this.evictOldEntries()
      }
    }

    const cache = await caches.open('textile-cache-v1')
    await cache.put(request, response)
  }

  private async evictOldEntries(): Promise<void> {
    const cache = await caches.open('textile-cache-v1')
    const keys = await cache.keys()

    // Simple LRU: delete oldest entries (this is simplified)
    if (keys.length > 0) {
      await cache.delete(keys[0])
    }
  }

  async addStrategy(_strategy: CacheStrategy): Promise<void> {
    // Strategy registration would be implemented here
  }

  async precacheAssets(urls: string[]): Promise<void> {
    const cache = await caches.open('textile-cache-v1')
    await cache.addAll(urls)
  }

  async warmCache(routes: string[]): Promise<void> {
    await this.precacheAssets(routes)
  }

  async clearOldCaches(): Promise<void> {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter((name) => name !== 'textile-cache-v1')
        .map((name) => caches.delete(name))
    )
  }

  async getStorageEstimate(): Promise<StorageEstimate> {
    if (navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate()
    }
    return { usage: 0, quota: 0 }
  }
}
