/**
 * ABOUTME: Build artifact validation tests for compiled proxy
 * Ensures production proxy build contains correct CSP configuration
 * and prevents duplicate proxy files from causing issues
 */

import * as fs from 'fs'
import * as path from 'path'

describe('Middleware Build Artifact Validation', () => {
  const ANALYTICS_DOMAIN = 'https://analytics.idaromme.dk'
  const OLD_UMAMI_DOMAIN = 'https://umami.is'
  const OLD_IP_DOMAIN = 'http://70.34.205.18'

  describe('Compiled Middleware Validation', () => {
    let compiledMiddlewarePath: string
    let compiledMiddlewareExists: boolean
    let compiledMiddlewareContent: string

    beforeAll(() => {
      // Path to compiled proxy in .next directory
      compiledMiddlewarePath = path.join(
        process.cwd(),
        '.next',
        'server',
        'proxy.js'
      )

      // Check if build artifacts exist
      compiledMiddlewareExists = fs.existsSync(compiledMiddlewarePath)

      if (compiledMiddlewareExists) {
        compiledMiddlewareContent = fs.readFileSync(
          compiledMiddlewarePath,
          'utf-8'
        )
      }
    })

    it('should have compiled proxy in .next/server/proxy.js', () => {
      if (!compiledMiddlewareExists) {
        console.warn(
          '⚠️  No compiled proxy found. Run `npm run build` first.'
        )
        // Skip this test if no build exists (e.g., in CI without build step)
        return
      }

      expect(compiledMiddlewareExists).toBe(true)
      expect(compiledMiddlewareContent).toBeDefined()
      expect(compiledMiddlewareContent.length).toBeGreaterThan(0)
    })

    it('should include analytics.idaromme.dk in compiled proxy', () => {
      if (!compiledMiddlewareExists) {
        console.warn('⚠️  Skipping: No build artifacts found')
        return
      }

      const hasAnalyticsDomain = compiledMiddlewareContent.includes(
        'analytics.idaromme.dk'
      )

      if (!hasAnalyticsDomain) {
        throw new Error(
          `CRITICAL BUILD ERROR: Compiled proxy does NOT contain analytics.idaromme.dk!\n` +
            `This means the wrong proxy file was used during build.\n` +
            `Check for duplicate proxy files (proxy.ts vs src/proxy.ts).\n` +
            `Build artifact: ${compiledMiddlewarePath}`
        )
      }

      expect(hasAnalyticsDomain).toBe(true)
    })

    it('should NOT include old umami.is domain in compiled proxy', () => {
      if (!compiledMiddlewareExists) {
        console.warn('⚠️  Skipping: No build artifacts found')
        return
      }

      const hasOldUmamiDomain =
        compiledMiddlewareContent.includes('umami.is')

      if (hasOldUmamiDomain) {
        throw new Error(
          `CRITICAL BUILD ERROR: Compiled proxy contains OLD umami.is domain!\n` +
            `This indicates a duplicate proxy file is overriding proxy.ts.\n` +
            `Build artifact: ${compiledMiddlewarePath}`
        )
      }

      expect(hasOldUmamiDomain).toBe(false)
    })

    it('should NOT include old IP address in compiled proxy', () => {
      if (!compiledMiddlewareExists) {
        console.warn('⚠️  Skipping: No build artifacts found')
        return
      }

      const hasOldIP = compiledMiddlewareContent.includes('70.34.205.18')

      if (hasOldIP) {
        throw new Error(
          `CRITICAL BUILD ERROR: Compiled proxy contains OLD IP address 70.34.205.18!\n` +
            `This indicates a duplicate proxy file is overriding the correct configuration.\n` +
            `FIX: Check for duplicate proxy.ts files\n` +
            `Build artifact: ${compiledMiddlewarePath}`
        )
      }

      expect(hasOldIP).toBe(false)
    })

    it('should have analytics domain in CSP context', () => {
      if (!compiledMiddlewareExists) {
        console.warn('⚠️  Skipping: No build artifacts found')
        return
      }

      // Look for CSP-related code patterns
      const hasCspContext =
        compiledMiddlewareContent.includes('Content-Security-Policy') ||
        compiledMiddlewareContent.includes('script-src') ||
        compiledMiddlewareContent.includes('connect-src')

      expect(hasCspContext).toBe(true)

      // If CSP exists, analytics domain should be present
      if (hasCspContext) {
        const hasAnalyticsDomain = compiledMiddlewareContent.includes(
          'analytics.idaromme.dk'
        )

        if (!hasAnalyticsDomain) {
          throw new Error(
            `CRITICAL: CSP configuration found but analytics.idaromme.dk is missing!`
          )
        }

        expect(hasAnalyticsDomain).toBe(true)
      }
    })
  })

  describe('Source File Structure Validation', () => {
    it('should have proxy.ts in root (Next.js 16+ convention)', () => {
      const rootProxyPath = path.join(process.cwd(), 'proxy.ts')

      const rootExists = fs.existsSync(rootProxyPath)

      // MUST exist at root
      if (!rootExists) {
        throw new Error(
          `CRITICAL: No proxy.ts found! Must exist at project root:\n` +
            `- Project root: proxy.ts`
        )
      }

      expect(rootExists).toBe(true)
    })

    it('should have correct analytics domain in proxy.ts', () => {
      const rootProxyPath = path.join(process.cwd(), 'proxy.ts')

      if (!fs.existsSync(rootProxyPath)) {
        throw new Error('No proxy.ts found in root!')
      }

      const content = fs.readFileSync(rootProxyPath, 'utf-8')

      const hasAnalyticsDomain = content.includes(ANALYTICS_DOMAIN)
      const hasOldDomains =
        content.includes(OLD_UMAMI_DOMAIN) || content.includes(OLD_IP_DOMAIN)

      expect(hasAnalyticsDomain).toBe(true)
      expect(hasOldDomains).toBe(false)

      if (!hasAnalyticsDomain) {
        throw new Error(
          `proxy.ts is missing analytics.idaromme.dk in CSP configuration!`
        )
      }

      if (hasOldDomains) {
        throw new Error(
          `proxy.ts contains old domains (umami.is or 70.34.205.18)! These should be removed.`
        )
      }
    })
  })

  describe('Build Configuration Validation', () => {
    it('should produce valid proxy.js in production build', () => {
      const proxyJsPath = path.join(
        process.cwd(),
        '.next',
        'server',
        'proxy.js'
      )

      if (!fs.existsSync(proxyJsPath)) {
        console.warn(
          '⚠️  No production build found. Run: NODE_ENV=production npm run build'
        )
        return
      }

      const content = fs.readFileSync(proxyJsPath, 'utf-8')

      // Production build should be minified/compiled
      expect(content.length).toBeGreaterThan(100)

      // Should contain essential CSP components
      const hasSecurityHeaders =
        content.includes('Content-Security-Policy') ||
        content.includes('script-src') ||
        content.includes('X-Frame-Options')

      expect(hasSecurityHeaders).toBe(true)
    })

    it('should have manifest file in .next/server', () => {
      const manifestPath = path.join(
        process.cwd(),
        '.next',
        'server',
        'proxy-manifest.json'
      )

      if (!fs.existsSync(manifestPath)) {
        console.warn('⚠️  No proxy manifest found. Build may be incomplete.')
        return
      }

      const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent)

      expect(manifest).toBeDefined()
      expect(manifest.middleware).toBeDefined()
    })
  })

  describe('Regression Prevention', () => {
    it('should fail immediately if old domains appear in build', () => {
      const compiledPath = path.join(
        process.cwd(),
        '.next',
        'server',
        'proxy.js'
      )

      if (!fs.existsSync(compiledPath)) {
        return // Skip if no build
      }

      const content = fs.readFileSync(compiledPath, 'utf-8')

      // Count occurrences
      const umamiCount = (content.match(/umami\.is/g) || []).length
      const ipCount = (content.match(/70\.34\.205\.18/g) || []).length
      const analyticsCount = (content.match(/analytics\.idaromme\.dk/g) || [])
        .length

      if (umamiCount > 0 || ipCount > 0) {
        throw new Error(
          `CRITICAL REGRESSION DETECTED!\n\n` +
            `Compiled proxy contains OLD analytics domains:\n` +
            `- umami.is occurrences: ${umamiCount}\n` +
            `- 70.34.205.18 occurrences: ${ipCount}\n` +
            `- analytics.idaromme.dk occurrences: ${analyticsCount}\n\n` +
            `This is a REGRESSION of the duplicate proxy file bug.\n` +
            `Check for proxy.ts files in unexpected locations.`
        )
      }

      expect(umamiCount).toBe(0)
      expect(ipCount).toBe(0)
      expect(analyticsCount).toBeGreaterThan(0)
    })
  })
})
