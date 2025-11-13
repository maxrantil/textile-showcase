/**
 * ABOUTME: Build artifact validation tests for compiled middleware
 * Ensures production middleware build contains correct CSP configuration
 * and prevents duplicate middleware files from causing issues
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
      // Path to compiled middleware in .next directory
      compiledMiddlewarePath = path.join(
        process.cwd(),
        '.next',
        'server',
        'middleware.js'
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

    it('should have compiled middleware in .next/server/middleware.js', () => {
      if (!compiledMiddlewareExists) {
        console.warn(
          '⚠️  No compiled middleware found. Run `npm run build` first.'
        )
        // Skip this test if no build exists (e.g., in CI without build step)
        return
      }

      expect(compiledMiddlewareExists).toBe(true)
      expect(compiledMiddlewareContent).toBeDefined()
      expect(compiledMiddlewareContent.length).toBeGreaterThan(0)
    })

    it('should include analytics.idaromme.dk in compiled middleware', () => {
      if (!compiledMiddlewareExists) {
        console.warn('⚠️  Skipping: No build artifacts found')
        return
      }

      const hasAnalyticsDomain = compiledMiddlewareContent.includes(
        'analytics.idaromme.dk'
      )

      if (!hasAnalyticsDomain) {
        throw new Error(
          `CRITICAL BUILD ERROR: Compiled middleware does NOT contain analytics.idaromme.dk!\n` +
            `This means the wrong middleware file was used during build.\n` +
            `Check for duplicate middleware files (middleware.ts vs src/middleware.ts).\n` +
            `Build artifact: ${compiledMiddlewarePath}`
        )
      }

      expect(hasAnalyticsDomain).toBe(true)
    })

    it('should NOT include old umami.is domain in compiled middleware', () => {
      if (!compiledMiddlewareExists) {
        console.warn('⚠️  Skipping: No build artifacts found')
        return
      }

      const hasOldUmamiDomain =
        compiledMiddlewareContent.includes('umami.is')

      if (hasOldUmamiDomain) {
        throw new Error(
          `CRITICAL BUILD ERROR: Compiled middleware contains OLD umami.is domain!\n` +
            `This indicates a duplicate middleware file (root middleware.ts) is overriding src/middleware.ts.\n` +
            `Next.js prioritizes root-level middleware.ts over src/middleware.ts.\n` +
            `FIX: Delete middleware.ts from project root, keep only src/middleware.ts\n` +
            `Build artifact: ${compiledMiddlewarePath}`
        )
      }

      expect(hasOldUmamiDomain).toBe(false)
    })

    it('should NOT include old IP address in compiled middleware', () => {
      if (!compiledMiddlewareExists) {
        console.warn('⚠️  Skipping: No build artifacts found')
        return
      }

      const hasOldIP = compiledMiddlewareContent.includes('70.34.205.18')

      if (hasOldIP) {
        throw new Error(
          `CRITICAL BUILD ERROR: Compiled middleware contains OLD IP address 70.34.205.18!\n` +
            `This indicates a duplicate middleware file is overriding the correct configuration.\n` +
            `FIX: Delete middleware.ts from project root\n` +
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
    it('should have middleware.ts in either root OR src (Next.js 15+ compatibility)', () => {
      const rootMiddlewarePath = path.join(process.cwd(), 'middleware.ts')
      const srcMiddlewarePath = path.join(
        process.cwd(),
        'src',
        'middleware.ts'
      )

      const rootExists = fs.existsSync(rootMiddlewarePath)
      const srcExists = fs.existsSync(srcMiddlewarePath)

      // At least one MUST exist
      if (!rootExists && !srcExists) {
        throw new Error(
          `CRITICAL: No middleware.ts found! Must exist at either:\n` +
            `- Project root: middleware.ts\n` +
            `- Or src directory: src/middleware.ts`
        )
      }

      expect(rootExists || srcExists).toBe(true)

      // If BOTH exist, ensure they have the same content (sync issue)
      if (rootExists && srcExists) {
        const rootContent = fs.readFileSync(rootMiddlewarePath, 'utf-8')
        const srcContent = fs.readFileSync(srcMiddlewarePath, 'utf-8')

        if (rootContent !== srcContent) {
          throw new Error(
            `CRITICAL: Both middleware.ts and src/middleware.ts exist with DIFFERENT content!\n\n` +
              `This will cause confusion. Next.js prioritizes root-level middleware.ts.\n\n` +
              `FIX: Keep only ONE file:\n` +
              `1. If using Next.js 15+: Keep root middleware.ts, remove src/middleware.ts\n` +
              `2. If using Next.js 14: Keep src/middleware.ts, remove root middleware.ts`
          )
        }

        console.warn(
          `⚠️  WARNING: Both middleware.ts and src/middleware.ts exist.\n` +
            `Next.js will use root-level middleware.ts and ignore src/middleware.ts.\n` +
            `Consider removing src/middleware.ts to avoid confusion.`
        )
      }
    })

    it('should have correct analytics domain in middleware.ts', () => {
      const rootMiddlewarePath = path.join(process.cwd(), 'middleware.ts')
      const srcMiddlewarePath = path.join(
        process.cwd(),
        'src',
        'middleware.ts'
      )

      // Check whichever file exists (prefer root if both exist)
      const middlewarePath = fs.existsSync(rootMiddlewarePath)
        ? rootMiddlewarePath
        : srcMiddlewarePath

      if (!fs.existsSync(middlewarePath)) {
        throw new Error('No middleware.ts found in root or src!')
      }

      const content = fs.readFileSync(middlewarePath, 'utf-8')

      const hasAnalyticsDomain = content.includes(ANALYTICS_DOMAIN)
      const hasOldDomains =
        content.includes(OLD_UMAMI_DOMAIN) || content.includes(OLD_IP_DOMAIN)

      expect(hasAnalyticsDomain).toBe(true)
      expect(hasOldDomains).toBe(false)

      if (!hasAnalyticsDomain) {
        throw new Error(
          `middleware.ts is missing analytics.idaromme.dk in CSP configuration!`
        )
      }

      if (hasOldDomains) {
        throw new Error(
          `middleware.ts contains old domains (umami.is or 70.34.205.18)! These should be removed.`
        )
      }
    })
  })

  describe('Build Configuration Validation', () => {
    it('should produce valid middleware.js in production build', () => {
      const middlewareJsPath = path.join(
        process.cwd(),
        '.next',
        'server',
        'middleware.js'
      )

      if (!fs.existsSync(middlewareJsPath)) {
        console.warn(
          '⚠️  No production build found. Run: NODE_ENV=production npm run build'
        )
        return
      }

      const content = fs.readFileSync(middlewareJsPath, 'utf-8')

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
        'middleware-manifest.json'
      )

      if (!fs.existsSync(manifestPath)) {
        console.warn('⚠️  No middleware manifest found. Build may be incomplete.')
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
        'middleware.js'
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
            `Compiled middleware contains OLD analytics domains:\n` +
            `- umami.is occurrences: ${umamiCount}\n` +
            `- 70.34.205.18 occurrences: ${ipCount}\n` +
            `- analytics.idaromme.dk occurrences: ${analyticsCount}\n\n` +
            `This is a REGRESSION of the duplicate middleware file bug.\n` +
            `Check for middleware.ts in project root and delete it.`
        )
      }

      expect(umamiCount).toBe(0)
      expect(ipCount).toBe(0)
      expect(analyticsCount).toBeGreaterThan(0)
    })
  })
})
