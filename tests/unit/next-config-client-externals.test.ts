// ABOUTME: Guards against replacing Sanity packages with null in client builds (Issue #389)
// The embedded Studio at /studio is client code that needs the real packages

type WebpackConfig = { externals?: Record<string, unknown> }
type WebpackFn = (
  config: WebpackConfig,
  ctx: { dev: boolean; isServer: boolean }
) => WebpackConfig

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadedConfig = require('../../next.config') as { webpack: WebpackFn }

const STUDIO_PACKAGES = [
  'sanity',
  'next-sanity',
  '@sanity/ui',
  '@sanity/icons',
  '@sanity/vision',
  '@sanity/types',
]

describe('next.config webpack externals for client production builds', () => {
  const result = loadedConfig.webpack({}, { dev: false, isServer: false })
  const externals = (result.externals ?? {}) as Record<string, unknown>

  it.each(STUDIO_PACKAGES)(
    'does not replace %s with null (would crash /studio)',
    (pkg) => {
      expect(externals[pkg]).toBeUndefined()
    }
  )
})

export {}
