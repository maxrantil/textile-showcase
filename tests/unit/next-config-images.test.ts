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

function loadImagesWith(env: Record<string, string | undefined>): ImagesConfig {
  const saved = { ...process.env }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  try {
    let result: ImagesConfig = {}
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      result = (require('../../next.config') as { images: ImagesConfig }).images
    })
    return result
  } finally {
    process.env = saved
  }
}

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

  // Any Sanity project's images used to pass, so the site proxied other
  // people's content (Issue #491)
  it("only optimizes this project's images from the Sanity image CDN", () => {
    const pinned = loadImagesWith({
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'abc123',
      NEXT_PUBLIC_SANITY_DATASET: 'staging',
    })
    expect(pinned.remotePatterns).toEqual([
      expect.objectContaining({
        hostname: 'cdn.sanity.io',
        pathname: '/images/abc123/staging/**',
      }),
    ])
  })

  it('defaults the image dataset to production', () => {
    const pinned = loadImagesWith({
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'abc123',
      NEXT_PUBLIC_SANITY_DATASET: undefined,
    })
    expect(pinned.remotePatterns?.[0].pathname).toBe(
      '/images/abc123/production/**'
    )
  })

  it('allows no remote images when the project ID is missing', () => {
    const pinned = loadImagesWith({ NEXT_PUBLIC_SANITY_PROJECT_ID: undefined })
    expect(pinned.remotePatterns).toEqual([])
  })
})

export {}
