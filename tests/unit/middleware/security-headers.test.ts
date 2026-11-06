// ABOUTME: Tests for HTTP security and caching headers set by proxy.ts and next.config.ts
// Guards against long-lived caching of HTML/API responses and outdated security headers

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

type HeaderRule = {
  source: string
  headers: { key: string; value: string }[]
}

describe('proxy security headers', () => {
  const run = async () =>
    (await proxy(new NextRequest('https://idaromme.dk/'))).headers

  it('disables the legacy XSS auditor (OWASP recommendation)', async () => {
    expect((await run()).get('X-XSS-Protection')).toBe('0')
  })

  it('isolates the browsing context from cross-origin openers', async () => {
    expect((await run()).get('Cross-Origin-Opener-Policy')).toBe('same-origin')
  })

  it('blocks Flash/PDF cross-domain policy files', async () => {
    expect((await run()).get('X-Permitted-Cross-Domain-Policies')).toBe('none')
  })

  it('uses current Permissions-Policy feature names', async () => {
    const policy = (await run()).get('Permissions-Policy') || ''
    expect(policy).toContain('browsing-topics=()')
    expect(policy).toContain('camera=()')
    expect(policy).not.toContain('interest-cohort')
  })
})

describe('proxy CSP for the embedded Sanity Studio (Issue #389)', () => {
  const connectSrc = async (path: string) => {
    const response = await proxy(new NextRequest(`https://idaromme.dk${path}`))
    const csp = response.headers.get('Content-Security-Policy') || ''
    return csp.split(';').find((d) => d.trim().startsWith('connect-src')) || ''
  }

  it('allows the Studio to reach the Sanity project API and realtime listener', async () => {
    const directive = await connectSrc('/studio/structure')
    expect(directive).toContain('https://testproject.api.sanity.io')
    expect(directive).toContain('wss://testproject.api.sanity.io')
    expect(directive).toContain('https://api.sanity.io')
  })

  it('allows the Sanity Studio v6 font host on /studio only', async () => {
    const fontSrc = async (path: string) => {
      const response = await proxy(
        new NextRequest(`https://idaromme.dk${path}`)
      )
      const csp = response.headers.get('Content-Security-Policy') || ''
      return csp.split(';').find((d) => d.trim().startsWith('font-src')) || ''
    }
    expect(await fontSrc('/studio')).toContain(
      'https://design-system-static.sanity.io'
    )
    expect(await fontSrc('/about')).not.toContain('design-system-static')
  })

  it('keeps public pages restricted to the image CDN', async () => {
    const directive = await connectSrc('/about')
    expect(directive).not.toContain('api.sanity.io')
    expect(directive).toContain('https://cdn.sanity.io')
  })

  it('does not widen CSP for paths that merely start with "studio"', async () => {
    expect(await connectSrc('/studiofoo')).not.toContain('api.sanity.io')
  })
})

describe('next.config.ts headers', () => {
  let rules: HeaderRule[]

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../next.config')
    rules = await config.headers()
  })

  const cacheControlFor = (source: string) =>
    rules
      .find((r) => r.source === source)
      ?.headers.find((h) => h.key === 'Cache-Control')?.value

  it('does not apply immutable caching to every route (HTML, API, sw.js, manifest)', () => {
    const catchAll = rules.filter((r) => r.source === '/(.*)')
    for (const rule of catchAll) {
      expect(rule.headers.map((h) => h.key)).not.toContain('Cache-Control')
    }
  })

  it('keeps long-lived caching for fingerprint-free static assets', () => {
    expect(cacheControlFor('/fonts/:path*')).toMatch(/max-age=31536000/)
    expect(cacheControlFor('/images/:path*')).toMatch(/max-age=31536000/)
  })

  it('sends the same legacy XSS header value as the proxy', () => {
    const value = rules
      .flatMap((r) => r.headers)
      .find((h) => h.key === 'X-XSS-Protection')?.value
    expect(value ?? '0').toBe('0')
  })
})
