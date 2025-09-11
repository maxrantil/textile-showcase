// ABOUTME: Core Web Vitals performance testing with TDD approach
import {
  collectCoreWebVitals,
  initializePerformanceTracking,
} from '../utils/web-vitals-performance'

describe('Core Web Vitals Tracking (TDD RED Phase)', () => {
  beforeEach(() => {
    // Initialize performance tracking
    initializePerformanceTracking()
  })

  it('should track LCP under 2.5s (Good)', async () => {
    const vitals = await collectCoreWebVitals()
    expect(vitals.lcp).toBeLessThan(2500) // 2.5s = Good
  })

  it('should track FID under 100ms (Good)', async () => {
    const vitals = await collectCoreWebVitals()
    expect(vitals.fid).toBeLessThan(100) // 100ms = Good
  })

  it('should track CLS under 0.1 (Good)', async () => {
    const vitals = await collectCoreWebVitals()
    expect(vitals.cls).toBeLessThan(0.1) // 0.1 = Good
  })

  it('should track FCP under 1.8s (Good)', async () => {
    const vitals = await collectCoreWebVitals()
    expect(vitals.fcp).toBeLessThan(1800) // 1.8s = Good
  })

  it('should track TTFB under 800ms (Good)', async () => {
    const vitals = await collectCoreWebVitals()
    expect(vitals.ttfb).toBeLessThan(800) // 800ms = Good
  })
})

describe('Performance Budget Enforcement', () => {
  it('should fail on performance regression', async () => {
    const vitals = await collectCoreWebVitals()
    const previousBenchmark = await getPreviousPerformanceBenchmark()

    // Allow 10% degradation maximum
    expect(vitals.lcp).toBeLessThan(previousBenchmark.lcp * 1.1)
    expect(vitals.fid).toBeLessThan(previousBenchmark.fid * 1.1)
    expect(vitals.cls).toBeLessThan(previousBenchmark.cls * 1.1)
  })

  it('should track performance score above 90', async () => {
    const vitals = await collectCoreWebVitals()
    const score = calculatePerformanceScore(vitals)
    expect(score).toBeGreaterThan(90)
  })
})

async function getPreviousPerformanceBenchmark() {
  // This would read from stored benchmarks
  return {
    lcp: 2000, // 2s baseline
    fid: 80, // 80ms baseline
    cls: 0.05, // 0.05 baseline
  }
}

function calculatePerformanceScore(vitals: {
  lcp: number
  fid: number
  cls: number
  fcp?: number
  ttfb?: number
}): number {
  let score = 100

  // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
  if (vitals.lcp > 4000)
    score -= 60 // Poor
  else if (vitals.lcp > 2500) score -= 30 // Needs Improvement
  // Good performance (≤2500ms) gets no penalty

  // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
  if (vitals.fid > 300)
    score -= 50 // Poor
  else if (vitals.fid > 100) score -= 20 // Needs Improvement
  // Good performance (≤100ms) gets no penalty

  // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
  if (vitals.cls > 0.25)
    score -= 40 // Poor
  else if (vitals.cls > 0.1) score -= 20 // Needs Improvement
  // Good performance (≤0.1) gets no penalty

  // FCP scoring (Good: <1.8s, Needs Improvement: 1.8-3s, Poor: >3s)
  if (vitals.fcp && vitals.fcp > 3000)
    score -= 20 // Poor
  else if (vitals.fcp && vitals.fcp > 1800) score -= 10 // Needs Improvement
  // Good performance (≤1800ms) gets no penalty

  // TTFB scoring (Good: <800ms, Needs Improvement: 800-1800ms, Poor: >1800ms)
  if (vitals.ttfb && vitals.ttfb > 1800)
    score -= 20 // Poor
  else if (vitals.ttfb && vitals.ttfb > 800) score -= 10 // Needs Improvement
  // Good performance (≤800ms) gets no penalty

  return Math.max(0, score)
}
