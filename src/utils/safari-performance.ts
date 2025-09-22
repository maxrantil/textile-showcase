// ABOUTME: Safari-specific performance analysis for service worker compatibility
// Measures Safari performance characteristics and compatibility

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
