// ABOUTME: Runs the proxy matcher through Next's own compiler to see which paths get security headers
// ABOUTME: Only known static assets may skip the proxy; any route with an image extension must not (Issue #495)

import { TextDecoder, TextEncoder } from 'node:util'
import { config } from '@/proxy'

// Next's build-time analysis expects Node globals that jsdom lacks
Object.assign(globalThis, { TextEncoder, TextDecoder })
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getMiddlewareMatchers } = require('next/dist/build/analysis/get-page-static-info')

const matchers: Array<{ regexp: string }> = getMiddlewareMatchers(
  config.matcher,
  { i18n: null }
)

function runsProxy(path: string): boolean {
  return matchers.some((m) => new RegExp(m.regexp).test(path))
}

describe('proxy matcher', () => {
  it.each([
    '/',
    '/studio',
    '/studio/x.png',
    '/studio/desk/x.svg',
    '/studio/.webp',
    '/project/some-work',
    '/project/some-work.jpg',
    '/security/dashboard.png',
    '/api/contact',
    '/api/x.gif',
    '/images.png',
    '/fonts.svg',
  ])('runs the proxy (CSP, HSTS) for %p', (path) => {
    expect(runsProxy(path)).toBe(true)
  })

  it.each([
    '/_next/static/chunks/main.js',
    '/_next/image',
    '/favicon.ico',
    '/images/placeholder.jpg',
    '/fonts/inter-400.woff2',
    '/apple-touch-icon.png',
    '/apple-touch-icon.webp',
    '/icon-96x96.png',
    '/icon-512x512.webp',
  ])('skips the proxy for the static asset %p', (path) => {
    expect(runsProxy(path)).toBe(false)
  })
})
