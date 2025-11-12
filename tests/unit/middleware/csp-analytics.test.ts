/**
 * ABOUTME: Unit tests for CSP middleware analytics configuration
 * Ensures Umami analytics domain is properly allowed in Content Security Policy
 */

import type { NextRequest } from 'next/server'

// Mock Next.js middleware types
const mockNextRequest = (
  url: string,
  protocol: string = 'https:',
  headers: Record<string, string> = {}
) => {
  const urlObj = new URL(url)
  return {
    url,
    nextUrl: {
      pathname: urlObj.pathname,
      search: urlObj.search,
      protocol,
    },
    headers: {
      get: jest.fn((key: string) => headers[key] || null),
    },
  }
}

const mockResponse = {
  headers: new Map<string, string>(),
  set: jest.fn(function (this: any, key: string, value: string) {
    this.headers.set(key, value)
  }),
}

// Create proper mocks for the static methods
const MockedNextResponse = {
  next: jest.fn(() => {
    const response = {
      headers: {
        set: jest.fn((key: string, value: string) => {
          mockResponse.headers.set(key, value)
        }),
        get: jest.fn((key: string) => mockResponse.headers.get(key)),
      },
    }
    return response
  }),
  redirect: jest.fn((url: URL) => ({
    redirected: true,
    url: url.toString(),
    headers: {
      set: jest.fn(),
    },
  })),
}

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: MockedNextResponse,
}))

describe('CSP Middleware - Analytics Configuration', () => {
  const ANALYTICS_DOMAIN = 'https://analytics.idaromme.dk'

  beforeEach(() => {
    jest.clearAllMocks()
    mockResponse.headers.clear()
    MockedNextResponse.next.mockClear()
    MockedNextResponse.redirect.mockClear()
    jest.resetModules()
    // Reset environment
    Object.defineProperty(process.env, 'SECURITY_ENABLED', {
      writable: true,
      value: undefined,
    })
    Object.defineProperty(process.env, 'NODE_ENV', {
      writable: true,
      value: undefined,
    })
  })

  describe('CSP Header Analytics Domain Inclusion', () => {
    it('should include analytics.idaromme.dk in script-src directive', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      // Get CSP header
      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeDefined()

      // Extract script-src directive
      const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
      expect(scriptSrcMatch).toBeTruthy()

      const scriptSrcDirective = scriptSrcMatch?.[0] || ''

      // Verify analytics domain is included
      expect(scriptSrcDirective).toContain(ANALYTICS_DOMAIN)
    })

    it('should include analytics.idaromme.dk in connect-src directive', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      // Get CSP header
      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeDefined()

      // Extract connect-src directive
      const connectSrcMatch = cspHeader?.match(/connect-src[^;]+/)
      expect(connectSrcMatch).toBeTruthy()

      const connectSrcDirective = connectSrcMatch?.[0] || ''

      // Verify analytics domain is included
      expect(connectSrcDirective).toContain(ANALYTICS_DOMAIN)
    })

    it('should maintain analytics domain in CSP for all routes', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const routes = ['/', '/contact', '/gallery', '/about']

      for (const route of routes) {
        jest.clearAllMocks()
        mockResponse.headers.clear()

        const request = mockNextRequest(`https://idaromme.dk${route}`, 'https:')
        await middleware(request as unknown as NextRequest)

        const cspHeader = mockResponse.headers.get('Content-Security-Policy')
        expect(cspHeader).toBeDefined()

        // Verify analytics domain in both directives
        expect(cspHeader).toContain(ANALYTICS_DOMAIN)

        const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
        const connectSrcMatch = cspHeader?.match(/connect-src[^;]+/)

        expect(scriptSrcMatch?.[0]).toContain(ANALYTICS_DOMAIN)
        expect(connectSrcMatch?.[0]).toContain(ANALYTICS_DOMAIN)
      }
    })

    it('should include analytics domain in development mode', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'development',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('http://localhost:3000/', 'http:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeDefined()

      // Analytics should be in CSP even in development
      expect(cspHeader).toContain(ANALYTICS_DOMAIN)

      const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
      const connectSrcMatch = cspHeader?.match(/connect-src[^;]+/)

      expect(scriptSrcMatch?.[0]).toContain(ANALYTICS_DOMAIN)
      expect(connectSrcMatch?.[0]).toContain(ANALYTICS_DOMAIN)
    })
  })

  describe('CSP Header Structure Validation', () => {
    it('should generate valid CSP header structure', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeDefined()

      // CSP should have proper directive structure (directives separated by semicolons)
      const directives = cspHeader?.split(';').map((d) => d.trim()) || []
      expect(directives.length).toBeGreaterThan(5)

      // Verify critical directives exist
      const directiveNames = directives.map((d) => d.split(' ')[0])
      expect(directiveNames).toContain('script-src')
      expect(directiveNames).toContain('connect-src')
      expect(directiveNames).toContain('default-src')
    })

    it('should include nonce in script-src alongside analytics domain', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
      const scriptSrcDirective = scriptSrcMatch?.[0] || ''

      // Should have both nonce and analytics domain
      expect(scriptSrcDirective).toMatch(/'nonce-[A-Za-z0-9+/=]+'/)
      expect(scriptSrcDirective).toContain(ANALYTICS_DOMAIN)
      expect(scriptSrcDirective).toContain("'self'")
    })
  })

  describe('Regression Prevention Tests', () => {
    it('should fail if analytics domain is removed from script-src', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
      const scriptSrcDirective = scriptSrcMatch?.[0] || ''

      // This test will fail if someone removes analytics.idaromme.dk
      const hasAnalyticsDomain = scriptSrcDirective.includes(ANALYTICS_DOMAIN)
      expect(hasAnalyticsDomain).toBe(true)

      if (!hasAnalyticsDomain) {
        throw new Error(
          `CRITICAL: Analytics domain ${ANALYTICS_DOMAIN} is missing from script-src CSP directive! ` +
            `This will break Umami analytics. Current script-src: ${scriptSrcDirective}`
        )
      }
    })

    it('should fail if analytics domain is removed from connect-src', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      const connectSrcMatch = cspHeader?.match(/connect-src[^;]+/)
      const connectSrcDirective = connectSrcMatch?.[0] || ''

      // This test will fail if someone removes analytics.idaromme.dk
      const hasAnalyticsDomain = connectSrcDirective.includes(ANALYTICS_DOMAIN)
      expect(hasAnalyticsDomain).toBe(true)

      if (!hasAnalyticsDomain) {
        throw new Error(
          `CRITICAL: Analytics domain ${ANALYTICS_DOMAIN} is missing from connect-src CSP directive! ` +
            `This will break Umami analytics data collection. Current connect-src: ${connectSrcDirective}`
        )
      }
    })

    it('should maintain analytics domain with other CSP modifications', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'CSP_REPORT_URI', {
        writable: true,
        value: 'https://example.com/csp-report',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')

      // Even with CSP modifications (like report-uri), analytics should remain
      expect(cspHeader).toContain(ANALYTICS_DOMAIN)
      expect(cspHeader).toContain('report-uri')

      const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
      const connectSrcMatch = cspHeader?.match(/connect-src[^;]+/)

      expect(scriptSrcMatch?.[0]).toContain(ANALYTICS_DOMAIN)
      expect(connectSrcMatch?.[0]).toContain(ANALYTICS_DOMAIN)
    })
  })

  describe('Security Validation', () => {
    it('should not allow wildcard origins with analytics domain', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')
      const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
      const scriptSrcDirective = scriptSrcMatch?.[0] || ''

      // Should NOT have wildcard with analytics
      expect(scriptSrcDirective).not.toContain('https://*')
      expect(scriptSrcDirective).not.toContain('http://*')

      // Should have specific analytics domain
      expect(scriptSrcDirective).toContain(ANALYTICS_DOMAIN)
    })

    it('should maintain strict CSP while allowing analytics', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })

      const { middleware } = await import('../../../src/middleware')

      const request = mockNextRequest('https://idaromme.dk/', 'https:')
      await middleware(request as unknown as NextRequest)

      const cspHeader = mockResponse.headers.get('Content-Security-Policy')

      // Should have strict directives
      expect(cspHeader).toContain("default-src 'self'")
      expect(cspHeader).toContain("object-src 'none'")
      expect(cspHeader).toContain("frame-ancestors 'none'")

      // But should still allow analytics
      expect(cspHeader).toContain(ANALYTICS_DOMAIN)
    })
  })
})
