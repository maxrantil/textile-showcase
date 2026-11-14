// ABOUTME: E2E regression tests for Issue #263 - a slow, failing or unreachable Umami must never affect the page
// Needs a production build with analytics configured; see the analytics-resilience job in e2e-tests.yml

import { test, expect, Page, Route } from '@playwright/test'
import { ANALYTICS_URL } from './helpers/analytics-mock'
import { setupTestPage } from './helpers/test-setup'
import { HomePage } from './pages/HomePage'

const SCRIPT_URL = `${ANALYTICS_URL}/script.js`

// The script is only added in a production build with NEXT_PUBLIC_UMAMI_URL and
// NEXT_PUBLIC_UMAMI_WEBSITE_ID set, which the default dev server is not.
// To run locally:
//   NEXT_PUBLIC_UMAMI_URL=https://analytics.idaromme.dk \
//   NEXT_PUBLIC_UMAMI_WEBSITE_ID=00000000-0000-0000-0000-000000000000 npm run build
//   PORT=3000 npm start
//   ANALYTICS_BUILD=true E2E_BASE_URL=http://localhost:3000 \
//     npx playwright test tests/e2e/analytics-resilience.spec.ts --project="Desktop Chrome"
const analyticsBuild = process.env.ANALYTICS_BUILD === 'true'

declare global {
  interface Window {
    __sameDocument?: boolean
  }
}

interface FailureMode {
  name: string
  // `released` resolves when the test ends, so a request can be held open for
  // the whole test and still be settled afterwards
  fulfil: (route: Route, released: Promise<void>) => Promise<void>
}

const failureModes: FailureMode[] = [
  {
    name: 'the connection is refused',
    fulfil: (route) => route.abort('connectionrefused'),
  },
  {
    // What production served during Issue #263
    name: 'the server answers 504 with an HTML error page',
    fulfil: (route) =>
      route.fulfill({
        status: 504,
        contentType: 'text/html',
        body: '<html><body><h1>504 Gateway Time-out</h1></body></html>',
      }),
  },
  {
    name: 'the request never completes',
    fulfil: async (route, released) => {
      await released
      await route.abort().catch(() => {})
    },
  },
  {
    name: 'the tracker loads but throws on every call',
    fulfil: (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=UTF-8',
        body: `window.umami = {
          track: function () { throw new Error('umami is broken') },
          identify: function () { throw new Error('umami is broken') },
        };`,
      }),
  },
]

/**
 * Collects uncaught exceptions and unhandled rejections raised in the page
 */
function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

/**
 * Marks the current document so a later check can tell a client-side
 * navigation (marker survives) from a full page load (marker is gone).
 * Gallery items are plain links, so they also navigate without JavaScript;
 * only a hydrated page keeps the document.
 */
async function markDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__sameDocument = true
  })
}

async function isSameDocument(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__sameDocument === true)
}

test.describe('Umami failure isolation - Issue #263', () => {
  test.skip(
    !analyticsBuild,
    'Needs a production build with analytics configured - set ANALYTICS_BUILD=true'
  )

  for (const mode of failureModes) {
    test.describe(`when ${mode.name}`, () => {
      let release: () => void

      test.beforeEach(async ({ page }) => {
        const released = new Promise<void>((resolve) => {
          release = resolve
        })
        await page.route(SCRIPT_URL, (route) => mode.fulfil(route, released))
        // Nothing from these tests may reach the real Umami
        await page.route(`${ANALYTICS_URL}/api/**`, (route) =>
          route.abort('connectionrefused')
        )
      })

      test.afterEach(() => {
        release()
      })

      test('home gallery hydrates and opens a project on click', async ({
        page,
      }) => {
        const pageErrors = collectPageErrors(page)
        const scriptRequested = page.waitForRequest(SCRIPT_URL)

        await page.goto('/')
        // From here on the Umami script is failing in the way under test
        await scriptRequested

        const home = new HomePage(page)
        await home.waitForGallery()
        await markDocument(page)

        await home.firstProject.click()
        await page.waitForURL('**/project/**')

        expect(await isSameDocument(page)).toBe(true)
        expect(pageErrors).toEqual([])
      })

      test('project page hydrates and its navigation responds to clicks', async ({
        page,
      }) => {
        const pageErrors = collectPageErrors(page)

        await page.goto('/')
        const home = new HomePage(page)
        await home.waitForGallery()
        const projectPath = await home.firstProject.getAttribute('href')
        expect(projectPath).toMatch(/^\/project\//)

        const scriptRequested = page.waitForRequest(SCRIPT_URL)
        await page.goto(projectPath!)
        await scriptRequested
        await markDocument(page)

        // The navigation buttons have no href: they only work once hydrated
        const nextButton = page
          .locator('.desktop-nav-next:visible, .mobile-nav-next:visible')
          .first()
        await nextButton.click()
        await page.waitForURL(
          (url) =>
            url.pathname.startsWith('/project/') &&
            url.pathname !== projectPath
        )

        expect(await isSameDocument(page)).toBe(true)
        expect(pageErrors).toEqual([])
      })
    })
  }
})

test.describe('Umami script loading when analytics is enabled', () => {
  test.skip(
    !analyticsBuild,
    'Needs a production build with analytics configured - set ANALYTICS_BUILD=true'
  )

  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
  })

  test('adds the Umami script tag with the website ID and the CSP nonce', async ({
    page,
  }) => {
    const cspViolations: string[] = []
    page.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) {
        cspViolations.push(message.text())
      }
    })

    const response = await page.goto('/')
    const csp = response!.headers()['content-security-policy']
    const pageNonce = csp.match(/'nonce-([^']+)'/)?.[1]
    expect(pageNonce).toBeTruthy()

    const script = page.locator(`script[src="${SCRIPT_URL}"]`)
    await expect(script).toBeAttached()
    await expect(script).toHaveCount(1)

    const websiteId = await script.getAttribute('data-website-id')
    if (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
      expect(websiteId).toBe(process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID)
    } else {
      expect(websiteId).toBeTruthy()
    }

    // Browsers hide the nonce attribute; the property still carries it
    expect(await script.evaluate((el: HTMLScriptElement) => el.nonce)).toBe(
      pageNonce
    )

    // The mocked tracker ran, so the CSP let the script through
    await expect
      .poll(() => page.evaluate(() => typeof window.umami?.track))
      .toBe('function')
    expect(
      cspViolations.filter((violation) => violation.includes(ANALYTICS_URL))
    ).toEqual([])
  })
})
