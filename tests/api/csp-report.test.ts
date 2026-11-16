// ABOUTME: Tests for the CSP violation reporting endpoint
// Covers legacy report-uri and Reporting API payloads, size limits and rate limiting

import { POST, OPTIONS } from '@/app/api/csp-report/route'
import { rateLimitStore } from '@/lib/rateLimit'
import { NextRequest } from 'next/server'

const report = {
  'csp-report': {
    'document-uri': 'https://idaromme.dk/',
    'violated-directive': 'script-src',
    'blocked-uri': 'https://evil.example/x.js',
  },
}

const makeRequest = (
  body: string,
  headers: Record<string, string> = {
    'Content-Type': 'application/csp-report',
  }
) =>
  new NextRequest('http://localhost:3000/api/csp-report', {
    method: 'POST',
    headers,
    body,
  })

describe('POST /api/csp-report', () => {
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    rateLimitStore.clear()
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  it('returns 204 with an empty body for a valid legacy report', async () => {
    const response = await POST(makeRequest(JSON.stringify(report)))
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(errorSpy).toHaveBeenCalledWith(
      'CSP Violation:',
      expect.objectContaining({ violatedDirective: 'script-src' })
    )
  })

  it('accepts Reporting API (application/reports+json) arrays', async () => {
    const body = JSON.stringify([
      {
        type: 'csp-violation',
        body: {
          documentURL: 'https://idaromme.dk/',
          effectiveDirective: 'img-src',
          blockedURL: 'https://evil.example/a.png',
        },
      },
    ])
    const response = await POST(
      makeRequest(body, { 'Content-Type': 'application/reports+json' })
    )
    expect(response.status).toBe(204)
    expect(errorSpy).toHaveBeenCalledWith(
      'CSP Violation:',
      expect.objectContaining({ effectiveDirective: 'img-src' })
    )
  })

  it('returns 204 without throwing for malformed JSON', async () => {
    const response = await POST(makeRequest('{nope'))
    expect(response.status).toBe(204)
  })

  it('rejects oversized reports with 413 and does not log them', async () => {
    const big = JSON.stringify({
      'csp-report': { 'blocked-uri': 'x'.repeat(20_000) },
    })
    const response = await POST(makeRequest(big))
    expect(response.status).toBe(413)
    expect(errorSpy).not.toHaveBeenCalledWith(
      'CSP Violation:',
      expect.anything()
    )
  })

  it('truncates long field values in logs', async () => {
    const body = JSON.stringify({
      'csp-report': { 'blocked-uri': 'y'.repeat(2_000) },
    })
    await POST(makeRequest(body))
    const logged = errorSpy.mock.calls.find((c) => c[0] === 'CSP Violation:')
    expect(logged![1].blockedUri.length).toBeLessThanOrEqual(512)
  })

  it('rate limits a single client', async () => {
    const headers = {
      'Content-Type': 'application/csp-report',
      'x-forwarded-for': '203.0.113.50',
    }
    const statuses: number[] = []
    for (let i = 0; i < 25; i++) {
      const response = await POST(makeRequest(JSON.stringify(report), headers))
      statuses.push(response.status)
    }
    expect(statuses).toContain(429)
  })

  // SEC-06: only report media types, and no query strings or fragments in logs
  it.each(['text/plain', 'application/x-www-form-urlencoded', ''])(
    'rejects content type %p with 415 and logs nothing',
    async (type) => {
      const response = await POST(
        makeRequest(
          JSON.stringify(report),
          type ? { 'Content-Type': type } : {}
        )
      )
      expect(response.status).toBe(415)
      expect(errorSpy).not.toHaveBeenCalled()
    }
  )

  it('accepts application/json reports', async () => {
    const response = await POST(
      makeRequest(JSON.stringify(report), {
        'Content-Type': 'application/json; charset=utf-8',
      })
    )
    expect(response.status).toBe(204)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('drops query strings and fragments from logged URIs', async () => {
    const body = JSON.stringify({
      'csp-report': {
        'document-uri': 'https://idaromme.dk/contact?email=a@b.example#top',
        'blocked-uri': 'https://evil.example/x.js?token=secret',
        'source-file': 'https://idaromme.dk/_next/a.js?v=1#L2',
        'violated-directive': 'script-src',
      },
    })
    await POST(makeRequest(body))
    const logged = errorSpy.mock.calls.find(
      (c) => c[0] === 'CSP Violation:'
    )![1]
    expect(logged.documentUri).toBe('https://idaromme.dk/contact')
    expect(logged.blockedUri).toBe('https://evil.example/x.js')
    expect(logged.sourceFile).toBe('https://idaromme.dk/_next/a.js')
  })

  it('keeps CSP keywords in blocked-uri as they are', async () => {
    const body = JSON.stringify({
      'csp-report': {
        'blocked-uri': 'inline',
        'violated-directive': 'script-src',
      },
    })
    await POST(makeRequest(body))
    const logged = errorSpy.mock.calls.find(
      (c) => c[0] === 'CSP Violation:'
    )![1]
    expect(logged.blockedUri).toBe('inline')
  })
})

describe('OPTIONS /api/csp-report', () => {
  it('returns 204 with an Allow header', async () => {
    const response = await OPTIONS()
    expect(response.status).toBe(204)
    expect(response.headers.get('Allow')).toBe('POST, OPTIONS')
  })
})
