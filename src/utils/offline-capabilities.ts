// ABOUTME: Offline capability implementation for critical routes
// Provides graceful degradation when network is unavailable

export interface OfflineConfig {
  criticalRoutes: string[]
  fallbackPage: string
}

export class OfflineManager {
  private config: OfflineConfig

  constructor(config?: OfflineConfig) {
    this.config = config || {
      criticalRoutes: ['/', '/project', '/contact'],
      fallbackPage: '/offline.html',
    }
  }

  async precacheRoutes(): Promise<void> {
    const cache = await caches.open('textile-routes-v1')

    // Cache critical routes and fallback page
    const urlsToCache = [
      ...this.config.criticalRoutes,
      this.config.fallbackPage,
    ]
    await cache.addAll(urlsToCache)
  }

  async handleOfflineRequest(request: Request): Promise<Response> {
    const cache = await caches.open('textile-routes-v1')

    // Try to get from cache first
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }

    // Return offline fallback page
    const fallback = await cache.match(this.config.fallbackPage)
    if (fallback) {
      return new Response(fallback.body, {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'text/html',
          'x-offline-fallback': 'true',
        },
      })
    }

    // Ultimate fallback
    return new Response('Offline - Page not available', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

export class BackgroundSyncManager {
  private queue: Request[] = []

  async queueRequest(request: Request): Promise<void> {
    this.queue.push(request)
  }

  getQueueLength(): number {
    return this.queue.length
  }

  async processQueue(): Promise<void> {
    const pendingRequests = [...this.queue]
    this.queue = []

    await Promise.all(
      pendingRequests.map(async (request) => {
        try {
          await fetch(request)
        } catch (error) {
          // Re-queue failed requests
          this.queue.push(request)
        }
      })
    )
  }
}

export class SanityCacheManager {
  private config: {
    maxImageSize: number
    allowedFormats: string[]
  }

  constructor(
    config = {
      maxImageSize: 2 * 1024 * 1024,
      allowedFormats: ['webp', 'jpg', 'png'],
    }
  ) {
    this.config = config
  }

  async handleRequest(request: Request): Promise<Response> {
    const cache = await caches.open('sanity-images-v1')
    const cached = await cache.match(request)

    if (cached) {
      return cached
    }

    // For offline scenarios, return cached version or placeholder
    throw new Error('Network unavailable and no cached version')
  }
}
