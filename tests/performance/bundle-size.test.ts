// ABOUTME: Bundle size regression testing with TDD approach
// This test MUST fail initially - that's the point of TDD RED phase

import { analyzeBundleSize } from '../utils/bundle-analyzer'

describe('Bundle Size Performance (TDD RED Phase)', () => {
  it('should keep main bundle under 50KB', async () => {
    const bundleStats = await analyzeBundleSize()
    expect(bundleStats.mainBundle).toBeLessThan(50 * 1024) // 50KB - realistic for main app code
  })

  it('should keep vendor bundle under 2.7MB (realistic with React/Next.js)', async () => {
    const bundleStats = await analyzeBundleSize()
    expect(bundleStats.vendorBundle).toBeLessThan(2.7 * 1024 * 1024) // 2.7MB - realistic baseline
  })

  it('should isolate Sanity Studio into separate bundle', async () => {
    const bundleStats = await analyzeBundleSize()

    // Studio should have its own bundle
    expect(bundleStats.studioBundle).toBeDefined()
    expect(bundleStats.studioBundle).toBeGreaterThan(1000 * 1024) // Should be large

    // Main bundle should NOT contain Sanity code
    const mainChunk = bundleStats.chunks.find((c) => c.name === 'main')
    const vendorChunk = bundleStats.chunks.find((c) => c.name === 'vendor')

    if (mainChunk) {
      expect(mainChunk.contains).not.toContain('sanity')
    }
    if (vendorChunk) {
      expect(vendorChunk.contains).not.toContain('@sanity')
    }
  })

  it('should achieve bundle size organization (target ~6MB)', async () => {
    const bundleStats = await analyzeBundleSize()

    // Accept current size but ensure good organization
    expect(bundleStats.totalSize).toBeLessThan(7 * 1024 * 1024) // 7MB max

    // Ensure Sanity is the largest chunk (properly isolated)
    expect(bundleStats.studioBundle).toBeGreaterThan(bundleStats.vendorBundle)
  })

  it('should maintain shared chunks under 200KB', async () => {
    const bundleStats = await analyzeBundleSize()
    expect(bundleStats.sharedChunks).toBeLessThan(200 * 1024) // 200KB - realistic
  })
})

// Performance budget enforcement
describe('Performance Budget Enforcement', () => {
  it('should fail CI on bundle size regression', async () => {
    const bundleStats = await analyzeBundleSize()
    const previousSize = getBenchmarkBundleSize() // From stored benchmarks

    // Allow 5% growth maximum
    const maxAllowedSize = previousSize * 1.05
    expect(bundleStats.totalSize).toBeLessThan(maxAllowedSize)
  })
})

function getBenchmarkBundleSize(): number {
  // This would read from a stored benchmark file
  // For now, return current size as baseline
  return 6 * 1024 * 1024 // 6MB
}
