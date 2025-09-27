// ABOUTME: Comprehensive security test suite for performance monitoring system hardening validation

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import {
  validatePerformanceData,
  validatePerformanceBatch,
  detectSuspiciousActivity,
  secureHashSessionId,
} from '@/utils/performance-security'
import {
  PerformanceRateLimiter,
  PERFORMANCE_RATE_LIMITS,
} from '@/utils/rate-limit'

// Mock environment variables for testing
const originalEnv = process.env

beforeEach(() => {
  process.env = {
    ...originalEnv,
    PERFORMANCE_SECRET_SALT: 'test-salt-for-security-testing',
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Performance Security Test Suite', () => {
  describe('Input Validation Security', () => {
    describe('validatePerformanceData', () => {
      test('should reject malicious script injection attempts', () => {
        const maliciousData = {
          name: '<script>alert("xss")</script>',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {
            url: 'javascript:alert("xss")',
            userAgent: '<img src=x onerror=alert("xss")>',
          },
        }

        const result = validatePerformanceData(maliciousData)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid metric name')
      })

      test('should prevent SQL injection attempts in metadata', () => {
        const sqlInjectionData = {
          name: 'LCP',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {
            query: "'; DROP TABLE users; --",
            filter: '1=1 OR 1=1',
          },
        }

        const result = validatePerformanceData(sqlInjectionData)
        expect(result.valid).toBe(true)
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).not.toHaveProperty('query')
      })

      test('should reject oversized payloads to prevent DoS', () => {
        const oversizedData = {
          name: 'LCP',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {
            largeField: 'x'.repeat(2000), // Exceeds 1KB limit
          },
        }

        const result = validatePerformanceData(oversizedData)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Metadata too large')
      })

      test('should validate metric value ranges to prevent data pollution', () => {
        const invalidRanges = [
          { name: 'LCP', value: -100 }, // Negative
          { name: 'CLS', value: 999999 }, // Too large
          { name: 'FCP', value: NaN }, // Not a number
          { name: 'TTFB', value: Infinity }, // Invalid number
        ]

        invalidRanges.forEach((data) => {
          const testData = {
            ...data,
            sessionId: 'hashed_abc123',
            timestamp: Date.now(),
            metadata: {},
          }

          const result = validatePerformanceData(testData)
          expect(result.valid).toBe(false)
        })
      })

      test('should validate session ID format to prevent session fixation', () => {
        const invalidSessionIds = [
          'plain_text_session',
          'admin123',
          '../../../etc/passwd',
          'hashed_', // Too short
          'not_hashed_abc123', // Wrong prefix
        ]

        invalidSessionIds.forEach((sessionId) => {
          const testData = {
            name: 'LCP',
            value: 1234,
            sessionId,
            timestamp: Date.now(),
            metadata: {},
          }

          const result = validatePerformanceData(testData)
          expect(result.valid).toBe(false)
          expect(result.error).toContain('Invalid session ID')
        })
      })

      test('should validate timestamp to prevent replay attacks', () => {
        const now = Date.now()
        const invalidTimestamps = [
          now - 10 * 60 * 1000, // Too old (10 minutes)
          now + 5 * 60 * 1000, // Too far in future (5 minutes)
          0, // Invalid timestamp
          -1, // Negative timestamp
        ]

        invalidTimestamps.forEach((timestamp) => {
          const testData = {
            name: 'LCP',
            value: 1234,
            sessionId: 'hashed_abc123',
            timestamp,
            metadata: {},
          }

          const result = validatePerformanceData(testData)
          expect(result.valid).toBe(false)
          expect(result.error).toContain('Timestamp out of acceptable range')
        })
      })
    })

    describe('validatePerformanceBatch', () => {
      test('should reject oversized batches to prevent resource exhaustion', () => {
        const oversizedBatch = Array.from({ length: 101 }, (_, i) => ({
          name: 'LCP',
          value: i,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {},
        }))

        const result = validatePerformanceBatch(oversizedBatch)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Batch too large')
      })

      test('should validate all items in batch independently', () => {
        const mixedBatch = [
          {
            name: 'LCP',
            value: 1234,
            sessionId: 'hashed_abc123',
            timestamp: Date.now(),
            metadata: {},
          },
          {
            name: 'INVALID_METRIC', // This should fail
            value: 5678,
            sessionId: 'hashed_def456',
            timestamp: Date.now(),
            metadata: {},
          },
        ]

        const result = validatePerformanceBatch(mixedBatch)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Item 1')
      })
    })

    describe('PII Sanitization', () => {
      test('should remove personally identifiable information from metadata', () => {
        const dataWithPII = {
          name: 'LCP',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {
            ip: '192.168.1.100',
            userId: 'user123',
            email: 'test@example.com',
            name: 'John Doe',
            phone: '+1234567890',
            address: '123 Main St',
            validField: 'keepThis',
          },
        }

        const result = validatePerformanceData(dataWithPII)
        expect(result.valid).toBe(true)
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).not.toHaveProperty('ip')
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).not.toHaveProperty('userId')
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).not.toHaveProperty('email')
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).not.toHaveProperty('name')
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).not.toHaveProperty('phone')
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).not.toHaveProperty('address')
        expect(
          (result.sanitizedData as Record<string, unknown>).metadata
        ).toHaveProperty('validField')
      })

      test('should sanitize URLs to remove query parameters with PII', () => {
        const dataWithPIIUrl = {
          name: 'LCP',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {
            url: 'https://example.com/page?email=test@example.com&token=secret123',
          },
        }

        const result = validatePerformanceData(dataWithPIIUrl)
        expect(result.valid).toBe(true)
        expect(
          (
            (result.sanitizedData as Record<string, unknown>)
              .metadata as Record<string, unknown>
          ).url
        ).toBe('https://example.com/page')
      })

      test('should sanitize user agent strings to remove fingerprinting data', () => {
        const detailedUserAgent =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0 CustomExtension/1.2.3'

        const testData = {
          name: 'LCP',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          userAgent: detailedUserAgent,
          metadata: {},
        }

        const result = validatePerformanceData(testData)
        expect(result.valid).toBe(true)
        expect(
          (result.sanitizedData as Record<string, unknown>).userAgent
        ).not.toContain('CustomExtension')
        expect(
          (
            (result.sanitizedData as Record<string, unknown>)
              .userAgent as string
          ).length
        ).toBeLessThan(detailedUserAgent.length)
      })
    })
  })

  describe('Suspicious Activity Detection', () => {
    test('should detect bot-like identical metric submissions', () => {
      const identicalMetrics = Array.from({ length: 10 }, () => ({
        name: 'LCP',
        value: 1234, // All identical values
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
      }))

      const result = detectSuspiciousActivity(identicalMetrics)
      expect(result.isSuspicious).toBe(true)
      expect(result.reason).toContain('Identical metric values')
    })

    test('should detect rapid-fire metric submissions', () => {
      const baseTime = Date.now()
      const rapidMetrics = Array.from({ length: 5 }, (_, i) => ({
        name: 'LCP',
        value: 1000 + i,
        sessionId: 'hashed_abc123',
        timestamp: baseTime + i * 5, // 5ms intervals - suspiciously fast
      }))

      const result = detectSuspiciousActivity(rapidMetrics)
      expect(result.isSuspicious).toBe(true)
      expect(result.reason).toContain('rapid metric submission')
    })

    test('should detect excessive volume attacks', () => {
      const volumeMetrics = Array.from({ length: 60 }, (_, i) => ({
        name: 'LCP',
        value: 1000 + Math.random() * 1000,
        sessionId: 'hashed_abc123',
        timestamp: Date.now() + i * 1000,
      }))

      const result = detectSuspiciousActivity(volumeMetrics)
      expect(result.isSuspicious).toBe(true)
      expect(result.reason).toContain('Excessive metric volume')
    })

    test('should allow legitimate varied metric submissions', () => {
      const legitimateMetrics = [
        {
          name: 'LCP',
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
        },
        {
          name: 'FCP',
          value: 987,
          sessionId: 'hashed_abc123',
          timestamp: Date.now() + 5000,
        },
        {
          name: 'CLS',
          value: 0.05,
          sessionId: 'hashed_abc123',
          timestamp: Date.now() + 10000,
        },
      ]

      const result = detectSuspiciousActivity(legitimateMetrics)
      expect(result.isSuspicious).toBe(false)
    })
  })

  describe('Rate Limiting Security', () => {
    beforeEach(() => {
      // Clear rate limit store between tests
      jest.clearAllMocks()
    })

    test('should enforce rate limits on performance metric submissions', async () => {
      const testRequestHeaders = new Map([
        ['x-forwarded-for', '192.168.1.100'],
        ['user-agent', 'TestBot/1.0'],
      ])

      // Simulate multiple rapid requests
      console.log('Rate limit test using headers:', testRequestHeaders)
      const mockRequest = {
        headers: {
          get: (key: string) => testRequestHeaders.get(key),
        },
      } as unknown as NextRequest
      console.log('Using mock request for rate limit test')

      // EMERGENCY FIX: Test with enough requests to trigger rate limiting
      const maxRequests = PERFORMANCE_RATE_LIMITS.METRICS_SUBMISSION.maxRequests
      const testRequestCount = maxRequests + 5 // Exceed limit to trigger blocking

      const requests = Array.from({ length: testRequestCount }, async () => {
        return PerformanceRateLimiter.checkLimit(
          mockRequest,
          PERFORMANCE_RATE_LIMITS.METRICS_SUBMISSION
        )
      })

      const results = await Promise.all(requests)

      // Should allow up to maxRequests, then block the rest
      const successfulRequests = results.filter((r) => r.success).length
      const blockedRequests = results.filter((r) => !r.success).length

      expect(successfulRequests).toBeLessThanOrEqual(maxRequests)
      expect(blockedRequests).toBeGreaterThan(0)
    })

    test('should have stricter limits for batch operations', async () => {
      // Batch limits should be much stricter than single metric limits
      expect(PERFORMANCE_RATE_LIMITS.METRICS_BATCH.maxRequests).toBeLessThan(
        PERFORMANCE_RATE_LIMITS.METRICS_SUBMISSION.maxRequests
      )

      // Also verify time windows
      expect(
        PERFORMANCE_RATE_LIMITS.METRICS_BATCH.windowMs
      ).toBeGreaterThanOrEqual(
        PERFORMANCE_RATE_LIMITS.METRICS_SUBMISSION.windowMs
      )
    })

    test('should differentiate rate limits by IP and User-Agent combination', async () => {
      const request1 = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.100'],
          ['user-agent', 'Chrome/91.0'],
        ]),
      } as unknown as NextRequest

      const request2 = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.101'], // Different IP
          ['user-agent', 'Chrome/91.0'],
        ]),
      } as unknown as NextRequest

      // Both should have independent rate limits
      const result1 = await PerformanceRateLimiter.checkLimit(request1)
      const result2 = await PerformanceRateLimiter.checkLimit(request2)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.remaining).toBe(result2.remaining) // Same limit available
    })
  })

  describe('Cryptographic Security', () => {
    test('should generate secure session ID hashes', () => {
      const sessionId = 'test_session_123'
      const hash1 = secureHashSessionId(sessionId)
      const hash2 = secureHashSessionId(sessionId)

      // Same input should produce same hash
      expect(hash1).toBe(hash2)

      // Hash should be deterministic but not reversible
      expect(hash1).not.toContain(sessionId)
      expect(hash1).toMatch(/^[a-z0-9]{16}$/) // 16 character hex string
    })

    test('should require salt environment variable for secure hashing', () => {
      delete process.env.PERFORMANCE_SECRET_SALT

      expect(() => {
        secureHashSessionId('test_session')
      }).toThrow('PERFORMANCE_SECRET_SALT environment variable not set')
    })

    test('should produce different hashes for different inputs', () => {
      const hash1 = secureHashSessionId('session_1')
      const hash2 = secureHashSessionId('session_2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Data Integrity Verification', () => {
    test('should validate metric value precision to prevent floating point attacks', () => {
      const precisionData = {
        name: 'LCP',
        value: 1234.123456789012345, // High precision
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const result = validatePerformanceData(precisionData)
      expect(result.valid).toBe(true)
      expect((result.sanitizedData as Record<string, unknown>).value).toBe(
        1234.12
      ) // Rounded to 2 decimal places
    })

    test('should reject invalid metric names to prevent data pollution', () => {
      const invalidNames = [
        'CUSTOM_METRIC', // Not in allowed list
        'lcp', // Wrong case
        'LCP_MODIFIED', // Modified standard name
        '', // Empty name
        null, // Null name
        123, // Numeric name
      ]

      invalidNames.forEach((name) => {
        const testData = {
          name,
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {},
        }

        const result = validatePerformanceData(testData)
        expect(result.valid).toBe(false)
      })
    })

    test('should only allow standard Core Web Vitals metrics', () => {
      const allowedMetrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP']

      allowedMetrics.forEach((name) => {
        const testData = {
          name,
          value: 1234,
          sessionId: 'hashed_abc123',
          timestamp: Date.now(),
          metadata: {},
        }

        const result = validatePerformanceData(testData)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('Error Handling Security', () => {
    test('should not leak sensitive information in error messages', () => {
      const testData = {
        name: 'LCP',
        value: 'INVALID_VALUE_WITH_SECRET_TOKEN_12345',
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: {},
      }

      const result = validatePerformanceData(testData)
      expect(result.valid).toBe(false)
      expect(result.error).not.toContain('SECRET_TOKEN')
      expect(result.error).toBe('Invalid metric value: must be number')
    })

    test('should handle malformed JSON gracefully without information disclosure', () => {
      const malformedInputs = [
        undefined,
        null,
        'string_instead_of_object',
        123,
        [],
        function () {
          return 'malicious'
        },
      ]

      malformedInputs.forEach((input) => {
        const result = validatePerformanceData(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid data format: must be object')
      })
    })
  })

  describe('Resource Exhaustion Protection', () => {
    test('should limit user agent string length to prevent memory exhaustion', () => {
      const longUserAgent = 'A'.repeat(1000) // 1000 character user agent

      const testData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        userAgent: longUserAgent,
        metadata: {},
      }

      const result = validatePerformanceData(testData)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('User agent string too long')
    })

    test('should limit session ID length to prevent memory exhaustion', () => {
      const longSessionId = 'hashed_' + 'a'.repeat(100) // Exceeds max length

      const testData = {
        name: 'LCP',
        value: 1234,
        sessionId: longSessionId,
        timestamp: Date.now(),
        metadata: {},
      }

      const result = validatePerformanceData(testData)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Session ID too long')
    })

    test('should limit metadata size to prevent payload bloat', () => {
      const largeMetadata = {
        field1: 'x'.repeat(500),
        field2: 'y'.repeat(600), // Total > 1KB
      }

      const testData = {
        name: 'LCP',
        value: 1234,
        sessionId: 'hashed_abc123',
        timestamp: Date.now(),
        metadata: largeMetadata,
      }

      const result = validatePerformanceData(testData)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Metadata too large')
    })
  })
})
