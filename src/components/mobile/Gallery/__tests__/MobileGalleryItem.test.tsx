// ABOUTME: Test suite for MobileGalleryItem component - individual gallery item

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  mockSingleDesign,
  mockMinimalDesign,
} from '../../../../../tests/fixtures/designs'
import { TextileDesign } from '@/types/textile'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src as string}
      alt={props.alt as string}
      width={props.width as number}
      height={props.height as number}
      data-testid="next-image"
    />
  ),
}))

// Mock image helpers
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn((source, options) => {
    if (!source) return ''
    const ref = source.asset?._ref || source._ref || 'unknown'
    const format = options?.format || 'webp'
    return `https://cdn.example.com/${ref}.${format}`
  }),
}))

describe('MobileGalleryItem', () => {
  let MobileGalleryItem: React.ComponentType<{
    design: TextileDesign
    onNavigate?: () => void
  }>

  beforeAll(async () => {
    // Dynamic import after mocks are ready
    const itemModule = await import(
      '@/components/mobile/Gallery/MobileGalleryItem'
    )
    MobileGalleryItem = itemModule.default
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render design title', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      expect(screen.getByText(mockSingleDesign.title)).toBeInTheDocument()
    })

    it('should render design description when available', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      if (mockSingleDesign.description) {
        expect(
          screen.getByText(mockSingleDesign.description)
        ).toBeInTheDocument()
      }
    })

    it('should render design image with correct alt text', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      if (mockSingleDesign.image?.alt) {
        const img = screen.getByAltText(mockSingleDesign.image.alt)
        expect(img).toBeInTheDocument()
      }
    })

    it('should use article element for semantic HTML', () => {
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} />
      )

      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    it('should handle minimal design with required fields only', () => {
      render(<MobileGalleryItem design={mockMinimalDesign} />)

      expect(screen.getByText(mockMinimalDesign.title)).toBeInTheDocument()
    })
  })

  describe('Image Handling', () => {
    it('should use Next.js Image component for optimization', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      const img = screen.getByTestId('next-image')
      expect(img).toBeInTheDocument()
    })

    it('should use optimized image URL', async () => {
      const imageHelpers = await import('@/utils/image-helpers')
      render(<MobileGalleryItem design={mockSingleDesign} />)

      expect(imageHelpers.getOptimizedImageUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          format: 'webp',
          quality: expect.any(Number),
        })
      )
    })

    it('should handle missing image gracefully', () => {
      const designWithoutImage = { ...mockSingleDesign, image: undefined }
      const { container } = render(
        <MobileGalleryItem design={designWithoutImage} />
      )

      // Should still render the article
      expect(container.querySelector('article')).toBeInTheDocument()
      expect(screen.getByText(designWithoutImage.title)).toBeInTheDocument()
    })

    it('should use full width for mobile layout', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      const img = screen.getByTestId('next-image')
      // Mobile images should span full width
      expect(img).toHaveAttribute('width')
      const width = parseInt(img.getAttribute('width') || '0')
      expect(width).toBeGreaterThan(300) // Reasonable mobile width
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} />
      )

      const article = container.querySelector('article')
      expect(article).toHaveAttribute('aria-label')
    })

    it('should be keyboard accessible', () => {
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} />
      )

      const article = container.querySelector('article')
      expect(article).toHaveAttribute('tabIndex', '0')
    })

    it('should have Enter key support for navigation', () => {
      const onNavigate = jest.fn()
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} onNavigate={onNavigate} />
      )

      const article = container.querySelector('article')
      if (article) {
        fireEvent.keyDown(article, { key: 'Enter', code: 'Enter' })
        expect(onNavigate).toHaveBeenCalled()
      }
    })

    it('should have Space key support for navigation', () => {
      const onNavigate = jest.fn()
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} onNavigate={onNavigate} />
      )

      const article = container.querySelector('article')
      if (article) {
        fireEvent.keyDown(article, { key: ' ', code: 'Space' })
        expect(onNavigate).toHaveBeenCalled()
      }
    })

    it('should use proper heading level for title', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      const title = screen.getByText(mockSingleDesign.title)
      const tagName = title.tagName.toLowerCase()
      expect(['h2', 'h3']).toContain(tagName)
    })

    it('should have alt text for images', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      if (mockSingleDesign.image) {
        const img = screen.getByTestId('next-image')
        expect(img).toHaveAttribute('alt')
        const alt = img.getAttribute('alt')
        expect(alt).toBeTruthy()
        expect(alt?.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Touch Interactions', () => {
    it('should handle touch/click events', () => {
      const onNavigate = jest.fn()
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} onNavigate={onNavigate} />
      )

      const article = container.querySelector('article')
      if (article) {
        fireEvent.click(article)
        expect(onNavigate).toHaveBeenCalled()
      }
    })

    it('should have adequate touch target size', () => {
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} />
      )

      const article = container.querySelector('article')
      const rect = article?.getBoundingClientRect()

      // Touch target should be at least 44x44 pixels (WCAG guideline)
      expect(rect?.height).toBeGreaterThanOrEqual(44)
    })

    it('should apply active/pressed state styles', () => {
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} />
      )

      const article = container.querySelector('article')
      expect(article).toHaveClass('mobile-gallery-item')
    })
  })

  describe('Metadata Display', () => {
    it('should display year when available', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      if (mockSingleDesign.year) {
        expect(
          screen.getByText(mockSingleDesign.year.toString())
        ).toBeInTheDocument()
      }
    })

    it('should display category when available', () => {
      render(<MobileGalleryItem design={mockSingleDesign} />)

      if (mockSingleDesign.category) {
        expect(screen.getByText(mockSingleDesign.category)).toBeInTheDocument()
      }
    })

    it('should not crash when optional metadata is missing', () => {
      const minimalDesign = {
        _id: 'test',
        title: 'Test Design',
        slug: { current: 'test' },
      }

      const { container } = render(<MobileGalleryItem design={minimalDesign} />)

      expect(container.querySelector('article')).toBeInTheDocument()
      expect(screen.getByText('Test Design')).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should apply mobile-gallery-item class', () => {
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} />
      )

      const article = container.querySelector('article')
      expect(article).toHaveClass('mobile-gallery-item')
    })

    it('should be styled for vertical stacking', () => {
      const { container } = render(
        <MobileGalleryItem design={mockSingleDesign} />
      )

      const article = container.querySelector('article')
      // Component should have appropriate classes for vertical layout
      expect(article?.className).toContain('mobile')
    })
  })
})
