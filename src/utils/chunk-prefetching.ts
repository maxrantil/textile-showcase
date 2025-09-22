// ABOUTME: Intelligent chunk prefetching for service worker integration
// Coordinates with progressive hydration for optimal caching strategies

export interface PrefetchConfig {
  criticalChunks: string[]
  highPriorityChunks: string[]
  lowPriorityChunks: string[]
}

export interface NetworkStrategy {
  aggressiveness: 'aggressive' | 'balanced' | 'conservative'
  maxConcurrent: number
  chunkSizeLimit: number
}

export class IntelligentPrefetcher {
  private config: PrefetchConfig
  private chunkStatus: Map<string, 'pending' | 'prefetching' | 'cached'> =
    new Map()

  constructor(config?: PrefetchConfig) {
    this.config = config || {
      criticalChunks: ['vendor-core.js', 'react.js'],
      highPriorityChunks: ['gallery-chunk.js', 'ui-libs.js'],
      lowPriorityChunks: ['contact-chunk.js', 'project-chunk.js'],
    }
  }

  async warmCache(): Promise<void> {
    const strategy = await this.getNetworkStrategy()

    // Respect data saver mode
    if (this.isDataSaverMode()) {
      // Only cache critical chunks
      await this.cacheCriticalChunks()
      return
    }

    // Cache chunks based on strategy
    await this.cacheCriticalChunks()

    if (strategy.aggressiveness !== 'conservative') {
      await this.cacheHighPriorityChunks()
    }

    if (strategy.aggressiveness === 'aggressive') {
      await this.cacheLowPriorityChunks()
    }
  }

  async getNetworkStrategy(): Promise<NetworkStrategy> {
    const connection = (
      navigator as Navigator & {
        connection?: { effectiveType?: string; saveData?: boolean }
      }
    ).connection

    if (!connection) {
      return {
        aggressiveness: 'balanced',
        maxConcurrent: 4,
        chunkSizeLimit: 200 * 1024, // 200KB
      }
    }

    switch (connection.effectiveType) {
      case '3g':
        return {
          aggressiveness: 'conservative',
          maxConcurrent: 2,
          chunkSizeLimit: 100 * 1024, // 100KB
        }
      case '2g':
      case 'slow-2g':
        return {
          aggressiveness: 'conservative',
          maxConcurrent: 1,
          chunkSizeLimit: 50 * 1024, // 50KB
        }
      default:
        return {
          aggressiveness: 'balanced',
          maxConcurrent: 4,
          chunkSizeLimit: 200 * 1024, // 200KB
        }
    }
  }

  onComponentHydrated(component: string): void {
    // Find chunk for component and prioritize it
    const chunkName = this.getChunkForComponent(component)
    if (chunkName) {
      this.chunkStatus.set(chunkName, 'prefetching')
    }
  }

  getChunkStatus(chunkName: string): string {
    return this.chunkStatus.get(chunkName) || 'pending'
  }

  private async cacheCriticalChunks(): Promise<void> {
    const cache = await caches.open('textile-chunks-v1')
    await cache.addAll(this.config.criticalChunks)
  }

  private async cacheHighPriorityChunks(): Promise<void> {
    const cache = await caches.open('textile-chunks-v1')
    await cache.addAll(this.config.highPriorityChunks)
  }

  private async cacheLowPriorityChunks(): Promise<void> {
    const cache = await caches.open('textile-chunks-v1')
    await cache.addAll(this.config.lowPriorityChunks)
  }

  private isDataSaverMode(): boolean {
    const connection = (
      navigator as Navigator & {
        connection?: { effectiveType?: string; saveData?: boolean }
      }
    ).connection
    return !!(connection && connection.saveData === true)
  }

  private getChunkForComponent(component: string): string | null {
    // Map component to chunk name
    const componentChunkMap: Record<string, string> = {
      Gallery: 'gallery-chunk.js',
      ContactForm: 'contact-chunk.js',
      ProjectDetails: 'project-chunk.js',
    }

    return componentChunkMap[component] || null
  }
}
