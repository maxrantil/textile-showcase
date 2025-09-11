// ABOUTME: E2E tests to verify bundle optimization in real browser environment
import { test, expect } from '@playwright/test'

test.describe('Bundle Optimization E2E', () => {
  test.describe('Route-Specific Bundle Loading', () => {
    test('should load minimal chunks for about page', async ({ page }) => {
      // RED: About page should not load Sanity chunks
      const requests: string[] = []

      page.on('request', (request) => {
        if (request.url().includes('.js')) {
          requests.push(request.url())
        }
      })

      await page.goto('/about')
      await page.waitForLoadState('networkidle')

      // Should not load any Sanity chunks
      const sanityChunks = requests.filter(
        (url) =>
          url.includes('sanity-runtime') ||
          url.includes('sanity-client') ||
          url.includes('sanity-utils')
      )

      expect(sanityChunks).toHaveLength(0)

      // Should load basic vendor chunks
      const vendorChunks = requests.filter((url) => url.includes('vendors-'))
      expect(vendorChunks.length).toBeGreaterThan(0)
    })

    test('should load Sanity chunks for home page', async ({ page }) => {
      // RED: Home page should load necessary Sanity chunks
      const requests: string[] = []

      page.on('request', (request) => {
        if (request.url().includes('.js')) {
          requests.push(request.url())
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Should load Sanity runtime chunks
      const sanityRuntimeChunks = requests.filter(
        (url) => url.includes('sanity-runtime') || url.includes('sanity-utils')
      )

      expect(sanityRuntimeChunks.length).toBeGreaterThan(0)

      // Should NOT load studio chunks on home page
      const studioChunks = requests.filter((url) =>
        url.includes('sanity-studio')
      )
      expect(studioChunks).toHaveLength(0)
    })

    test('should load studio chunks only for studio route', async ({
      page,
    }) => {
      // RED: Studio route should load studio-specific chunks
      const requests: string[] = []

      page.on('request', (request) => {
        if (request.url().includes('.js')) {
          requests.push(request.url())
        }
      })

      await page.goto('/studio')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      // Should load studio chunks
      const studioChunks = requests.filter((url) =>
        url.includes('sanity-studio')
      )
      expect(studioChunks.length).toBeGreaterThan(0)

      // May also load some runtime chunks for studio functionality
      const sanityChunks = requests.filter(
        (url) =>
          url.includes('sanity-runtime') ||
          url.includes('sanity-utils') ||
          url.includes('sanity-studio')
      )

      expect(sanityChunks.length).toBeGreaterThan(0)
    })

    test('should load Sanity chunks for project pages', async ({ page }) => {
      // RED: Project pages need Sanity for data fetching
      const requests: string[] = []

      page.on('request', (request) => {
        if (request.url().includes('.js')) {
          requests.push(request.url())
        }
      })

      // Go to home first to get a project slug
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find first project link
      const projectLink = page.locator('a[href^="/project/"]').first()
      const projectExists = (await projectLink.count()) > 0

      if (projectExists) {
        const href = await projectLink.getAttribute('href')

        // Clear requests and navigate to project
        requests.length = 0
        await page.goto(href!)
        await page.waitForLoadState('networkidle')

        // Should load Sanity chunks for project data
        const sanityChunks = requests.filter(
          (url) =>
            url.includes('sanity-runtime') || url.includes('sanity-utils')
        )

        expect(sanityChunks.length).toBeGreaterThan(0)

        // Should NOT load studio chunks
        const studioChunks = requests.filter((url) =>
          url.includes('sanity-studio')
        )
        expect(studioChunks).toHaveLength(0)
      } else {
        // Skip test if no projects available
        test.skip()
      }
    })
  })

  test.describe('Bundle Size Performance', () => {
    test('should have reasonable total bundle size for light pages', async ({
      page,
    }) => {
      // RED: Track actual network payload for light pages
      let totalSize = 0

      page.on('response', (response) => {
        if (response.url().includes('.js') && response.status() === 200) {
          // Get Content-Length or estimate
          const contentLength = response.headers()['content-length']
          if (contentLength) {
            totalSize += parseInt(contentLength, 10)
          }
        }
      })

      await page.goto('/about')
      await page.waitForLoadState('networkidle')

      // Should be under 1MB total JS payload
      expect(totalSize).toBeLessThan(1024 * 1024) // 1MB
    })

    test('should have acceptable bundle size for data pages', async ({
      page,
    }) => {
      // RED: Data pages can be larger but should stay reasonable
      let totalSize = 0

      page.on('response', (response) => {
        if (response.url().includes('.js') && response.status() === 200) {
          const contentLength = response.headers()['content-length']
          if (contentLength) {
            totalSize += parseInt(contentLength, 10)
          }
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Should be under 2.5MB total JS payload
      expect(totalSize).toBeLessThan(2.5 * 1024 * 1024) // 2.5MB
    })
  })

  test.describe('Dynamic Loading Behavior', () => {
    test('should load Sanity chunks asynchronously for data fetching', async ({
      page,
    }) => {
      // RED: Verify dynamic imports happen after initial page load
      const chunkLoadTimes: { url: string; time: number }[] = []

      page.on('response', (response) => {
        if (
          response.url().includes('sanity-') &&
          response.url().includes('.js')
        ) {
          chunkLoadTimes.push({
            url: response.url(),
            time: Date.now(),
          })
        }
      })

      const startTime = Date.now()
      await page.goto('/')

      // Wait for gallery to load (which triggers Sanity chunks)
      await page.waitForSelector('[data-testid="gallery"], .gallery, main', {
        timeout: 10000,
      })

      // Should have loaded some Sanity chunks
      expect(chunkLoadTimes.length).toBeGreaterThan(0)

      // Chunks should load after initial navigation
      chunkLoadTimes.forEach(({ time }) => {
        expect(time).toBeGreaterThan(startTime)
      })
    })

    test('should not load Sanity chunks until needed', async ({ page }) => {
      // RED: Navigate to non-Sanity page first, then Sanity page
      const sanityChunkRequests: string[] = []

      page.on('request', (request) => {
        if (
          request.url().includes('sanity-') &&
          request.url().includes('.js')
        ) {
          sanityChunkRequests.push(request.url())
        }
      })

      // First navigate to about page
      await page.goto('/about')
      await page.waitForLoadState('networkidle')

      // Should not have loaded any Sanity chunks yet
      expect(sanityChunkRequests).toHaveLength(0)

      // Now navigate to home page
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Now should have loaded Sanity chunks
      expect(sanityChunkRequests.length).toBeGreaterThan(0)
    })
  })

  test.describe('Studio Route Isolation', () => {
    test('should isolate studio functionality from main site', async ({
      page,
    }) => {
      // RED: Studio should work independently
      const requests: string[] = []

      page.on('request', (request) => {
        requests.push(request.url())
      })

      await page.goto('/studio')

      // Wait for studio to initialize
      await page.waitForLoadState('networkidle', { timeout: 15000 })

      // Should load studio-specific resources
      const studioRequests = requests.filter(
        (url) => url.includes('studio') || url.includes('sanity')
      )

      expect(studioRequests.length).toBeGreaterThan(0)

      // Studio page should be functional
      await expect(page).toHaveTitle(/studio/i)
    })

    test('should not affect main site performance when studio is unused', async ({
      page,
    }) => {
      // RED: Main site should not be slowed down by studio code
      await page.addInitScript(() => {
        window.addEventListener('load', () => {
          // @ts-expect-error - Adding custom property for test
          window.performanceEntries = performance.getEntriesByType('navigation')
        })
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const entries = await page.evaluate(() => {
        // @ts-expect-error - Reading custom property from test
        return window.performanceEntries
      })

      if (entries && entries.length > 0) {
        const loadTime = entries[0].loadEventEnd - entries[0].navigationStart

        // Should load reasonably fast (under 3 seconds on slow connections)
        expect(loadTime).toBeLessThan(3000)
      }
    })
  })
})
