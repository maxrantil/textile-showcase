// ABOUTME: Guards the /_next/image optimizer limits from the 2026-11-15 security audit (SEC-01, SEC-02)
// SVG stays off the optimizer, and the disk cache and fetched source size are bounded

type ImagesConfig = {
  dangerouslyAllowSVG?: boolean
  maximumDiskCacheSize?: number
  maximumResponseBody?: number
  remotePatterns?: Array<{ hostname?: string; pathname?: string }>
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadedConfig = require('../../next.config') as { images: ImagesConfig }
const images = loadedConfig.images

const MB = 1024 * 1024

describe('next.config image optimizer limits', () => {
  it('does not pass SVG sources through the optimizer (SEC-01)', () => {
    expect(images.dangerouslyAllowSVG).not.toBe(true)
  })

  it('bounds the optimized-image disk cache (SEC-02)', () => {
    expect(images.maximumDiskCacheSize).toBeGreaterThan(0)
    expect(images.maximumDiskCacheSize).toBeLessThanOrEqual(512 * MB)
  })

  it('caps the size of a fetched source image below the 50 MB default (SEC-02)', () => {
    expect(images.maximumResponseBody).toBeGreaterThan(0)
    expect(images.maximumResponseBody).toBeLessThanOrEqual(10 * MB)
  })

  it('only optimizes remote images from the Sanity image CDN', () => {
    expect(images.remotePatterns).toEqual([
      expect.objectContaining({
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      }),
    ])
  })
})

export {}
