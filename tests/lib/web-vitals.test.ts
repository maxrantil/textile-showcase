// ABOUTME: Tests for Core Web Vitals tracking library
// Issue #41: Performance Excellence - RUM testing

import {
  calculatePerformanceScore,
  WebVitalsData,
  WebVitalsMetric,
} from '@/lib/web-vitals'

describe('Web Vitals Library', () => {
  describe('calculatePerformanceScore', () => {
    it('should return 100 for all good metrics', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 1500, 'good'),
        cls: createMetric('CLS', 0.05, 'good'),
        inp: createMetric('INP', 100, 'good'),
        fcp: createMetric('FCP', 1200, 'good'),
        ttfb: createMetric('TTFB', 400, 'good'),
      }

      expect(calculatePerformanceScore(data)).toBe(100)
    })

    it('should penalize poor LCP heavily (40 points)', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 5000, 'poor'),
        cls: createMetric('CLS', 0.05, 'good'),
        inp: createMetric('INP', 100, 'good'),
        fcp: createMetric('FCP', 1200, 'good'),
        ttfb: createMetric('TTFB', 400, 'good'),
      }

      expect(calculatePerformanceScore(data)).toBe(60)
    })

    it('should penalize needs-improvement LCP (20 points)', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 3000, 'needs-improvement'),
        cls: createMetric('CLS', 0.05, 'good'),
        inp: createMetric('INP', 100, 'good'),
        fcp: createMetric('FCP', 1200, 'good'),
        ttfb: createMetric('TTFB', 400, 'good'),
      }

      expect(calculatePerformanceScore(data)).toBe(80)
    })

    it('should penalize poor CLS (25 points)', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 1500, 'good'),
        cls: createMetric('CLS', 0.3, 'poor'),
        inp: createMetric('INP', 100, 'good'),
        fcp: createMetric('FCP', 1200, 'good'),
        ttfb: createMetric('TTFB', 400, 'good'),
      }

      expect(calculatePerformanceScore(data)).toBe(75)
    })

    it('should penalize poor INP (25 points)', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 1500, 'good'),
        cls: createMetric('CLS', 0.05, 'good'),
        inp: createMetric('INP', 600, 'poor'),
        fcp: createMetric('FCP', 1200, 'good'),
        ttfb: createMetric('TTFB', 400, 'good'),
      }

      expect(calculatePerformanceScore(data)).toBe(75)
    })

    it('should handle missing metrics gracefully', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 1500, 'good'),
      }

      expect(calculatePerformanceScore(data)).toBe(100)
    })

    it('should accumulate penalties for multiple poor metrics', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 5000, 'poor'), // -40
        cls: createMetric('CLS', 0.3, 'poor'), // -25
        inp: createMetric('INP', 600, 'poor'), // -25
        fcp: createMetric('FCP', 4000, 'poor'), // -5
        ttfb: createMetric('TTFB', 2000, 'poor'), // -5
      }

      expect(calculatePerformanceScore(data)).toBe(0)
    })

    it('should handle mixed ratings correctly', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 3000, 'needs-improvement'), // -20
        cls: createMetric('CLS', 0.15, 'needs-improvement'), // -12
        inp: createMetric('INP', 100, 'good'), // 0
        fcp: createMetric('FCP', 1200, 'good'), // 0
        ttfb: createMetric('TTFB', 400, 'good'), // 0
      }

      expect(calculatePerformanceScore(data)).toBe(68)
    })

    it('should never return negative score', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 10000, 'poor'),
        cls: createMetric('CLS', 1.0, 'poor'),
        inp: createMetric('INP', 1000, 'poor'),
        fcp: createMetric('FCP', 10000, 'poor'),
        ttfb: createMetric('TTFB', 10000, 'poor'),
      }

      expect(calculatePerformanceScore(data)).toBeGreaterThanOrEqual(0)
    })

    it('should never exceed 100', () => {
      const data: WebVitalsData = {
        lcp: createMetric('LCP', 500, 'good'),
        cls: createMetric('CLS', 0, 'good'),
        inp: createMetric('INP', 10, 'good'),
        fcp: createMetric('FCP', 100, 'good'),
        ttfb: createMetric('TTFB', 50, 'good'),
      }

      expect(calculatePerformanceScore(data)).toBeLessThanOrEqual(100)
    })
  })
})

// Helper function to create mock metrics
function createMetric(
  name: string,
  value: number,
  rating: 'good' | 'needs-improvement' | 'poor'
): WebVitalsMetric {
  return {
    name,
    value,
    rating,
    delta: value,
    id: `${name}-${Date.now()}`,
  }
}
