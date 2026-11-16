// ABOUTME: Runs every Cache-Control rule in next.config.ts through Next's own path matcher
// ABOUTME: Long-lived caching must never reach HTML pages or API routes (Issue #475, audit SEC-10)

import fs from 'node:fs'
import path from 'node:path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPathMatch } = require('next/dist/shared/lib/router/utils/path-match')

type HeaderRule = {
  source: string
  headers: Array<{ key: string; value: string }>
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadedConfig = require('../../next.config') as {
  headers: () => Promise<HeaderRule[]>
}

async function cacheRules() {
  const rules = await loadedConfig.headers()
  return rules
    .map((rule) => ({
      source: rule.source,
      cacheControl: rule.headers.find(
        (h) => h.key.toLowerCase() === 'cache-control'
      )?.value,
      matches: getPathMatch(rule.source) as (p: string) => false | object,
    }))
    .filter((rule) => rule.cacheControl)
}

// The public routes and APIs the site serves; none of them is fingerprinted
const dynamicPaths = [
  '/',
  '/projects',
  '/project/some-work',
  '/about',
  '/contact',
  '/favicon',
  '/icon',
  '/api/health',
  '/api/contact',
  '/api/csp-report',
  '/sw.js',
  '/manifest.json',
]

const publicDir = path.join(process.cwd(), 'public')
const iconFiles = fs
  .readdirSync(publicDir)
  .filter((f) => /^(favicon|apple-touch-icon|icon-)/.test(f))
  .map((f) => `/${f}`)

describe('next.config Cache-Control rules (SEC-10)', () => {
  it.each(dynamicPaths)('does not set Cache-Control on %s', async (p) => {
    const hits = (await cacheRules()).filter((rule) => rule.matches(p))
    expect(hits.map((rule) => rule.source)).toEqual([])
  })

  it('finds the icon files in public/', () => {
    expect(iconFiles).toEqual(
      expect.arrayContaining(['/favicon.ico', '/apple-touch-icon.png'])
    )
  })

  it.each(iconFiles)('caches the icon file %s', async (p) => {
    const hits = (await cacheRules()).filter((rule) => rule.matches(p))
    expect(hits).toHaveLength(1)
  })

  it('still caches self-hosted fonts and images', async () => {
    const rules = await cacheRules()
    for (const p of ['/fonts/inter-400.woff2', '/images/hero.webp']) {
      expect(rules.filter((rule) => rule.matches(p))).toHaveLength(1)
    }
  })
})
