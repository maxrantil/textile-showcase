// ABOUTME: Runs the real proxy with real next/server classes and checks request-header forwarding
// ABOUTME: The layout reads x-nonce via headers(), so the proxy must forward it on the request (Issue #475, SEC-11)

import { NextRequest } from 'next/server'
import { proxy } from '../../../src/proxy'

// NextResponse.next({ request: { headers } }) encodes forwarded request headers
// as x-middleware-override-headers plus one x-middleware-request-<name> each
function forwardedRequestHeader(response: Response, name: string) {
  const overridden = (
    response.headers.get('x-middleware-override-headers') ?? ''
  )
    .split(',')
    .map((h) => h.trim())
  if (!overridden.includes(name)) return null
  return response.headers.get(`x-middleware-request-${name}`)
}

function nonceFromCsp(csp: string | null) {
  return csp?.match(/'nonce-([^']+)'/)?.[1] ?? null
}

async function runProxy(path: string) {
  const request = new NextRequest(`https://idaromme.dk${path}`, {
    headers: { 'x-forwarded-proto': 'https', 'user-agent': 'jest' },
  })
  return (await proxy(request)) as Response
}

describe('proxy forwards the CSP nonce on the request (SEC-11)', () => {
  it('forwards x-nonce matching the nonce in the response CSP', async () => {
    const response = await runProxy('/')
    const nonce = nonceFromCsp(response.headers.get('Content-Security-Policy'))
    expect(nonce).toBeTruthy()
    expect(forwardedRequestHeader(response, 'x-nonce')).toBe(nonce)
  })

  it('forwards the same Content-Security-Policy it sends to the browser', async () => {
    const response = await runProxy('/projects')
    const csp = response.headers.get('Content-Security-Policy')
    expect(csp).toContain("'strict-dynamic'")
    expect(forwardedRequestHeader(response, 'content-security-policy')).toBe(
      csp
    )
  })

  it('keeps the original request headers', async () => {
    const response = await runProxy('/contact')
    expect(forwardedRequestHeader(response, 'user-agent')).toBe('jest')
  })

  it('uses a fresh nonce for every request', async () => {
    const first = await runProxy('/')
    const second = await runProxy('/')
    expect(forwardedRequestHeader(first, 'x-nonce')).not.toBe(
      forwardedRequestHeader(second, 'x-nonce')
    )
  })
})
