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
      // Use put method which validates and clones properly
      await this.put(request, response)
    }
    return response
  }

  private async handleNetworkFirst(request: Request): Promise<Response> {
    try {
      const response = await fetch(request)
      if (response.ok) {
        // Use put method which validates and clones properly
        await this.put(request, response)
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
              // Clone response to prevent cache poisoning
              cache.put(request, response.clone())
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
      // Use put method which validates and clones properly
      await this.put(request, response)
    }
    return response
  }

  async put(request: Request, response: Response): Promise<void> {
    // Validate response to prevent cache poisoning
    if (!response.ok || response.status >= 400) {
      return // Don't cache error responses
    }

    // Check cache size limits before adding
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      if (estimate.usage && estimate.usage > this.config.maxCacheSize) {
        await this.evictOldEntries()
      }
    }

    const cache = await caches.open('textile-cache-v1')
    // Always clone response to prevent cache poisoning
    await cache.put(request, response.clone())
  }

  private async evictOldEntries(): Promise<void> {
    const cache = await caches.open('textile-cache-v1')
    const keys = await cache.keys()

    // Simple LRU: delete oldest entries (this is simplified)
    if (keys.length > 0) {
      await cache.delete(keys[0])
    }
  }

  async addStrategy(strategy: CacheStrategy): Promise<void> {
    // Strategy registration would be implemented here
    // strategy parameter reserved for future implementation
    console.log('Strategy registration placeholder:', strategy.name)
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
