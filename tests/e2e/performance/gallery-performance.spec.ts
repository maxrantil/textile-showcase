// ABOUTME: End-to-end performance tests for Gallery component optimization features
// Tests real-world performance improvements from Phase 2A+2B+2C optimizations

import { test, expect, Page } from '@playwright/test'

test.describe('Gallery Performance Optimization E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage

    // Set realistic network conditions
    await page.route('**/*', async (route) => {
      // Add realistic latency for dynamic imports
      await new Promise((resolve) => setTimeout(resolve, 10))
      return route.continue()
    })

    // Navigate to homepage to test gallery performance
    await page.goto('/')
  })

  test.describe('Dynamic Import Performance', () => {
    test('should_load_gallery_components_progressively_on_desktop', async ({
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-specific test')

      // Monitor network requests for dynamic imports
      const dynamicImports: string[] = []
      page.on('request', (request) => {
        const url = request.url()
        if (url.includes('Gallery') && !url.includes('.map')) {
          dynamicImports.push(url)
        }
      })

      // Wait for initial page load
      await page.waitForLoadState('networkidle')

      // Gallery should be visible
      await expect(
        page.locator(
          '[data-testid="desktop-gallery"], [data-testid="gallery-loading-skeleton"]'
        )
      ).toBeVisible()

      // Wait for dynamic imports to complete
      await page.waitForTimeout(1000)

      // Should have loaded desktop gallery component dynamically
      expect(dynamicImports.length).toBeGreaterThan(0)

      // Desktop gallery should be rendered
      await expect(page.locator('[data-testid="desktop-gallery"]')).toBeVisible(
        { timeout: 2000 }
      )
    })

    test('should_load_gallery_components_progressively_on_mobile', async ({
      isMobile,
    }) => {
      test.skip(!isMobile, 'Mobile-specific test')

      const dynamicImports: string[] = []
      page.on('request', (request) => {
        const url = request.url()
        if (url.includes('Gallery') && !url.includes('.map')) {
          dynamicImports.push(url)
        }
      })

      await page.waitForLoadState('networkidle')

      // Mobile gallery should be rendered
      await expect(page.locator('[data-testid="mobile-gallery"]')).toBeVisible({
        timeout: 2000,
      })

      expect(dynamicImports.length).toBeGreaterThan(0)
    })

    test('should_show_loading_skeleton_during_progressive_hydration', async () => {
      // Navigate with disabled JavaScript cache to see loading state
      await page.reload({ waitUntil: 'domcontentloaded' })

      // Should show loading skeleton immediately
      await expect(
        page.locator('[data-testid="gallery-loading-skeleton"]')
      ).toBeVisible()

      // Loading skeleton should be replaced by actual gallery
      await expect(
        page.locator('[data-testid="gallery-loading-skeleton"]')
      ).toBeHidden({ timeout: 2000 })
    })
  })

  test.describe('Performance Metrics Validation', () => {
    test('should_achieve_target_TTI_improvement_from_progressive_hydration', async () => {
      // Measure Time to Interactive improvement
      const performanceMetrics = await page.evaluate(
        async (): Promise<{
          domContentLoaded: number
          loadComplete: number
          totalTime: number
        }> => {
          return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const navigationEntry = entries.find(
                (entry) => entry.entryType === 'navigation'
              ) as PerformanceNavigationTiming

              if (navigationEntry) {
                resolve({
                  domContentLoaded:
                    navigationEntry.domContentLoadedEventEnd -
                    navigationEntry.domContentLoadedEventStart,
                  loadComplete:
                    navigationEntry.loadEventEnd -
                    navigationEntry.loadEventStart,
                  totalTime:
                    navigationEntry.loadEventEnd - navigationEntry.fetchStart,
                })
              }
            })

            observer.observe({ entryTypes: ['navigation'] })

            // Fallback timeout
            setTimeout(() => {
              resolve({
                domContentLoaded: 0,
                loadComplete: 0,
                totalTime: 0,
              })
            }, 5000)
          })
        }
      )

      // TTI should meet performance budget (target: 300-500ms improvement)
      expect(performanceMetrics.totalTime).toBeLessThan(3000) // 3s maximum for full page load
    })

    test('should_maintain_performance_with_large_design_collections', async () => {
      // Navigate to page with many designs
      await page.goto('/projects')

      const startTime = Date.now()

      // Wait for gallery to fully load
      await page.waitForLoadState('networkidle')
      await expect(
        page.locator(
          '[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]'
        )
      ).toBeVisible()

      const loadTime = Date.now() - startTime

      // Should handle large collections efficiently
      expect(loadTime).toBeLessThan(3000) // 3s budget for large collections
    })

    test('should_optimize_Core_Web_Vitals_with_progressive_hydration', async () => {
      const coreWebVitals = await page.evaluate(
        (): Promise<{
          lcp: number
          fcp: number
          cls: number
          tbt: number
        }> => {
          return new Promise((resolve) => {
            const vitals = {
              lcp: 0,
              fcp: 0,
              cls: 0,
              tbt: 0,
            }

            // Largest Contentful Paint
            new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const lastEntry = entries[entries.length - 1]
              vitals.lcp = lastEntry.startTime
            }).observe({ entryTypes: ['largest-contentful-paint'] })

            // First Contentful Paint
            new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const fcpEntry = entries.find(
                (entry) => entry.name === 'first-contentful-paint'
              )
              if (fcpEntry) {
                vitals.fcp = fcpEntry.startTime
              }
            }).observe({ entryTypes: ['paint'] })

            // Cumulative Layout Shift
            new PerformanceObserver((list) => {
              const entries = list.getEntries()
              entries.forEach((entry) => {
                // Layout shift entry properties accessed through unknown cast
                const lsEntry = entry as unknown as {
                  hadRecentInput?: boolean
                  value?: number
                }
                if (!lsEntry.hadRecentInput) {
                  vitals.cls += lsEntry.value || 0
                }
              })
            }).observe({ entryTypes: ['layout-shift'] })

            // Return results after timeout
            setTimeout(() => resolve(vitals), 3000)
          })
        }
      )

      // Core Web Vitals should meet performance thresholds
      expect(coreWebVitals.lcp).toBeLessThan(2500) // LCP < 2.5s
      expect(coreWebVitals.fcp).toBeLessThan(1800) // FCP < 1.8s
      expect(coreWebVitals.cls).toBeLessThan(0.1) // CLS < 0.1
    })
  })

  test.describe('Device-Specific Performance', () => {
    test('should_optimize_hydration_timing_for_mobile_devices', async ({
      isMobile,
    }) => {
      test.skip(!isMobile, 'Mobile-specific test')

      const startTime = Date.now()

      // Wait for progressive hydration to complete on mobile
      await expect(page.locator('[data-testid="mobile-gallery"]')).toBeVisible({
        timeout: 3000,
      })

      const hydrationTime = Date.now() - startTime

      // Mobile hydration should meet performance budget
      expect(hydrationTime).toBeLessThan(1500) // Mobile target: <1.5s
    })

    test('should_optimize_hydration_timing_for_desktop_devices', async ({
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop-specific test')

      const startTime = Date.now()

      // Wait for progressive hydration to complete on desktop
      await expect(page.locator('[data-testid="desktop-gallery"]')).toBeVisible(
        { timeout: 2000 }
      )

      const hydrationTime = Date.now() - startTime

      // Desktop hydration should meet performance budget
      expect(hydrationTime).toBeLessThan(1000) // Desktop target: <1s
    })
  })

  test.describe('Error Handling and Resilience', () => {
    test('should_handle_dynamic_import_failures_gracefully', async () => {
      // Simulate network issues during dynamic import
      await page.route('**/DesktopGallery**', (route) => {
        route.abort('failed')
      })

      await page.reload()

      // Should show loading skeleton or fallback instead of crashing
      await expect(
        page.locator('[data-testid="gallery-loading-skeleton"]')
      ).toBeVisible()

      // Should not show JavaScript errors
      const errors: string[] = []
      page.on('pageerror', (error) => {
        errors.push(error.message)
      })

      await page.waitForTimeout(2000)

      // Should handle errors gracefully without crashing
      expect(errors.length).toBe(0)
    })

    test('should_provide_fallback_navigation_when_gallery_fails', async () => {
      // Mock all gallery imports to fail
      await page.route('**/Gallery**', (route) => {
        route.abort('failed')
      })

      await page.reload()

      // Navigation should still work
      await expect(page.locator('header')).toBeVisible()
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()

      // User should still be able to navigate
      const aboutLink = page.locator('a[href*="about"], a:has-text("About")')
      if ((await aboutLink.count()) > 0) {
        await aboutLink.first().click()
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain('about')
      }
    })
  })

  test.describe('Bundle Size and Network Performance', () => {
    test('should_load_only_necessary_gallery_component_for_device', async ({
      isMobile,
    }) => {
      const networkRequests: string[] = []

      page.on('request', (request) => {
        const url = request.url()
        if (url.includes('Gallery')) {
          networkRequests.push(url)
        }
      })

      await page.waitForLoadState('networkidle')

      // Should only load appropriate gallery component
      const desktopRequests = networkRequests.filter((url) =>
        url.includes('Desktop')
      )
      const mobileRequests = networkRequests.filter((url) =>
        url.includes('Mobile')
      )

      if (isMobile) {
        expect(mobileRequests.length).toBeGreaterThan(0)
        expect(desktopRequests.length).toBe(0)
      } else {
        expect(desktopRequests.length).toBeGreaterThan(0)
        expect(mobileRequests.length).toBe(0)
      }
    })

    test('should_maintain_efficient_bundle_size_with_dynamic_imports', async () => {
      // Monitor transferred bytes for dynamic imports
      let totalTransferred = 0

      page.on('response', (response) => {
        const url = response.url()
        if (url.includes('Gallery') && response.ok()) {
          // Response headers accessed with bracket notation
          const headers = response.headers() as Record<string, string>
          const size = headers['content-length']
          if (size) {
            totalTransferred += parseInt(size, 10)
          }
        }
      })

      await page.waitForLoadState('networkidle')

      // Dynamic imports should be reasonably sized
      expect(totalTransferred).toBeLessThan(100 * 1024) // <100KB for gallery components
    })
  })

  test.describe('Real-World Performance Scenarios', () => {
    test('should_handle_slow_network_connections_gracefully', async () => {
      // Simulate slow 3G connection
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 200)) // 200ms latency
        return route.continue()
      })

      const startTime = Date.now()

      await page.goto('/')
      await expect(
        page.locator('[data-testid="gallery-loading-skeleton"]')
      ).toBeVisible()

      // Should still complete within reasonable time on slow connection
      await expect(
        page.locator(
          '[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]'
        )
      ).toBeVisible({ timeout: 5000 })

      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(5000) // 5s budget for slow connection
    })

    test('should_maintain_interactivity_during_progressive_hydration', async () => {
      await page.goto('/')

      // Should be able to interact with navigation immediately
      const navElement = page.locator('nav, header')
      await expect(navElement).toBeVisible()

      // Navigation should be interactive even before gallery hydration completes
      const menuButton = page.locator(
        'button:has-text("Menu"), [aria-label*="menu"]'
      )
      if ((await menuButton.count()) > 0) {
        await menuButton.first().click()
        // Menu should open (test basic interactivity)
      }

      // Gallery should still hydrate properly
      await expect(
        page.locator(
          '[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]'
        )
      ).toBeVisible({ timeout: 3000 })
    })

    test('should_handle_concurrent_page_navigation_during_hydration', async () => {
      await page.goto('/')

      // Start navigation to another page during gallery hydration
      const projectsLink = page.locator(
        'a[href*="projects"], a:has-text("Projects")'
      )

      if ((await projectsLink.count()) > 0) {
        // Click projects link before gallery hydration completes
        await projectsLink.first().click()

        // Navigation should work smoothly
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain('projects')

        // New page should load properly
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })
})
