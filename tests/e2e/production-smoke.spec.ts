/**
 * ABOUTME: Production smoke tests for deployed application
 * Validates CSP headers and analytics on REAL production URL (https://idaromme.dk)
 * These tests catch issues that unit/local E2E tests miss
 */

import { test, expect } from '@playwright/test'
import { setupTestPage } from './helpers/test-setup'

const PRODUCTION_URL = 'https://idaromme.dk'
const ANALYTICS_DOMAIN = 'https://analytics.idaromme.dk'
const OLD_UMAMI_DOMAIN = 'umami.is'
const OLD_IP_DOMAIN = '70.34.205.18'

// Skip these tests in CI unless explicitly enabled
const shouldRunProductionTests =
  process.env.RUN_PRODUCTION_TESTS === 'true' ||
  process.env.CI === 'false' ||
  !process.env.CI

test.describe('Production Smoke Tests', () => {
  test.skip(!shouldRunProductionTests, 'Production tests disabled in CI')

  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
  })

  test.describe('Production CSP Headers Validation', () => {
    test('should have correct CSP header on production', async ({ request }) => {
      const response = await request.get(PRODUCTION_URL)
      expect(response.ok()).toBe(true)

      const headers = response.headers()
      const cspHeader =
        headers['content-security-policy'] ||
        headers['Content-Security-Policy']

      if (!cspHeader) {
        throw new Error(
          `CRITICAL: No Content-Security-Policy header found on production!\n` +
            `URL: ${PRODUCTION_URL}\n` +
            `This is a severe security issue.`
        )
      }

      expect(cspHeader).toBeDefined()
      console.log('✅ Production has CSP header')
    })

    test('should include analytics.idaromme.dk in production CSP script-src', async ({
      request,
    }) => {
      const response = await request.get(PRODUCTION_URL)
      const cspHeader = response.headers()['content-security-policy']

      if (!cspHeader) {
        throw new Error('No CSP header found')
      }

      // Extract script-src directive
      const scriptSrcMatch = cspHeader.match(/script-src[^;]+/)
      expect(scriptSrcMatch).toBeTruthy()

      const scriptSrcDirective = scriptSrcMatch![0]

      const hasAnalyticsDomain = scriptSrcDirective.includes(
        'analytics.idaromme.dk'
      )

      if (!hasAnalyticsDomain) {
        throw new Error(
          `CRITICAL PRODUCTION ERROR: CSP script-src does NOT include analytics.idaromme.dk!\n\n` +
            `This means analytics will be BLOCKED by CSP in production.\n\n` +
            `Current script-src: ${scriptSrcDirective}\n\n` +
            `ROOT CAUSE: Likely duplicate middleware files on server.\n` +
            `Check for both middleware.ts (root) and src/middleware.ts on production server.\n` +
            `Next.js prioritizes root-level middleware.ts.\n\n` +
            `FIX ON SERVER:\n` +
            `1. SSH to production: ssh user@idaromme.dk\n` +
            `2. cd /var/www/idaromme.dk\n` +
            `3. ls -la middleware.ts src/middleware.ts\n` +
            `4. If both exist: rm middleware.ts\n` +
            `5. rm -rf .next && NODE_ENV=production npm run build\n` +
            `6. pm2 restart idaromme-website`
        )
      }

      expect(hasAnalyticsDomain).toBe(true)
      console.log('✅ Production CSP allows analytics in script-src')
    })

    test('should include analytics.idaromme.dk in production CSP connect-src', async ({
      request,
    }) => {
      const response = await request.get(PRODUCTION_URL)
      const cspHeader = response.headers()['content-security-policy']

      if (!cspHeader) {
        throw new Error('No CSP header found')
      }

      // Extract connect-src directive
      const connectSrcMatch = cspHeader.match(/connect-src[^;]+/)
      expect(connectSrcMatch).toBeTruthy()

      const connectSrcDirective = connectSrcMatch![0]

      const hasAnalyticsDomain = connectSrcDirective.includes(
        'analytics.idaromme.dk'
      )

      if (!hasAnalyticsDomain) {
        throw new Error(
          `CRITICAL: CSP connect-src does NOT include analytics.idaromme.dk!\n` +
            `Analytics data submission will be blocked.\n` +
            `Current connect-src: ${connectSrcDirective}`
        )
      }

      expect(hasAnalyticsDomain).toBe(true)
      console.log('✅ Production CSP allows analytics in connect-src')
    })

    test('should NOT have old umami.is domain in production CSP', async ({
      request,
    }) => {
      const response = await request.get(PRODUCTION_URL)
      const cspHeader = response.headers()['content-security-policy']

      if (!cspHeader) {
        throw new Error('No CSP header found')
      }

      const hasOldDomain = cspHeader.includes(OLD_UMAMI_DOMAIN)

      if (hasOldDomain) {
        throw new Error(
          `CRITICAL REGRESSION: Production CSP contains OLD domain: ${OLD_UMAMI_DOMAIN}!\n\n` +
            `This indicates the duplicate middleware file bug has RETURNED.\n\n` +
            `Check production server for middleware.ts in project root.\n` +
            `Current CSP: ${cspHeader.substring(0, 200)}...`
        )
      }

      expect(hasOldDomain).toBe(false)
      console.log('✅ Production CSP does not contain old umami.is')
    })

    test('should NOT have old IP address in production CSP', async ({
      request,
    }) => {
      const response = await request.get(PRODUCTION_URL)
      const cspHeader = response.headers()['content-security-policy']

      if (!cspHeader) {
        throw new Error('No CSP header found')
      }

      const hasOldIP = cspHeader.includes(OLD_IP_DOMAIN)

      if (hasOldIP) {
        throw new Error(
          `CRITICAL REGRESSION: Production CSP contains OLD IP: ${OLD_IP_DOMAIN}!\n\n` +
            `This indicates the duplicate middleware file bug has RETURNED.\n` +
            `Current CSP: ${cspHeader.substring(0, 200)}...`
        )
      }

      expect(hasOldIP).toBe(false)
      console.log('✅ Production CSP does not contain old IP address')
    })
  })

  test.describe('Production Analytics Script Loading', () => {
    test('should load analytics script without CSP violations', async ({
      page,
    }) => {
      const cspViolations: string[] = []

      // Monitor console for CSP violations
      page.on('console', (msg) => {
        const text = msg.text()
        if (
          text.includes('Content Security Policy') ||
          text.includes('blocked') ||
          text.includes('CSP')
        ) {
          if (text.includes('analytics.idaromme.dk')) {
            cspViolations.push(text)
          }
        }
      })

      await page.goto(PRODUCTION_URL)
      await page.waitForLoadState('networkidle')

      // Wait for analytics to potentially load
      await page.waitForTimeout(3000)

      if (cspViolations.length > 0) {
        throw new Error(
          `CRITICAL: CSP is blocking analytics on production!\n\n` +
            `Violations:\n${cspViolations.join('\n')}\n\n` +
            `This means users' analytics are NOT being tracked.`
        )
      }

      expect(cspViolations.length).toBe(0)
      console.log('✅ No CSP violations for analytics on production')
    })

    test('should successfully load script.js from analytics domain', async ({
      page,
    }) => {
      const analyticsRequests: Array<{
        url: string
        status: number
        statusText: string
      }> = []

      // Monitor network requests
      page.on('response', (response) => {
        const url = response.url()
        if (url.includes('analytics.idaromme.dk')) {
          analyticsRequests.push({
            url,
            status: response.status(),
            statusText: response.statusText(),
          })
        }
      })

      await page.goto(PRODUCTION_URL)
      await page.waitForLoadState('networkidle')

      // Wait for analytics to load (deferred script)
      await page.waitForTimeout(3000)

      // Check for script.js request
      const scriptRequest = analyticsRequests.find((req) =>
        req.url.includes('/script.js')
      )

      if (!scriptRequest) {
        throw new Error(
          `CRITICAL: No request to analytics.idaromme.dk/script.js detected!\n\n` +
            `This means analytics script is NOT loading on production.\n\n` +
            `Possible causes:\n` +
            `1. CSP blocking the script (check CSP header test results)\n` +
            `2. NODE_ENV not set to 'production' during build\n` +
            `3. AnalyticsProvider not rendering\n\n` +
            `All analytics requests seen: ${JSON.stringify(analyticsRequests, null, 2)}`
        )
      }

      // Verify successful load
      if (scriptRequest.status !== 200) {
        throw new Error(
          `CRITICAL: Analytics script request FAILED!\n` +
            `Status: ${scriptRequest.status} ${scriptRequest.statusText}\n` +
            `URL: ${scriptRequest.url}\n\n` +
            `Check if Umami service is running on analytics.idaromme.dk`
        )
      }

      expect(scriptRequest.status).toBe(200)
      console.log(
        `✅ Analytics script loaded successfully: ${scriptRequest.status} ${scriptRequest.statusText}`
      )
    })

    test('should have analytics script tag in production DOM', async ({
      page,
    }) => {
      await page.goto(PRODUCTION_URL)
      await page.waitForLoadState('networkidle')

      // Wait for script injection (requestIdleCallback delay)
      await page.waitForTimeout(3000)

      const scriptElement = page.locator(
        `script[src="${ANALYTICS_DOMAIN}/script.js"]`
      )
      const scriptCount = await scriptElement.count()

      if (scriptCount === 0) {
        // Get page content to help debug
        const headContent = await page.locator('head').innerHTML()

        throw new Error(
          `CRITICAL: Analytics script tag NOT found in production DOM!\n\n` +
            `Expected: <script src="${ANALYTICS_DOMAIN}/script.js" ...>\n` +
            `Found: 0 instances\n\n` +
            `Possible causes:\n` +
            `1. NODE_ENV !== 'production' during build\n` +
            `2. NEXT_PUBLIC_UMAMI_URL not set\n` +
            `3. AnalyticsProvider not wrapping app\n\n` +
            `Head scripts found:\n${headContent.substring(0, 500)}...`
        )
      }

      expect(scriptCount).toBeGreaterThan(0)
      await expect(scriptElement).toBeAttached()

      // Verify attributes
      const websiteId = await scriptElement.getAttribute('data-website-id')
      expect(websiteId).toBeTruthy()

      const isDeferred = await scriptElement.evaluate((el) =>
        el.hasAttribute('defer')
      )
      expect(isDeferred).toBe(true)

      console.log(`✅ Analytics script tag present in production DOM`)
    })
  })

  test.describe('Production Analytics Functionality', () => {
    test('should track page views on production', async ({ page }) => {
      // Note: This test verifies analytics loads but doesn't verify dashboard
      // Actual tracking verification requires access to Umami dashboard

      await page.goto(PRODUCTION_URL)
      await page.waitForLoadState('networkidle')

      // Wait for analytics to potentially send tracking data
      await page.waitForTimeout(5000)

      // Check that analytics script loaded
      const scriptExists = await page.locator(
        `script[src="${ANALYTICS_DOMAIN}/script.js"]`
      ).count()

      expect(scriptExists).toBeGreaterThan(0)
      console.log(
        '✅ Analytics script loaded (tracking may occur, check Umami dashboard)'
      )
    })

    test('should handle navigation across production pages', async ({
      page,
    }) => {
      await page.goto(PRODUCTION_URL)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      const initialScriptCount = await page.locator(
        `script[src="${ANALYTICS_DOMAIN}/script.js"]`
      ).count()

      // Navigate to another page
      await page.goto(`${PRODUCTION_URL}/contact`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      const afterNavScriptCount = await page.locator(
        `script[src="${ANALYTICS_DOMAIN}/script.js"]`
      ).count()

      // Analytics should be present on both pages
      expect(initialScriptCount).toBeGreaterThan(0)
      expect(afterNavScriptCount).toBeGreaterThan(0)

      console.log('✅ Analytics persists across navigation on production')
    })
  })

  test.describe('Production Security Headers', () => {
    test('should have all critical security headers', async ({ request }) => {
      const response = await request.get(PRODUCTION_URL)
      const headers = response.headers()

      const criticalHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
      ]

      const missingHeaders = criticalHeaders.filter(
        (header) => !headers[header] && !headers[header.toUpperCase()]
      )

      if (missingHeaders.length > 0) {
        throw new Error(
          `SECURITY WARNING: Missing critical headers on production:\n` +
            `${missingHeaders.join(', ')}`
        )
      }

      expect(missingHeaders.length).toBe(0)
      console.log('✅ All critical security headers present on production')
    })

    test('should have HSTS header on HTTPS', async ({ request }) => {
      const response = await request.get(PRODUCTION_URL)
      const headers = response.headers()

      const hstsHeader =
        headers['strict-transport-security'] ||
        headers['Strict-Transport-Security']

      expect(hstsHeader).toBeDefined()
      expect(hstsHeader).toContain('max-age')

      console.log(`✅ HSTS header present: ${hstsHeader}`)
    })
  })
})
