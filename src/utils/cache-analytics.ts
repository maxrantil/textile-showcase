// ABOUTME: Cache analytics implementation for service worker performance tracking
// Provides detailed metrics on cache efficiency and hit rates

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
