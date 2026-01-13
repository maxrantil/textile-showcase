// ABOUTME: Unit tests for FirstImage server component - CORS security (Issue #266)
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FirstImage } from '../FirstImage'
import type { TextileDesign } from '@/types/textile'
import * as imageHelpers from '@/utils/image-helpers'

// Mock image helpers
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn((src, options) => {
    const { width, quality, format } = options
    return `https://cdn.sanity.io/images/test/${format}?w=${width}&q=${quality}`
  }),
}))

const mockDesign: TextileDesign = {
  _id: 'test-design-1',
  _type: 'design',
  title: 'Test Design',
  slug: { current: 'test-design', _type: 'slug' },
  description: 'Test description',
  dimensions: '100x100 cm',
  year: 2024,
  image: {
    asset: {
      _ref: 'image-test-123',
      _type: 'reference',
    },
    _type: 'image',
  },
}

describe('FirstImage Server Component - Issue #266', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ========================================
  // Core Rendering Tests
  // ========================================

  describe('Core Rendering', () => {
    it('renders with design that has image property', () => {
      render(<FirstImage design={mockDesign} />)
      expect(screen.getByAltText('Test Design')).toBeInTheDocument()
    })

    it('renders null when design has no image', () => {
      const designWithoutImage = { ...mockDesign, image: undefined }
      const { container } = render(<FirstImage design={designWithoutImage} />)
      // Container should have null or empty content
      const firstImageContainer = container.querySelector(
        '[data-first-image="true"]'
      )
      expect(firstImageContainer).not.toBeInTheDocument()
    })

    it('uses picture element for progressive enhancement', () => {
      render(<FirstImage design={mockDesign} />)
      const picture = screen.getByAltText('Test Design').closest('picture')
      expect(picture).toBeInTheDocument()
    })

    it('includes AVIF source for modern browsers', () => {
      const { container } = render(<FirstImage design={mockDesign} />)
      const avifSource = container.querySelector('source[type="image/avif"]')
      expect(avifSource).toBeInTheDocument()
    })

    it('includes WebP source for Safari 15 fallback', () => {
      const { container } = render(<FirstImage design={mockDesign} />)
      const webpSource = container.querySelector('source[type="image/webp"]')
      expect(webpSource).toBeInTheDocument()
    })

    it('includes JPEG img element as final fallback', () => {
      render(<FirstImage design={mockDesign} />)
      const img = screen.getByAltText('Test Design')
      expect(img.tagName).toBe('IMG')
      // Check src contains jpg format
      expect(img).toHaveAttribute('src', expect.stringContaining('jpg'))
    })

    it('applies fetchPriority="high" for LCP optimization', () => {
      render(<FirstImage design={mockDesign} />)
      const img = screen.getByAltText('Test Design')
      expect(img).toHaveAttribute('fetchPriority', 'high')
    })

    it('applies loading="eager" for immediate LCP loading', () => {
      render(<FirstImage design={mockDesign} />)
      const img = screen.getByAltText('Test Design')
      expect(img).toHaveAttribute('loading', 'eager')
    })

    it('applies decoding="async" for non-blocking decode', () => {
      render(<FirstImage design={mockDesign} />)
      const img = screen.getByAltText('Test Design')
      expect(img).toHaveAttribute('decoding', 'async')
    })

    it('applies data-first-image="true" marker', () => {
      const { container } = render(<FirstImage design={mockDesign} />)
      const firstImageContainer = container.querySelector(
        '[data-first-image="true"]'
      )
      expect(firstImageContainer).toBeInTheDocument()
    })
  })

  // ========================================
  // CORS Security Tests - Issue #266
  // ========================================

  describe('CORS Security - crossOrigin attribute', () => {
    it('applies crossorigin="anonymous" to AVIF source for CDN compatibility', () => {
      const { container } = render(<FirstImage design={mockDesign} />)

      const avifSource = container.querySelector('source[type="image/avif"]')
      expect(avifSource).toHaveAttribute('crossorigin', 'anonymous')
    })

    it('applies crossorigin="anonymous" to WebP source for CDN compatibility', () => {
      const { container } = render(<FirstImage design={mockDesign} />)

      const webpSource = container.querySelector('source[type="image/webp"]')
      expect(webpSource).toHaveAttribute('crossorigin', 'anonymous')
    })

    it('applies crossorigin="anonymous" to JPEG img element for CDN compatibility', () => {
      render(<FirstImage design={mockDesign} />)

      const img = screen.getByAltText('Test Design')
      expect(img).toHaveAttribute('crossorigin', 'anonymous')
    })

    it('uses lowercase "crossorigin" attribute for HTML compliance on all elements', () => {
      const { container } = render(<FirstImage design={mockDesign} />)

      const avifSource = container.querySelector(
        'source[type="image/avif"]'
      ) as HTMLSourceElement
      const webpSource = container.querySelector(
        'source[type="image/webp"]'
      ) as HTMLSourceElement
      const img = screen.getByAltText('Test Design') as HTMLImageElement

      // Check DOM attribute (lowercase for HTML)
      expect(avifSource?.getAttribute('crossorigin')).toBe('anonymous')
      expect(webpSource?.getAttribute('crossorigin')).toBe('anonymous')
      expect(img.getAttribute('crossorigin')).toBe('anonymous')
    })
  })

  // ========================================
  // Image URL Generation Tests
  // ========================================

  describe('Image URL Generation', () => {
    it('generates AVIF srcset with correct widths (480w, 640w, 960w)', () => {
      const { container } = render(<FirstImage design={mockDesign} />)

      const avifSource = container.querySelector('source[type="image/avif"]')
      const srcset = avifSource?.getAttribute('srcset')

      expect(srcset).toContain('480w')
      expect(srcset).toContain('640w')
      expect(srcset).toContain('960w')
      expect(srcset).toContain('avif')
    })

    it('generates WebP srcset with correct widths (480w, 640w, 960w)', () => {
      const { container } = render(<FirstImage design={mockDesign} />)

      const webpSource = container.querySelector('source[type="image/webp"]')
      const srcset = webpSource?.getAttribute('srcset')

      expect(srcset).toContain('480w')
      expect(srcset).toContain('640w')
      expect(srcset).toContain('960w')
      expect(srcset).toContain('webp')
    })

    it('uses quality=40 for LCP optimization', () => {
      render(<FirstImage design={mockDesign} />)

      const mockGetOptimizedImageUrl =
        imageHelpers.getOptimizedImageUrl as jest.Mock

      // Check that at least one call uses quality: 40
      const callsWithQuality40 = mockGetOptimizedImageUrl.mock.calls.filter(
        (call) => call[1].quality === 40
      )

      expect(callsWithQuality40.length).toBeGreaterThan(0)
    })

    it('applies responsive sizes attribute', () => {
      const { container } = render(<FirstImage design={mockDesign} />)

      const avifSource = container.querySelector('source[type="image/avif"]')
      const sizes = avifSource?.getAttribute('sizes')

      expect(sizes).toContain('max-width: 480px')
      expect(sizes).toContain('max-width: 768px')
      expect(sizes).toContain('640px')
    })
  })
})
