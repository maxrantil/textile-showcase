// ABOUTME: Repeat visit performance measurement for service worker validation
// Tracks 50% TTI improvement target for repeat visits

export interface FirstVisitMetrics {
  tti: number
  resourcesDownloaded: number
  totalBytes: number
}

export interface RepeatVisitMetrics {
  tti: number
  cacheHits: number
  cacheMisses: number
  networkRequests: number
}

export interface PerformanceImprovement {
  ttiReduction: number
  percentageFaster: number
  cacheHitRatio: number
}

export class RepeatVisitAnalyzer {
  private firstVisit: FirstVisitMetrics | null = null
  private repeatVisit: RepeatVisitMetrics | null = null

  recordFirstVisit(metrics: FirstVisitMetrics): void {
    this.firstVisit = metrics
  }

  recordRepeatVisit(metrics: RepeatVisitMetrics): void {
    this.repeatVisit = metrics
  }

  calculateImprovement(): PerformanceImprovement {
    if (!this.firstVisit || !this.repeatVisit) {
      throw new Error('Both first visit and repeat visit metrics required')
    }

    const ttiReduction = this.firstVisit.tti - this.repeatVisit.tti
    const percentageFaster = (ttiReduction / this.firstVisit.tti) * 100
    const cacheHitRatio =
      this.repeatVisit.cacheHits /
      (this.repeatVisit.cacheHits + this.repeatVisit.cacheMisses)

    return {
      ttiReduction,
      percentageFaster,
      cacheHitRatio,
    }
  }
}

export class CacheAnalytics {
  private hits: Array<{ url: string; time: number }> = []
  private misses: string[] = []

  recordCacheHit(url: string, time: number): void {
    this.hits.push({ url, time })
  }

  recordCacheMiss(url: string): void {
    this.misses.push(url)
  }

  getMetrics() {
    const totalRequests = this.hits.length + this.misses.length
    const hitRatio = totalRequests > 0 ? this.hits.length / totalRequests : 0
    const averageHitTime =
      this.hits.length > 0
        ? this.hits.reduce((sum, hit) => sum + hit.time, 0) / this.hits.length
        : 0

    return {
      hitRatio,
      averageHitTime,
      totalHits: this.hits.length,
      totalMisses: this.misses.length,
    }
  }
}

export class SafariAnalyzer {
  async measurePerformance() {
    const isSafari = this.isSafari()

    return {
      serviceWorkerSupport: 'serviceWorker' in navigator,
      cacheApiSupport: 'caches' in window,
      maxCacheSize: await this.estimateMaxCacheSize(),
      conservativeTimeouts: isSafari,
    }
  }

  private isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  }

  private async estimateMaxCacheSize(): Promise<number> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return estimate.quota || 0
    }
    return 0
  }
}
