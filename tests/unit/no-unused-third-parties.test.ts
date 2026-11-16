// ABOUTME: The site uses no Google Analytics, so pages must not contact Google's analytics hosts
// ABOUTME: A preconnect or CSP allowance would hand visitors' IPs to Google for nothing (audit SEC-15)

import fs from 'node:fs'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { proxy } from '../../src/proxy'

const GOOGLE_ANALYTICS_HOSTS = [
  'www.google-analytics.com',
  'analytics.google.com',
  'www.googletagmanager.com',
]

describe('no unused third-party analytics hosts (SEC-15)', () => {
  it('the root layout has no resource hints to Google analytics hosts', () => {
    const layout = fs.readFileSync(
      path.join(process.cwd(), 'src/app/layout.tsx'),
      'utf8'
    )
    for (const host of GOOGLE_ANALYTICS_HOSTS) {
      expect(layout).not.toContain(host)
    }
  })

  it('the CSP does not allow Google analytics hosts', async () => {
    const response = (await proxy(
      new NextRequest('https://idaromme.dk/')
    )) as Response
    const csp = response.headers.get('Content-Security-Policy') ?? ''
    expect(csp).toContain('https://analytics.idaromme.dk')
    for (const host of GOOGLE_ANALYTICS_HOSTS) {
      expect(csp).not.toContain(host)
    }
  })
})
