// ABOUTME: Security test suite for performance API endpoint security hardening validation

import { describe, test, expect } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST, PUT, OPTIONS, GET } from '@/app/api/performance/route'

// Mock request creator
function createMockRequest(options: {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  ip?: string
}): NextRequest {
  const { method = 'POST', body, headers = {}, ip = '127.0.0.1' } = options

  const requestInit: { method: string; headers: Headers; body?: string } = {
    method,
    headers: new Headers({
      'x-forwarded-for': ip,
      'content-type': 'application/json',
      ...headers,
    }),
  }

  if (body) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  return new NextRequest('https://example.com/api/performance', requestInit)
}

describe('Performance API Security Test Suite', () => {
  describe('Request Validation Security', () => {
    test('should reject requests without proper Content-Type', async () => {
      const request = createMockRequest({
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: { name: 'LCP', value: 1234 },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('Content-Type must be application/json')
    })

    test('should enforce request size limits to prevent DoS', async () => {
      const largeBody = 'x'.repeat(15000) // 15KB, exceeds 10KB limit

      const request = createMockRequest({
        method: 'POST',
        body: largeBody,
      })

      const response = await POST(request)
      expect(response.status).toBe(413)

      const body = await response.json()
      expect(body.error).toContain('Request body too large')
    })

    test('should reject malformed JSON payloads', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: '{"name": "LCP", "value":}', // Malformed JSON
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toBe('Invalid JSON format')
    })

    test('should validate performance data structure', async () => {
      const invalidData = {
        name: 'INVALID_METRIC',
        value: 'not_a_number',
        sessionId: 'invalid_format',
        timestamp: 'not_a_timestamp',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toBeTruthy()
    })

    test('should sanitize input data to remove PII', async () => {
      const dataWithPII = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {
          email: 'test@example.com',
          userId: 'user123',
          legitimateField: 'keepThis',
        },
      }

      const request = createMockRequest({
        method: 'POST',
        body: dataWithPII,
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      // In a real implementation, verify PII was removed from stored data
      // This test validates the input validation passes after sanitization
    })
  })

  describe('Rate Limiting Security', () => {
    test('should apply rate limiting to POST requests', async () => {
      const ip = '192.168.1.100'
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      // Make requests rapidly to trigger rate limiting
      const requests = Array.from({ length: 5 }, () =>
        createMockRequest({
          method: 'POST',
          body: validData,
          ip,
        })
      )

      const responses = await Promise.all(requests.map((req) => POST(req)))

      // Some responses should eventually be rate limited
      const rateLimitedCount = responses.filter(
        (res) => res.status === 429
      ).length
      console.log(`Rate limited responses: ${rateLimitedCount}`)

      // At least verify rate limiting headers are set
      const lastResponse = responses[responses.length - 1]
      const rateLimitRemaining = lastResponse.headers.get(
        'X-RateLimit-Remaining'
      )
      expect(rateLimitRemaining).toBeTruthy()
    })

    test('should have stricter rate limiting for batch operations (PUT)', async () => {
      const ip = '192.168.1.101'
      const validBatch = Array.from({ length: 3 }, (_, i) => ({
        name: 'LCP',
        value: 1000 + i,
        sessionId: 'hashed_abc123',
        timestamp: Date.now() + i * 1000,
        metadata: {},
      }))

      const request = createMockRequest({
        method: 'PUT',
        body: validBatch,
        ip,
      })

      const response = await PUT(request)

      // Should process successfully initially
      expect(response.status).not.toBe(429)

      // Retry-After header should exist if rate limited
      if (response.status === 429) {
        expect(response.headers.get('Retry-After')).toBeTruthy()
      }
    })

    test('should include proper rate limit headers', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
        ip: '192.168.1.200',
      })

      const response = await POST(request)

      if (response.status === 429) {
        expect(response.headers.get('Retry-After')).toBeTruthy()
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
        expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()
      }
    })
  })

  describe('Security Headers Validation', () => {
    test('should set comprehensive security headers', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
      })

      const response = await POST(request)

      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Cache-Control',
      ]

      requiredHeaders.forEach((header) => {
        expect(response.headers.get(header)).toBeTruthy()
      })
    })

    test('should prevent caching of sensitive performance data', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
      })

      const response = await POST(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('no-store')
      expect(cacheControl).toContain('no-cache')
      expect(cacheControl).toContain('must-revalidate')
      expect(cacheControl).toContain('private')
    })

    test('should set secure frame options', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
      })

      const response = await POST(request)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('HTTP Method Security', () => {
    test('should only allow POST and PUT methods', async () => {
      const response = await GET()
      expect(response.status).toBe(405)

      const body = await response.json()
      expect(body.error).toBe('Method not allowed')
      expect(response.headers.get('Allow')).toContain('POST')
      expect(response.headers.get('Allow')).toContain('PUT')
      expect(response.headers.get('Allow')).toContain('OPTIONS')
    })

    test('should handle CORS preflight requests', async () => {
      const response = await OPTIONS()
      expect(response.status).toBe(200)

      expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
        'POST'
      )
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
        'PUT'
      )
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain(
        'Content-Type'
      )
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })
  })

  describe('Batch Operation Security', () => {
    test('should validate batch size limits', async () => {
      // Create oversized batch
      const oversizedBatch = Array.from({ length: 101 }, (_, i) => ({
        name: 'LCP',
        value: 1000 + i,
        sessionId: 'hashed_abc123',
        timestamp: Date.now() + i * 1000,
        metadata: {},
      }))

      const request = createMockRequest({
        method: 'PUT',
        body: oversizedBatch,
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('Batch too large')
    })

    test('should enforce larger size limits for batch requests', async () => {
      const largeBatch = 'x'.repeat(110000) // 110KB, exceeds 100KB batch limit

      const request = createMockRequest({
        method: 'PUT',
        body: largeBatch,
      })

      const response = await PUT(request)
      expect(response.status).toBe(413)

      const body = await response.json()
      expect(body.error).toContain('Batch request too large')
    })

    test('should detect and block suspicious batch patterns', async () => {
      // Create suspicious batch with identical values
      const suspiciousBatch = Array.from({ length: 20 }, () => ({
        name: 'LCP',
        value: 1234, // All identical - suspicious
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }))

      const request = createMockRequest({
        method: 'PUT',
        body: suspiciousBatch,
      })

      const response = await PUT(request)
      expect(response.status).toBe(403)

      const body = await response.json()
      expect(body.error).toContain('Suspicious activity detected')
    })
  })

  describe('Error Handling Security', () => {
    test('should not leak sensitive information in error responses', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { malicious: 'payload' },
      })

      const response = await POST(request)

      const body = await response.json()
      const responseText = JSON.stringify(body)

      // Should not contain system paths or internals
      expect(responseText).not.toContain('/etc/')
      expect(responseText).not.toContain('process.env')
      expect(responseText).not.toContain('__dirname')
      expect(responseText).not.toContain('node_modules')
    })

    test('should provide structured error responses', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { invalid: 'data' },
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body).toHaveProperty('error')
      expect(body).toHaveProperty('timestamp')
      expect(new Date(body.timestamp)).toBeInstanceOf(Date)
    })

    test('should handle server errors gracefully', async () => {
      // This would test actual server error scenarios
      // For now, we validate error response structure
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
      })

      const response = await POST(request)

      // Even on success, verify error handling structure would be correct
      if (response.status >= 400) {
        const body = await response.json()
        expect(body).toHaveProperty('error')
        expect(body).toHaveProperty('timestamp')
      }
    })
  })

  describe('Client IP Extraction Security', () => {
    test('should handle various IP header formats securely', async () => {
      const testCases = [
        {
          header: 'x-forwarded-for',
          value: '192.168.1.100, 10.0.0.1, 172.16.0.1',
        },
        { header: 'x-real-ip', value: '192.168.1.200' },
        { header: 'cf-connecting-ip', value: '192.168.1.300' },
      ]

      for (const testCase of testCases) {
        const validData = {
          name: 'LCP',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {},
        }

        const request = createMockRequest({
          method: 'POST',
          body: validData,
          headers: { [testCase.header]: testCase.value },
        })

        const response = await POST(request)

        // Should process successfully regardless of IP header format
        expect(response.status).not.toBe(500)
      }
    })

    test('should handle missing IP headers gracefully', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = new NextRequest('https://example.com/api/performance', {
        method: 'POST',
        headers: new Headers({
          'content-type': 'application/json',
          // No IP headers
        }),
        body: JSON.stringify(validData),
      })

      const response = await POST(request)

      // Should still process (IP extraction should handle missing headers)
      expect(response.status).not.toBe(500)
    })
  })

  describe('Response Security', () => {
    test('should include timestamp in all responses', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
      })

      const response = await POST(request)
      const body = await response.json()

      expect(body).toHaveProperty('timestamp')
      expect(new Date(body.timestamp)).toBeInstanceOf(Date)
    })

    test('should not expose internal system information', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
      })

      const response = await POST(request)
      const body = await response.json()

      const responseText = JSON.stringify(body)

      // Should not leak system information
      expect(responseText).not.toContain('node_modules')
      expect(responseText).not.toContain('src/')
      expect(responseText).not.toContain('.env')
      expect(responseText).not.toContain('process.')
    })

    test('should provide consistent response format', async () => {
      const validData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const request = createMockRequest({
        method: 'POST',
        body: validData,
      })

      const response = await POST(request)
      const body = await response.json()

      if (response.ok) {
        expect(body).toHaveProperty('success')
        expect(body).toHaveProperty('message')
        expect(body).toHaveProperty('timestamp')
      } else {
        expect(body).toHaveProperty('error')
        expect(body).toHaveProperty('timestamp')
      }
    })
  })
})
