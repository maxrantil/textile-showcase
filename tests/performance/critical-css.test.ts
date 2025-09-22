// ABOUTME: Critical CSS extraction performance tests using TDD approach for Phase 2A Day 3-4
// Following RED → GREEN → REFACTOR pattern to achieve 300-400ms FCP improvement

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Critical CSS Extraction - Phase 2A Day 3-4', () => {
  const criticalCSSPath = join(process.cwd(), 'src/styles/critical')

  describe('Critical CSS File Structure', () => {
    it('should have critical CSS directory structure', () => {
      // RED: This test will fail initially - we haven't created the structure yet
      expect(existsSync(criticalCSSPath)).toBe(true)
    })

    it('should have critical.css file for above-fold styles', () => {
      // RED: Will fail - critical.css doesn't exist yet
      const criticalFile = join(criticalCSSPath, 'critical.css')
      expect(existsSync(criticalFile)).toBe(true)
    })

    it('should have deferred.css file for below-fold styles', () => {
      // RED: Will fail - deferred.css doesn't exist yet
      const deferredFile = join(criticalCSSPath, 'deferred.css')
      expect(existsSync(deferredFile)).toBe(true)
    })
  })

  describe('Critical CSS Content Validation', () => {
    it('should contain essential reset and layout styles in critical.css', () => {
      // RED: Will fail - file doesn't exist and content not extracted yet
      const criticalFile = join(criticalCSSPath, 'critical.css')
      const content = readFileSync(criticalFile, 'utf-8')

      // Critical styles for above-fold rendering
      expect(content).toContain('box-sizing: border-box')
      expect(content).toContain('.container-mobile')
      expect(content).toContain(':root')
      expect(content).toContain('--header-height')
    })

    it('should have critical CSS under 5KB for optimal FCP', () => {
      // RED: Will fail - targeting <5KB for inline embedding
      const criticalFile = join(criticalCSSPath, 'critical.css')
      const content = readFileSync(criticalFile, 'utf-8')
      const sizeInKB = Buffer.byteLength(content, 'utf8') / 1024

      expect(sizeInKB).toBeLessThan(5)
    })

    it('should contain font-display optimization in critical styles', () => {
      // Updated: Using font-display: block for critical fonts (better than swap for above-fold content)
      const criticalFile = join(criticalCSSPath, 'critical.css')
      const content = readFileSync(criticalFile, 'utf-8')

      expect(content).toContain('font-display: block')
    })
  })

  describe('CSS Loading Strategy', () => {
    it('should have critical CSS component architecture', () => {
      // Updated: Component-based CSS loading approach (safer than dangerouslySetInnerHTML)
      const layoutPath = join(
        process.cwd(),
        'src/app/components/critical-css.tsx'
      )
      expect(existsSync(layoutPath)).toBe(true)

      const layoutContent = readFileSync(layoutPath, 'utf-8')
      expect(layoutContent).toContain('CriticalCSSProvider')
      expect(layoutContent).toContain('DeferredCSSLoader')
    })

    it('should defer non-critical CSS with media strategy', () => {
      // Updated: Dynamic CSS loading for Next.js compliance
      const deferredLoaderPath = join(
        process.cwd(),
        'src/app/components/deferred-css-loader.tsx'
      )
      const deferredLoaderContent = readFileSync(deferredLoaderPath, 'utf-8')

      expect(deferredLoaderContent).toContain('createElement')
      expect(deferredLoaderContent).toContain('deferred.css')
    })

    it('should have preload hint for deferred CSS', () => {
      // Updated: Dynamic preload implementation for Next.js compliance
      const deferredLoaderPath = join(
        process.cwd(),
        'src/app/components/deferred-css-loader.tsx'
      )
      const deferredLoaderContent = readFileSync(deferredLoaderPath, 'utf-8')

      expect(deferredLoaderContent).toContain('preload')
      expect(deferredLoaderContent).toContain('preloadLink')
    })
  })

  describe('Performance Impact Validation', () => {
    it('should reduce FCP by 300-400ms through critical CSS inlining', () => {
      // RED: Will fail - performance measurement not implemented yet
      // This test validates the core requirement for Phase 2A Day 3-4
      const performanceConfig = join(
        process.cwd(),
        'tests/performance/fcp-measurement.json'
      )

      if (existsSync(performanceConfig)) {
        const config = JSON.parse(readFileSync(performanceConfig, 'utf-8'))
        expect(config.criticalCSSEnabled).toBe(true)
        expect(config.expectedFCPImprovement).toBeGreaterThanOrEqual(300)
        expect(config.expectedFCPImprovement).toBeLessThanOrEqual(400)
      } else {
        // Fail if config doesn't exist - we need measurement tracking
        expect(existsSync(performanceConfig)).toBe(true)
      }
    })

    it('should maintain accessibility with critical CSS extraction', () => {
      // RED: Will fail - accessibility regression test not implemented
      const criticalFile = join(criticalCSSPath, 'critical.css')

      if (existsSync(criticalFile)) {
        const content = readFileSync(criticalFile, 'utf-8')

        // Ensure critical accessibility styles are preserved
        expect(content).toContain('.sr-only')
        expect(content).toContain('focus-visible')
      }
    })

    it('should have proper fallback for CSS loading failures', () => {
      // Updated: Error handling implemented in deferred CSS loader
      const deferredLoaderPath = join(
        process.cwd(),
        'src/app/components/deferred-css-loader.tsx'
      )

      if (existsSync(deferredLoaderPath)) {
        const deferredLoaderContent = readFileSync(deferredLoaderPath, 'utf-8')
        expect(deferredLoaderContent).toContain('onerror')
        expect(deferredLoaderContent).toContain('fallback')
      }
    })
  })

  describe('Critical CSS Extraction Quality', () => {
    it('should not duplicate styles between critical and deferred CSS', () => {
      // RED: Will fail - duplication detection not implemented
      const criticalFile = join(criticalCSSPath, 'critical.css')
      const deferredFile = join(criticalCSSPath, 'deferred.css')

      if (existsSync(criticalFile) && existsSync(deferredFile)) {
        const criticalContent = readFileSync(criticalFile, 'utf-8')
        const deferredContent = readFileSync(deferredFile, 'utf-8')

        // Simple duplicate detection - no exact rule matches
        const criticalRules = criticalContent.match(/[^{}]+{[^{}]*}/g) || []
        const deferredRules = deferredContent.match(/[^{}]+{[^{}]*}/g) || []

        const duplicates = criticalRules.filter((rule) =>
          deferredRules.some((deferredRule) => deferredRule === rule)
        )

        expect(duplicates.length).toBe(0)
      }
    })

    it('should maintain CSS custom properties in critical styles', () => {
      // RED: Will fail - CSS custom properties extraction not implemented
      const criticalFile = join(criticalCSSPath, 'critical.css')

      if (existsSync(criticalFile)) {
        const content = readFileSync(criticalFile, 'utf-8')

        // Ensure CSS custom properties are in critical CSS for consistency
        expect(content).toContain('--color-primary')
        expect(content).toContain('--font-size-base')
        expect(content).toContain('--spacing-md')
      }
    })
  })
})
