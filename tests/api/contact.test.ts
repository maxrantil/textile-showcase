// ABOUTME: Comprehensive API route tests for /api/contact endpoint
// Tests validation, rate limiting, sanitization, email sending, and error handling

import { POST } from '@/app/api/contact/route'
import { rateLimitStore } from '@/lib/rateLimit'
import { createMockRequest, extractResponseJson } from './utils'

// Create a shared mock for Resend send function
const mockResendSend = jest.fn()

// Mock Resend
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    })),
  }
})

describe('POST /api/contact', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    mockResendSend.mockClear()
    rateLimitStore.clear() // Clear rate limit state between tests
    // Reset environment
    process.env = { ...originalEnv }
    process.env.RESEND_API_KEY = 'test_api_key'
    process.env.CONTACT_EMAIL = 'test@example.com'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Validation', () => {
    it('should reject request with missing name', async () => {
      const request = createMockRequest({
        body: {
          email: 'test@example.com',
          message: 'This is a test message that is long enough.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      // Zod returns "Invalid input" for missing required fields
      expect((data as { error: string }).error).toMatch(
        /Invalid input|Name|required/i
      )
    })

    it('should reject request with missing email', async () => {
      const request = createMockRequest({
        body: {
          name: 'Test User',
          message: 'This is a test message that is long enough.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should reject request with missing message', async () => {
      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should reject request with invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user.example.com',
        'user@.com',
      ]

      for (const email of invalidEmails) {
        const request = createMockRequest({
          body: {
            name: 'Test User',
            email,
            message: 'This is a test message that is long enough.',
          },
        })

        const response = await POST(request)
        const data = await extractResponseJson(response)

        expect(response.status).toBe(400)
        expect(data).toHaveProperty('error')
        expect((data as { error: string }).error).toMatch(/email/i)
      }
    })

    it('should reject message that is too short (< 10 chars)', async () => {
      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'Short',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect((data as { error: string }).error).toMatch(/10 characters/i)
    })

    it('should reject message that is too long (> 5000 chars)', async () => {
      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'a'.repeat(5001),
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect((data as { error: string }).error).toMatch(/too long/i)
    })

    it('should reject name that is too long (> 100 chars)', async () => {
      const request = createMockRequest({
        body: {
          name: 'a'.repeat(101),
          email: 'test@example.com',
          message: 'This is a valid message with enough characters.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should reject email that is too long (> 254 chars)', async () => {
      const longEmail = `${'a'.repeat(250)}@test.com`
      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: longEmail,
          message: 'This is a valid message with enough characters.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('HTML Sanitization', () => {
    it('should sanitize HTML in name field', async () => {
      mockResendSend.mockResolvedValueOnce({ data: { id: '123' }, error: null })

      const request = createMockRequest({
        body: {
          name: '<script>alert("xss")</script>Test User',
          email: 'test@example.com',
          message: 'This is a test message that is long enough.',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockResendSend).toHaveBeenCalled()

      const emailCall = mockResendSend.mock.calls[0][0]
      expect(emailCall.html).not.toContain('<script>')
      expect(emailCall.html).toContain('&lt;script&gt;')
    })

    it('should sanitize HTML in message field', async () => {
      mockResendSend.mockResolvedValueOnce({ data: { id: '123' }, error: null })

      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: '<img src=x onerror=alert(1)>This is a test message.',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockResendSend).toHaveBeenCalled()

      const emailCall = mockResendSend.mock.calls[0][0]
      expect(emailCall.html).not.toContain('<img')
      expect(emailCall.html).toContain('&lt;img')
    })
  })

  describe('Rate Limiting', () => {
    it('should allow first 5 requests from same IP', async () => {
      mockResendSend.mockResolvedValue({ data: { id: '123' }, error: null })

      const ip = '192.168.1.1'

      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          body: {
            name: 'Test User',
            email: 'test@example.com',
            message: `This is test message number ${i + 1}.`,
          },
          headers: {
            'x-forwarded-for': ip,
          },
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }

      expect(mockResendSend).toHaveBeenCalledTimes(5)
    })

    it('should return 429 on 6th request within rate limit window', async () => {
      mockResendSend.mockResolvedValue({ data: { id: '123' }, error: null })

      const ip = '192.168.1.2'

      // Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          body: {
            name: 'Test User',
            email: 'test@example.com',
            message: `This is test message number ${i + 1}.`,
          },
          headers: {
            'x-forwarded-for': ip,
          },
        })

        await POST(request)
      }

      // 6th request should be rate limited
      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is the 6th message, should be blocked.',
        },
        headers: {
          'x-forwarded-for': ip,
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(429)
      expect(data).toHaveProperty('error')
      expect((data as { error: string }).error).toMatch(/too many requests/i)
      expect(mockResendSend).toHaveBeenCalledTimes(5) // Should not have been called again
    })

    it('should track different IPs separately', async () => {
      mockResendSend.mockResolvedValue({ data: { id: '123' }, error: null })

      const ip1 = '192.168.1.3'
      const ip2 = '192.168.1.4'

      // 5 requests from IP1
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          body: {
            name: 'User 1',
            email: 'user1@example.com',
            message: `Message ${i + 1} from IP1.`,
          },
          headers: {
            'x-forwarded-for': ip1,
          },
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }

      // 5 requests from IP2 should also succeed
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          body: {
            name: 'User 2',
            email: 'user2@example.com',
            message: `Message ${i + 1} from IP2.`,
          },
          headers: {
            'x-forwarded-for': ip2,
          },
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }

      expect(mockResendSend).toHaveBeenCalledTimes(10)
    })
  })

  describe('Email Sending', () => {
    it('should send email with Resend on valid request', async () => {
      mockResendSend.mockResolvedValueOnce({ data: { id: '123' }, error: null })

      const request = createMockRequest({
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'I am interested in your textile designs.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message')

      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'contact@idaromme.dk',
        to: ['test@example.com'],
        subject: 'New Contact Form Message from John Doe',
        html: expect.stringContaining('John Doe'),
      })
    })

    it('should return 503 when RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY

      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message that is long enough.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(503)
      expect(data).toHaveProperty('error')
      expect((data as { error: string }).error).toMatch(
        /temporarily unavailable/i
      )
      expect(mockResendSend).not.toHaveBeenCalled()
    })

    it('should return 503 when RESEND_API_KEY is dummy key', async () => {
      process.env.RESEND_API_KEY = 'dummy_key_for_build'

      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message that is long enough.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(503)
      expect(data).toHaveProperty('error')
      expect(mockResendSend).not.toHaveBeenCalled()
    })

    it('should return 500 when Resend API fails', async () => {
      mockResendSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'API key invalid' },
      })

      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message that is long enough.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
      expect((data as { error: string }).error).toMatch(/failed to send/i)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new Request('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json{',
      }) as unknown as Parameters<typeof POST>[0]

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
      expect((data as { error: string }).error).toMatch(/unexpected error/i)
    })

    it('should handle unexpected Resend errors', async () => {
      mockResendSend.mockRejectedValueOnce(new Error('Network failure'))

      const request = createMockRequest({
        body: {
          name: 'Test User',
          email: 'test@example.com',
          message: 'This is a test message that is long enough.',
        },
      })

      const response = await POST(request)
      const data = await extractResponseJson(response)

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Input Trimming and Transformation', () => {
    it('should trim whitespace from all fields', async () => {
      mockResendSend.mockResolvedValueOnce({ data: { id: '123' }, error: null })

      const request = createMockRequest({
        body: {
          name: '  Test User  ',
          email: '  test@example.com  ',
          message: '  This is a test message with surrounding whitespace.  ',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockResendSend).toHaveBeenCalled()

      const emailCall = mockResendSend.mock.calls[0][0]
      expect(emailCall.html).toContain('Test User')
      expect(emailCall.html).not.toContain('  Test User  ')
    })
  })

  describe('IP Detection', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      mockResendSend.mockResolvedValue({ data: { id: '123' }, error: null })

      const ip = '10.0.0.1'

      // Make 5 requests with same x-forwarded-for IP
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          body: {
            name: 'Test',
            email: 'test@example.com',
            message: `Message ${i + 1}`,
          },
          headers: {
            'x-forwarded-for': ip,
          },
        })

        await POST(request)
      }

      // 6th should be rate limited
      const request = createMockRequest({
        body: {
          name: 'Test',
          email: 'test@example.com',
          message: 'Should be blocked',
        },
        headers: {
          'x-forwarded-for': ip,
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(429)
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is absent', async () => {
      mockResendSend.mockResolvedValue({ data: { id: '123' }, error: null })

      const ip = '10.0.0.2'

      // Make 5 requests with x-real-ip
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          body: {
            name: 'Test',
            email: 'test@example.com',
            message: `Message ${i + 1}`,
          },
          headers: {
            'x-real-ip': ip,
          },
        })

        await POST(request)
      }

      // 6th should be rate limited
      const request = createMockRequest({
        body: {
          name: 'Test',
          email: 'test@example.com',
          message: 'Should be blocked',
        },
        headers: {
          'x-real-ip': ip,
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(429)
    })

    it('should handle unknown IP when no headers present', async () => {
      mockResendSend.mockResolvedValueOnce({ data: { id: '123' }, error: null })

      const request = createMockRequest({
        body: {
          name: 'Test',
          email: 'test@example.com',
          message: 'Message with unknown IP',
        },
        headers: {}, // No IP headers
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })
})
