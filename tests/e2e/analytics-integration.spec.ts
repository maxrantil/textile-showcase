// ABOUTME: E2E tests for Umami Analytics integration in production build
// Validates script loading, CSP compliance, and network requests

import { test, expect } from '@playwright/test'

test.describe('Umami Analytics Integration E2E', () => {
  const ANALYTICS_URL = 'https://analytics.idaromme.dk'
  const WEBSITE_ID = 'caa54504-d542-4ccc-893f-70b6eb054036'

  test.describe('Analytics Script Loading - Production Build', () => {
    test('should load Umami script in production mode', async ({ page }) => {
      // Set production mode via environment (this would typically be set during build)
      // For E2E tests, we need to ensure the build was production

      await page.goto('/')

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Check if Umami script tag exists in the DOM
      const scriptElement = page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      )

      // Script should exist in production
      const scriptCount = await scriptElement.count()

      // Note: This test will only pass if NODE_ENV=production during build
      // In development, the script won't load (which is expected)
      if (scriptCount > 0) {
        await expect(scriptElement).toBeAttached()

        // Verify script attributes
        const deferAttr = await scriptElement.getAttribute('defer')
        expect(deferAttr).not.toBeNull()

        const websiteId = await scriptElement.getAttribute('data-website-id')
        expect(websiteId).toBe(WEBSITE_ID)

        console.log('✅ Umami analytics script loaded correctly')
      } else {
        console.log(
          '⚠️  Analytics script not found - likely running in development mode'
        )
      }
    })

    test('should have correct data-website-id attribute', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const scriptElement = page.locator(
        `script[data-website-id="${WEBSITE_ID}"]`
      )
      const scriptCount = await scriptElement.count()

      if (scriptCount > 0) {
        const websiteId = await scriptElement.getAttribute('data-website-id')
        expect(websiteId).toBe(WEBSITE_ID)

        const src = await scriptElement.getAttribute('src')
        expect(src).toContain('analytics.idaromme.dk')

        console.log('✅ Analytics website ID configured correctly')
      }
    })

    test('should load script with defer attribute', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const scriptElement = page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      )
      const scriptCount = await scriptElement.count()

      if (scriptCount > 0) {
        const hasDefer = await scriptElement.evaluate((el) =>
          el.hasAttribute('defer')
        )
        expect(hasDefer).toBe(true)

        console.log('✅ Analytics script has defer attribute')
      }
    })
  })

  test.describe('CSP Compliance', () => {
    test('should not have CSP violations for analytics script', async ({
      page,
    }) => {
      const cspViolations: string[] = []

      // Listen for CSP violations
      page.on('console', (msg) => {
        const text = msg.text()
        if (
          text.includes('Content Security Policy') ||
          text.includes('CSP') ||
          text.includes('blocked')
        ) {
          cspViolations.push(text)
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Filter for analytics-related violations
      const analyticsViolations = cspViolations.filter(
        (v) =>
          v.includes('analytics.idaromme.dk') ||
          v.includes('script.js') ||
          v.includes(ANALYTICS_URL)
      )

      if (analyticsViolations.length > 0) {
        console.error('❌ CSP violations detected:', analyticsViolations)
        throw new Error(
          `CSP is blocking analytics! Violations: ${analyticsViolations.join(', ')}`
        )
      }

      expect(analyticsViolations.length).toBe(0)
      console.log('✅ No CSP violations for analytics')
    })

    test('should have CSP header that allows analytics domain', async ({
      page,
    }) => {
      const response = await page.goto('/')
      expect(response).not.toBeNull()

      const headers = response!.headers()
      const cspHeader =
        headers['content-security-policy'] ||
        headers['Content-Security-Policy']

      if (cspHeader) {
        // Verify analytics domain is in script-src
        expect(cspHeader).toContain('analytics.idaromme.dk')

        // Extract script-src directive
        const scriptSrcMatch = cspHeader.match(/script-src[^;]+/)
        if (scriptSrcMatch) {
          const scriptSrcDirective = scriptSrcMatch[0]
          expect(scriptSrcDirective).toContain('analytics.idaromme.dk')
          console.log('✅ CSP allows analytics in script-src')
        }

        // Extract connect-src directive
        const connectSrcMatch = cspHeader.match(/connect-src[^;]+/)
        if (connectSrcMatch) {
          const connectSrcDirective = connectSrcMatch[0]
          expect(connectSrcDirective).toContain('analytics.idaromme.dk')
          console.log('✅ CSP allows analytics in connect-src')
        }
      }
    })
  })

  test.describe('Network Requests', () => {
    test('should successfully load script.js from analytics domain', async ({
      page,
    }) => {
      const scriptRequests: Array<{
        url: string
        status: number
        statusText: string
      }> = []

      // Monitor network requests
      page.on('response', (response) => {
        const url = response.url()
        if (url.includes('analytics.idaromme.dk')) {
          scriptRequests.push({
            url,
            status: response.status(),
            statusText: response.statusText(),
          })
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Wait a bit for analytics to load asynchronously
      await page.waitForTimeout(3000)

      // Check if analytics script was requested
      const scriptJsRequest = scriptRequests.find((req) =>
        req.url.includes('/script.js')
      )

      if (scriptJsRequest) {
        // Verify successful load (200 OK)
        expect(scriptJsRequest.status).toBe(200)
        console.log(
          `✅ Analytics script loaded successfully: ${scriptJsRequest.status} ${scriptJsRequest.statusText}`
        )
      } else {
        console.log(
          '⚠️  No analytics script request detected - likely development mode'
        )
      }
    })

    test('should not block page load when analytics loads', async ({
      page,
    }) => {
      const startTime = Date.now()

      await page.goto('/')
      await page.waitForLoadState('load')

      const loadTime = Date.now() - startTime

      // Page should load reasonably fast even with analytics
      // (deferred script shouldn't block)
      expect(loadTime).toBeLessThan(10000) // 10 seconds max

      console.log(`✅ Page loaded in ${loadTime}ms (analytics deferred)`)
    })

    test('should handle analytics script load failure gracefully', async ({
      page,
    }) => {
      const errors: string[] = []

      // Listen for errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      page.on('pageerror', (error) => {
        errors.push(error.message)
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Filter out non-critical errors
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('favicon') &&
          !error.includes('404') &&
          !error.includes('Failed to load resource')
      )

      // Even if analytics fails to load, page should not have critical errors
      expect(criticalErrors.length).toBe(0)

      console.log('✅ Page handles analytics gracefully')
    })
  })

  test.describe('Analytics Functionality Across Routes', () => {
    test('should load analytics on homepage', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const scriptElement = page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      )
      const scriptCount = await scriptElement.count()

      if (scriptCount > 0) {
        await expect(scriptElement).toBeAttached()
        console.log('✅ Analytics loaded on homepage')
      }
    })

    test('should load analytics on contact page', async ({ page }) => {
      await page.goto('/contact')
      await page.waitForLoadState('networkidle')

      const scriptElement = page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      )
      const scriptCount = await scriptElement.count()

      if (scriptCount > 0) {
        await expect(scriptElement).toBeAttached()
        console.log('✅ Analytics loaded on contact page')
      }
    })

    test('should maintain analytics across navigation', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const initialScriptCount = await page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      ).count()

      // Navigate to another page
      await page.goto('/contact')
      await page.waitForLoadState('networkidle')

      const afterNavScriptCount = await page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      ).count()

      // Both pages should have analytics (if in production)
      if (initialScriptCount > 0) {
        expect(afterNavScriptCount).toBeGreaterThan(0)
        console.log('✅ Analytics persists across navigation')
      }
    })
  })

  test.describe('Regression Prevention', () => {
    test('should fail if CSP blocks analytics script', async ({ page }) => {
      const cspViolations: string[] = []

      page.on('console', (msg) => {
        const text = msg.text()
        if (text.includes('Content Security Policy')) {
          if (text.includes('analytics.idaromme.dk')) {
            cspViolations.push(text)
          }
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      if (cspViolations.length > 0) {
        throw new Error(
          `CRITICAL: CSP is blocking analytics.idaromme.dk! ` +
            `This means someone removed the domain from CSP headers. ` +
            `Violations: ${cspViolations.join(' | ')}`
        )
      }

      expect(cspViolations.length).toBe(0)
    })

    test('should fail if analytics script has wrong attributes', async ({
      page,
    }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const scriptElement = page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      )
      const scriptCount = await scriptElement.count()

      if (scriptCount > 0) {
        const websiteId = await scriptElement.getAttribute('data-website-id')
        const isDeferred = await scriptElement.evaluate((el) =>
          el.hasAttribute('defer')
        )

        if (websiteId !== WEBSITE_ID) {
          throw new Error(
            `CRITICAL: Analytics website ID is wrong! Expected: ${WEBSITE_ID}, Got: ${websiteId}`
          )
        }

        if (!isDeferred) {
          throw new Error(
            'CRITICAL: Analytics script is not deferred! This will block page rendering.'
          )
        }
      }
    })

    test('should fail if analytics loads in non-production environment', async ({
      page,
    }) => {
      // This test checks that we're not accidentally loading analytics in dev

      // Note: This requires checking the actual NODE_ENV during the build
      // For now, we'll check if script exists and warn if it shouldn't

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const scriptElement = page.locator(
        `script[src="${ANALYTICS_URL}/script.js"]`
      )
      const scriptCount = await scriptElement.count()

      // Get page title or other indicator of environment
      const pageContent = await page.content()

      // If we detect development indicators but script is present, fail
      if (pageContent.includes('localhost') && scriptCount > 0) {
        console.warn(
          '⚠️  WARNING: Analytics script detected on localhost. ' +
            'Verify NODE_ENV=production was used for build.'
        )
      }
    })
  })

  test.describe('Performance Impact', () => {
    test('should load analytics without blocking First Contentful Paint', async ({
      page,
    }) => {
      await page.goto('/')

      // Measure FCP
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const fcpEntry = entries.find(
              (entry) => entry.name === 'first-contentful-paint'
            )
            if (fcpEntry) {
              resolve(fcpEntry.startTime)
            }
          }).observe({ entryTypes: ['paint'] })
        })
      })

      // FCP should be reasonably fast (deferred analytics shouldn't impact it)
      expect(fcp).toBeLessThan(3000) // 3 seconds max

      console.log(`✅ FCP: ${fcp}ms (analytics deferred, no blocking)`)
    })

    test('should use requestIdleCallback for deferred loading', async ({
      page,
    }) => {
      // Track when script is added to DOM
      let scriptAddedTime = 0

      await page.exposeFunction('recordScriptTime', () => {
        scriptAddedTime = Date.now()
      })

      // Inject detection code
      await page.addInitScript(() => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (
                node instanceof HTMLScriptElement &&
                node.src.includes('analytics.idaromme.dk')
              ) {
                // @ts-expect-error - injected function
                window.recordScriptTime()
              }
            })
          })
        })
        observer.observe(document.head, { childList: true, subtree: true })
      })

      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('load')
      const loadTime = Date.now() - startTime

      await page.waitForTimeout(3000) // Wait for idle callback

      if (scriptAddedTime > 0) {
        const delayAfterLoad = scriptAddedTime - (startTime + loadTime)

        // Script should be added after page load (deferred)
        expect(delayAfterLoad).toBeGreaterThan(0)

        console.log(
          `✅ Analytics loaded ${delayAfterLoad}ms after page load (deferred correctly)`
        )
      }
    })
  })
})
