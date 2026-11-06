// ABOUTME: Tests for IndexNow API endpoint for instant search engine indexing
// ABOUTME: Validates URL submission to Bing/Yandex via the IndexNow protocol

import { NextRequest } from 'next/server'

// Mock fetch globally for IndexNow API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

const TEST_SECRET = 'test-indexnow-secret'
const originalSecret = process.env.INDEXNOW_API_SECRET

const indexNowRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

describe('IndexNow API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    jest.resetModules()
    process.env.INDEXNOW_API_SECRET = TEST_SECRET
  })

  afterAll(() => {
    process.env.INDEXNOW_API_SECRET = originalSecret
  })

  describe('POST /api/indexnow authorization', () => {
    const body = { url: 'https://idaromme.dk/project/test' }

    it('rejects requests without a bearer token', async () => {
      const { POST } = await import('@/app/api/indexnow/route')
      const response = await POST(indexNowRequest(body))
      expect(response.status).toBe(401)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('rejects requests with the wrong bearer token', async () => {
      const { POST } = await import('@/app/api/indexnow/route')
      const response = await POST(
        indexNowRequest(body, { Authorization: 'Bearer wrong-secret' })
      )
      expect(response.status).toBe(401)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('is disabled (503) when INDEXNOW_API_SECRET is not configured', async () => {
      delete process.env.INDEXNOW_API_SECRET
      const { POST } = await import('@/app/api/indexnow/route')
      const response = await POST(
        indexNowRequest(body, { Authorization: 'Bearer anything' })
      )
      expect(response.status).toBe(503)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('rejects more than 100 URLs per request', async () => {
      const { POST } = await import('@/app/api/indexnow/route')
      const urls = Array.from(
        { length: 101 },
        (_, i) => `https://idaromme.dk/project/p-${i}`
      )
      const response = await POST(
        indexNowRequest({ urls }, { Authorization: `Bearer ${TEST_SECRET}` })
      )
      expect(response.status).toBe(400)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('rejects non-string URL entries', async () => {
      const { POST } = await import('@/app/api/indexnow/route')
      const response = await POST(
        indexNowRequest(
          { urls: [{ toString: 1 }] },
          { Authorization: `Bearer ${TEST_SECRET}` }
        )
      )
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/indexnow', () => {
    it('should submit a single URL to IndexNow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const { POST } = await import('@/app/api/indexnow/route')

      const request = new NextRequest('http://localhost:3000/api/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_SECRET}`,
        },
        body: JSON.stringify({
          url: 'https://idaromme.dk/project/test-project',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should submit multiple URLs to IndexNow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const { POST } = await import('@/app/api/indexnow/route')

      const request = new NextRequest('http://localhost:3000/api/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_SECRET}`,
        },
        body: JSON.stringify({
          urls: [
            'https://idaromme.dk/project/test-1',
            'https://idaromme.dk/project/test-2',
          ],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should reject URLs not from idaromme.dk', async () => {
      const { POST } = await import('@/app/api/indexnow/route')

      const request = new NextRequest('http://localhost:3000/api/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_SECRET}`,
        },
        body: JSON.stringify({
          url: 'https://malicious-site.com/page',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('domain')
    })

    it('should reject requests without URLs', async () => {
      const { POST } = await import('@/app/api/indexnow/route')

      const request = new NextRequest('http://localhost:3000/api/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_SECRET}`,
        },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should handle IndexNow API failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { POST } = await import('@/app/api/indexnow/route')

      const request = new NextRequest('http://localhost:3000/api/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_SECRET}`,
        },
        body: JSON.stringify({
          url: 'https://idaromme.dk/project/test',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // Should still return 200 but indicate partial failure
      expect(response.status).toBe(200)
      expect(data.submitted).toBeDefined()
    })
  })

  describe('IndexNow Key File', () => {
    it('should have a valid IndexNow key file in public directory', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')

      // The key should be stored as an environment variable reference
      const keyFileName = process.env.INDEXNOW_KEY || 'indexnow-idaromme'
      const keyFilePath = path.join(
        process.cwd(),
        'public',
        `${keyFileName}.txt`
      )

      // Check if key file exists
      const fileExists = await fs
        .access(keyFilePath)
        .then(() => true)
        .catch(() => false)

      expect(fileExists).toBe(true)
    })
  })
})
