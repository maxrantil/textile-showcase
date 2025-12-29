// ABOUTME: Regression tests for Issue #259 - Gallery Lockdown Mode compatibility
// These tests ensure gallery items always use Link components (semantic <a> tags)
// and will catch if anyone accidentally reverts to onClick handlers on non-interactive elements

import { render, screen } from '@testing-library/react'
import { mockDesigns } from '../fixtures/designs'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock image helpers
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn((source) => {
    if (!source) return ''
    return `https://cdn.example.com/optimized-image.webp`
  }),
}))

// Mock analytics
jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    viewProject: jest.fn(),
  },
}))

// Mock scroll manager
jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    save: jest.fn(),
    saveImmediate: jest.fn(),
    restore: jest.fn().mockResolvedValue(0),
    triggerNavigationStart: jest.fn(),
    clearPosition: jest.fn(),
  },
}))

describe('Gallery Lockdown Mode Regression Tests - Issue #259', () => {
  describe('Mobile Gallery - Link Component Usage', () => {
    let MobileGallery: React.ComponentType<{ designs: typeof mockDesigns }>

    beforeAll(async () => {
      const mobileModule = await import('@/components/mobile/Gallery/MobileGallery')
      MobileGallery = mobileModule.default
    })

    it('REGRESSION: Mobile gallery items MUST be Link elements (not articles with onClick)', () => {
      render(<MobileGallery designs={mockDesigns} />)

      // Critical: Gallery items must be rendered as <a> tags (Link component)
      // If this fails, someone has reverted to onClick handlers on non-interactive elements
      const galleryLinks = screen.getAllByRole('link')

      expect(galleryLinks.length).toBeGreaterThanOrEqual(mockDesigns.length)

      // Verify each design has a corresponding link
      mockDesigns.forEach((design) => {
        const link = screen.getByRole('link', { name: new RegExp(design.title) })
        expect(link).toBeInTheDocument()
      })
    })

    it('REGRESSION: Mobile gallery items MUST have href attributes for native navigation', () => {
      render(<MobileGallery designs={mockDesigns} />)

      const galleryLinks = screen.getAllByRole('link')

      // Each link must have a valid href for Lockdown Mode compatibility
      galleryLinks.forEach((link) => {
        const href = link.getAttribute('href')
        expect(href).toBeTruthy()
        expect(href).toMatch(/^\/project\//)
      })
    })

    it('REGRESSION: Mobile gallery items MUST NOT use role="button" on articles', () => {
      render(<MobileGallery designs={mockDesigns} />)

      // Articles with role="button" are what caused the Lockdown Mode issue
      // This test ensures we never revert to that pattern
      const articles = document.querySelectorAll('article[role="button"]')
      expect(articles.length).toBe(0)
    })

    it('REGRESSION: Mobile gallery items MUST work without JavaScript (href-based navigation)', () => {
      render(<MobileGallery designs={mockDesigns} />)

      const firstLink = screen.getByRole('link', { name: new RegExp(mockDesigns[0].title) })
      const href = firstLink.getAttribute('href')

      // The href must point to the correct project route
      // This ensures navigation works even if JavaScript is disabled (Lockdown Mode scenario)
      const expectedSlug = mockDesigns[0].slug?.current || mockDesigns[0]._id
      expect(href).toBe(`/project/${expectedSlug}`)
    })
  })

  describe('Desktop Gallery - Link Component Usage', () => {
    let DesktopGallery: React.ComponentType<{ designs: typeof mockDesigns }>

    beforeAll(async () => {
      const desktopModule = await import('@/components/desktop/Gallery/Gallery')
      DesktopGallery = desktopModule.default
    })

    it('REGRESSION: Desktop gallery items MUST be Link elements (not divs with onClick)', () => {
      render(<DesktopGallery designs={mockDesigns} />)

      // Critical: Gallery items must be rendered as <a> tags (Link component)
      // If this fails, someone has reverted to onClick handlers on non-interactive elements
      const galleryLinks = screen.getAllByRole('link')

      expect(galleryLinks.length).toBeGreaterThanOrEqual(mockDesigns.length)

      // Verify each design has a corresponding link
      mockDesigns.forEach((design) => {
        const link = screen.getByRole('link', { name: new RegExp(design.title) })
        expect(link).toBeInTheDocument()
      })
    })

    it('REGRESSION: Desktop gallery items MUST have href attributes for native navigation', () => {
      render(<DesktopGallery designs={mockDesigns} />)

      const galleryLinks = screen.getAllByRole('link')

      // Each link must have a valid href for browser compatibility
      galleryLinks.forEach((link) => {
        const href = link.getAttribute('href')
        expect(href).toBeTruthy()
        expect(href).toMatch(/^\/project\//)
      })
    })

    it('REGRESSION: Desktop gallery items MUST NOT use role="button" on divs', () => {
      render(<DesktopGallery designs={mockDesigns} />)

      // Divs with role="button" are what caused the strict browser security issue
      // This test ensures we never revert to that pattern
      const divButtons = document.querySelectorAll('div[role="button"][data-testid^="gallery-item"]')
      expect(divButtons.length).toBe(0)
    })

    it('REGRESSION: Desktop gallery items MUST work without JavaScript (href-based navigation)', () => {
      render(<DesktopGallery designs={mockDesigns} />)

      const firstLink = screen.getByRole('link', { name: new RegExp(mockDesigns[0].title) })
      const href = firstLink.getAttribute('href')

      // The href must point to the correct project route
      // This ensures navigation works even if JavaScript is disabled
      const expectedSlug = mockDesigns[0].slug?.current || mockDesigns[0]._id
      expect(href).toBe(`/project/${expectedSlug}`)
    })

    it('REGRESSION: Desktop gallery items MUST NOT have explicit tabIndex when using Links', () => {
      render(<DesktopGallery designs={mockDesigns} />)

      const galleryLinks = screen.getAllByRole('link')

      // Links are naturally keyboard accessible and should not need explicit tabIndex
      // If tabIndex is present on links, it suggests someone might be trying to make
      // non-interactive elements keyboard accessible (the old broken pattern)
      galleryLinks.forEach((link) => {
        const tabIndex = link.getAttribute('tabIndex')
        // Links should either have no tabIndex or tabIndex="0" (default)
        if (tabIndex !== null) {
          expect(parseInt(tabIndex)).toBe(0)
        }
      })
    })
  })

  describe('Cross-Platform Compatibility', () => {
    it('REGRESSION: Both mobile and desktop galleries MUST use the same Link-based pattern', async () => {
      const MobileGallery = (await import('@/components/mobile/Gallery/MobileGallery')).default
      const DesktopGallery = (await import('@/components/desktop/Gallery/Gallery')).default

      const { unmount: unmountMobile } = render(<MobileGallery designs={mockDesigns} />)
      const mobileLinks = screen.getAllByRole('link')
      const mobileHasLinks = mobileLinks.length >= mockDesigns.length
      unmountMobile()

      const { unmount: unmountDesktop } = render(<DesktopGallery designs={mockDesigns} />)
      const desktopLinks = screen.getAllByRole('link')
      const desktopHasLinks = desktopLinks.length >= mockDesigns.length
      unmountDesktop()

      // Both platforms must use Link components consistently
      expect(mobileHasLinks).toBe(true)
      expect(desktopHasLinks).toBe(true)
    })
  })

  describe('Lockdown Mode Simulation', () => {
    it('REGRESSION: Gallery items MUST be navigable using href alone (no JavaScript required)', async () => {
      const MobileGallery = (await import('@/components/mobile/Gallery/MobileGallery')).default

      render(<MobileGallery designs={mockDesigns} />)

      // Simulate Lockdown Mode: verify that href exists and is valid
      // In real Lockdown Mode, onClick handlers are blocked but href navigation works
      const links = screen.getAllByRole('link')

      links.forEach((link) => {
        const href = link.getAttribute('href')

        // Must have href
        expect(href).toBeTruthy()

        // Must be a valid project route
        expect(href).toMatch(/^\/project\/[a-zA-Z0-9-]+$/)

        // Link must be actually clickable (not blocked by pointer-events or z-index)
        const styles = window.getComputedStyle(link)
        expect(styles.pointerEvents).not.toBe('none')
      })
    })
  })
})
