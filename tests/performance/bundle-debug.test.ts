// ABOUTME: Debug bundle analysis to understand current state
import { analyzeBundleSize } from '../utils/bundle-analyzer'

describe('Bundle Analysis Debug', () => {
  it('should show current bundle structure', async () => {
    const bundleStats = await analyzeBundleSize()

    console.log('📊 BUNDLE ANALYSIS RESULTS:')
    console.log(`Total Size: ${Math.round(bundleStats.totalSize / 1024)}KB`)
    console.log(`Main Bundle: ${Math.round(bundleStats.mainBundle / 1024)}KB`)
    console.log(
      `Vendor Bundle: ${Math.round(bundleStats.vendorBundle / 1024)}KB`
    )
    console.log(
      `Studio Bundle: ${bundleStats.studioBundle ? Math.round(bundleStats.studioBundle / 1024) + 'KB' : 'Not found'}`
    )
    console.log(
      `Shared Chunks: ${Math.round(bundleStats.sharedChunks / 1024)}KB`
    )
    console.log('\n📦 CHUNKS FOUND:')
    bundleStats.chunks.forEach((chunk) => {
      console.log(`  - ${chunk.name}: ${Math.round(chunk.size / 1024)}KB`)
      console.log(`    Contains: ${chunk.contains.join(', ') || 'unknown'}`)
    })

    // Always pass - this is just for debugging
    expect(bundleStats.totalSize).toBeGreaterThan(0)
  })
})
