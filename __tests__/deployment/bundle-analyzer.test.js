/**
 * ABOUTME: Tests for bundle analyzer utility functionality
 * These tests validate the bundle analysis and regression detection features
 */

import bundleAnalyzer from '../../src/lib/deployment/bundle-analyzer-util'

describe('Bundle Analyzer Utility', () => {
  test('should export analyze and compareWithBaseline functions', () => {
    expect(typeof bundleAnalyzer.analyze).toBe('function')
    expect(typeof bundleAnalyzer.compareWithBaseline).toBe('function')
    expect(typeof bundleAnalyzer.saveBaseline).toBe('function')
  })

  test('should handle missing build directory gracefully', async () => {
    await expect(
      bundleAnalyzer.analyze('./non-existent-build')
    ).rejects.toThrow('Build directory not found')
  })

  test('should calculate regression correctly', () => {
    const current = { totalSize: 1100000, jsSize: 950000, cssSize: 150000 }
    const baseline = { totalSize: 1000000, jsSize: 900000, cssSize: 100000 }

    const comparison = bundleAnalyzer.compareWithBaseline(current, baseline)

    expect(comparison.totalSizeChange).toBe(100000)
    expect(comparison.percentageChange.total).toBe(10)
    expect(comparison.regressionDetected).toBe(true)
  })
})
