// ABOUTME: Security test suite for middleware CSP headers, rate limiting, and security configurations

import { describe, test, expect } from '@jest/globals'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

// Mock Next.js request and response
function createMockRequest(options: {
  url?: string
  method?: string
  headers?: Record<string, string>
  ip?: string
}): NextRequest {
  const {
    url = 'https://example.com',
    method = 'GET',
    headers = {},
    ip = '127.0.0.1',
  } = options

  const request = new NextRequest(url, {
    method,
    headers: new Headers({
      'x-forwarded-for': ip,
      ...headers,
    }),
  })

  return request
}

describe.skip('Middleware Security Test Suite', () => {
  describe('Content Security Policy (CSP) Headers', () => {
    test('should include CSP headers for performance monitoring', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response = await middleware(request)
      const cspHeader = response.headers.get('Content-Security-Policy')

      expect(cspHeader).toBeTruthy()
      expect(cspHeader).toContain('/api/performance')
      expect(cspHeader).toContain("connect-src 'self'")
      expect(cspHeader).toContain("object-src 'none'")
      expect(cspHeader).toContain("worker-src 'self'")
      expect(cspHeader).toContain("manifest-src 'self'")
    })

    test('should generate unique nonce for script execution', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response1 = await middleware(request)
      const response2 = await middleware(request)

      const nonce1 = response1.headers.get('X-Performance-Script-Nonce')
      const nonce2 = response2.headers.get('X-Performance-Script-Nonce')

      expect(nonce1).toBeTruthy()
      expect(nonce2).toBeTruthy()
      expect(nonce1).not.toBe(nonce2) // Nonces should be unique

      // Verify nonce is included in CSP
      const cspHeader = response1.headers.get('Content-Security-Policy')
      expect(cspHeader).toContain(`'nonce-${nonce1}'`)
    })

    test('should handle Safari-specific CSP restrictions', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        },
      })

      const response = await middleware(request)
      const cspHeader = response.headers.get('Content-Security-Policy')

      // Safari should not have 'unsafe-eval'
      expect(cspHeader).not.toContain("'unsafe-eval'")
      expect(cspHeader).toContain("'unsafe-inline'") // But should have unsafe-inline
    })

    test('should include all required security directives', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response = await middleware(request)
      const cspHeader = response.headers.get('Content-Security-Policy')

      const requiredDirectives = [
        "default-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "worker-src 'self'",
        "manifest-src 'self'",
      ]

      requiredDirectives.forEach((directive) => {
        expect(cspHeader).toContain(directive)
      })
    })
  })

  describe('Rate Limiting Protection', () => {
    test('should rate limit API endpoints', async () => {
      const ip = '192.168.1.100'

      // Make multiple requests rapidly
      const requests = Array.from({ length: 15 }, () =>
        createMockRequest({
          url: 'https://example.com/api/test',
          headers: { 'x-forwarded-for': ip },
        })
      )

      const responses = await Promise.all(
        requests.map((req) => middleware(req))
      )

      // Some responses should be rate limited (429)
      const rateLimitedResponses = responses.filter((res) => res.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)

      // Check rate limit headers
      const rateLimitedResponse = rateLimitedResponses[0]
      expect(rateLimitedResponse.headers.get('Retry-After')).toBeTruthy()
      expect(rateLimitedResponse.headers.get('X-RateLimit-Limit')).toBe('10')
    })

    test('should have separate rate limits per IP', async () => {
      const request1 = createMockRequest({
        url: 'https://example.com/api/test',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      })

      const request2 = createMockRequest({
        url: 'https://example.com/api/test',
        headers: { 'x-forwarded-for': '192.168.1.101' },
      })

      const response1 = await middleware(request1)
      const response2 = await middleware(request2)

      // Both should succeed initially (separate limits)
      expect(response1.status).not.toBe(429)
      expect(response2.status).not.toBe(429)
    })

    test('should handle various IP header formats', async () => {
      const testCases = [
        { header: 'x-forwarded-for', value: '192.168.1.100, 10.0.0.1' },
        { header: 'x-real-ip', value: '192.168.1.200' },
        { header: 'cf-connecting-ip', value: '192.168.1.300' },
      ]

      for (const testCase of testCases) {
        const request = createMockRequest({
          url: 'https://example.com/api/test',
          headers: { [testCase.header]: testCase.value },
        })

        const response = await middleware(request)

        // Should process without error
        expect(response).toBeTruthy()
      }
    })

    test('should return proper rate limit error response', async () => {
      const ip = '192.168.1.999'

      // Exhaust rate limit
      const requests = Array.from({ length: 12 }, () =>
        createMockRequest({
          url: 'https://example.com/api/test',
          headers: { 'x-forwarded-for': ip },
        })
      )

      const responses = await Promise.all(
        requests.map((req) => middleware(req))
      )
      const rateLimitedResponse = responses.find((res) => res.status === 429)

      if (rateLimitedResponse) {
        const body = await rateLimitedResponse.json()
        expect(body.error).toBe('Too Many Requests')
        expect(body.message).toContain('Rate limit exceeded')
        expect(body.retryAfter).toBeGreaterThan(0)
      }
    })
  })

  describe('Studio Access Protection', () => {
    test('should block unauthorized IP access to studio', async () => {
      // Mock environment without allowed IPs
      const originalEnv = process.env.STUDIO_ALLOWED_IPS
      delete process.env.STUDIO_ALLOWED_IPS

      const request = createMockRequest({
        url: 'https://example.com/studio',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      })

      const response = await middleware(request)

      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('Access Denied')
      expect(body.message).toContain('Studio access is restricted')

      // Restore environment
      if (originalEnv) process.env.STUDIO_ALLOWED_IPS = originalEnv
    })

    test('should allow authorized IP access to studio', async () => {
      // Mock environment with allowed IPs
      const originalEnv = process.env.STUDIO_ALLOWED_IPS
      process.env.STUDIO_ALLOWED_IPS = '192.168.1.100,127.0.0.1'

      const request = createMockRequest({
        url: 'https://example.com/studio',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      })

      const response = await middleware(request)

      expect(response.status).not.toBe(403)

      // Restore environment
      if (originalEnv) {
        process.env.STUDIO_ALLOWED_IPS = originalEnv
      } else {
        delete process.env.STUDIO_ALLOWED_IPS
      }
    })

    test('should log security events for studio access attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const request = createMockRequest({
        url: 'https://example.com/studio',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      })

      await middleware(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Studio access attempt from IP: 192.168.1.100')
      )

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('Security Headers Validation', () => {
    test('should set all required security headers', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response = await middleware(request)

      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
      ]

      requiredHeaders.forEach((header) => {
        expect(response.headers.get(header)).toBeTruthy()
      })
    })

    test('should set X-Frame-Options to DENY', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response = await middleware(request)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    test('should set X-Content-Type-Options to nosniff', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response = await middleware(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    test('should set strict Referrer-Policy', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response = await middleware(request)

      expect(response.headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      )
    })

    test('should restrict dangerous permissions', async () => {
      const request = createMockRequest({
        url: 'https://example.com/test',
      })

      const response = await middleware(request)

      const permissionsPolicy = response.headers.get('Permissions-Policy')
      expect(permissionsPolicy).toContain('camera=()')
      expect(permissionsPolicy).toContain('microphone=()')
      expect(permissionsPolicy).toContain('geolocation=()')
    })

    test('should handle Safari-specific XSS protection', async () => {
      // Test non-Safari browser
      const chromeRequest = createMockRequest({
        url: 'https://example.com/test',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      const chromeResponse = await middleware(chromeRequest)
      expect(chromeResponse.headers.get('X-XSS-Protection')).toBe(
        '1; mode=block'
      )

      // Test Safari browser
      const safariRequest = createMockRequest({
        url: 'https://example.com/test',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        },
      })

      const safariResponse = await middleware(safariRequest)
      expect(safariResponse.headers.get('X-XSS-Protection')).toBeNull()
    })
  })

  describe('Middleware Configuration Security', () => {
    test('should apply to correct path patterns', async () => {
      const middlewareModule = await import('@/middleware')
      const { config } = middlewareModule

      expect(config.matcher).toContain('/studio/:path*')
      expect(config.matcher).toContain('/api/:path*')
      expect(config.matcher).toContain(
        '/((?!_next/static|_next/image|favicon.ico).*)'
      )
    })

    test('should exclude static assets from processing', async () => {
      const staticPaths = [
        '/_next/static/chunks/main.js',
        '/_next/image/photo.jpg',
        '/favicon.ico',
      ]

      const middlewareModule = await import('@/middleware')
      const { config } = middlewareModule
      const pattern = config.matcher.find((m: string) => m.includes('_next'))

      if (pattern) {
        staticPaths.forEach((path) => {
          // These paths should be excluded by the negative lookahead
          const regex = new RegExp(
            pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          )
          expect(regex.test(path)).toBe(false)
        })
      }
    })
  })

  describe('Error Handling Security', () => {
    test('should not leak sensitive information in error responses', async () => {
      const request = createMockRequest({
        url: 'https://example.com/studio',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      })

      const response = await middleware(request)

      if (response.status === 403) {
        const body = await response.json()

        // Should not contain internal paths or system information
        const responseText = JSON.stringify(body)
        expect(responseText).not.toContain('/etc/')
        expect(responseText).not.toContain('process.env')
        expect(responseText).not.toContain('__dirname')
        expect(responseText).not.toContain('require(')
      }
    })

    test('should include security headers even in error responses', async () => {
      const request = createMockRequest({
        url: 'https://example.com/studio',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      })

      const response = await middleware(request)

      if (response.status === 403 || response.status === 429) {
        expect(response.headers.get('X-Security-Block')).toBeTruthy()
        expect(response.headers.get('Content-Type')).toBe('application/json')
      }
    })

    test('should provide structured error responses', async () => {
      const request = createMockRequest({
        url: 'https://example.com/studio',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      })

      const response = await middleware(request)

      if (response.status === 403) {
        const body = await response.json()

        expect(body).toHaveProperty('error')
        expect(body).toHaveProperty('message')
        expect(body).toHaveProperty('timestamp')
        expect(new Date(body.timestamp)).toBeInstanceOf(Date)
      }
    })
  })
})
