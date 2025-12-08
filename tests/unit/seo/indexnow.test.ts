// ABOUTME: Tests for IndexNow API endpoint for instant search engine indexing
// ABOUTME: Validates URL submission to Bing/Yandex via the IndexNow protocol

import { NextRequest } from 'next/server'

// Mock fetch globally for IndexNow API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('IndexNow API', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    jest.resetModules()
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
