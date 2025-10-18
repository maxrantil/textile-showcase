// ABOUTME: Test suite for MobileGallery component - vertical scrolling mobile gallery

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  mockDesigns,
  mockEmptyDesigns,
} from '../../../../../tests/fixtures/designs'
import { useRouter } from 'next/navigation'
import { TextileDesign } from '@/types/textile'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock image helpers
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn((source) => {
    if (!source) return ''
    return `https://cdn.example.com/optimized-image-${source.asset?._ref || source._ref}.webp`
  }),
}))

// Mock analytics
jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    viewProject: jest.fn(),
  },
}))

describe('MobileGallery', () => {
  let MobileGallery: React.ComponentType<{ designs: TextileDesign[] }>
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

  beforeAll(async () => {
    // Dynamic import after mocks are ready
    const mobileModule = await import(
      '@/components/mobile/Gallery/MobileGallery'
    )
    MobileGallery = mobileModule.default
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Rendering', () => {
    it('should render all designs in vertical stack', () => {
      render(<MobileGallery designs={mockDesigns} />)

      mockDesigns.forEach((design) => {
        expect(screen.getByText(design.title)).toBeInTheDocument()
      })
    })

    it('should render with correct semantic HTML structure', () => {
      const { container } = render(<MobileGallery designs={mockDesigns} />)

      // Gallery should use section element
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
      expect(section).toHaveAttribute('aria-label', 'Mobile textile gallery')
    })

    it('should render accessible empty state when no designs provided', () => {
      const { container } = render(<MobileGallery designs={mockEmptyDesigns} />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()

      // Verify accessible empty state
      const emptyState = container.querySelector('[role="status"]')
      expect(emptyState).toBeInTheDocument()
      expect(emptyState).toHaveAttribute('aria-live', 'polite')
      expect(emptyState).toHaveClass('mobile-gallery-empty')
      expect(emptyState?.textContent).toBe('No designs available to display')
    })

    it('should apply correct CSS classes for mobile layout', () => {
      const { container } = render(<MobileGallery designs={mockDesigns} />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('mobile-gallery')
    })
  })

  describe('Gallery Items', () => {
    it('should render each design as a MobileGalleryItem', () => {
      const { container } = render(<MobileGallery designs={mockDesigns} />)

      // Each item should be an article element
      const articles = container.querySelectorAll('article')
      expect(articles).toHaveLength(mockDesigns.length)
    })

    it('should display design titles', () => {
      render(<MobileGallery designs={mockDesigns} />)

      mockDesigns.forEach((design) => {
        expect(screen.getByText(design.title)).toBeInTheDocument()
      })
    })

    it('should display design images with correct alt text', () => {
      render(<MobileGallery designs={mockDesigns} />)

      mockDesigns.forEach((design) => {
        if (design.image?.alt) {
          const img = screen.getByAltText(design.image.alt)
          expect(img).toBeInTheDocument()
        }
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to project page when design is clicked', async () => {
      render(<MobileGallery designs={mockDesigns} />)

      const firstDesign = mockDesigns[0]
      const designElement = screen.getByText(firstDesign.title)

      fireEvent.click(designElement)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          `/project/${firstDesign.slug?.current || firstDesign._id}`
        )
      })
    })

    it('should handle designs without slugs', async () => {
      const designWithoutSlug = { ...mockDesigns[0], slug: undefined }
      render(<MobileGallery designs={[designWithoutSlug]} />)

      const designElement = screen.getByText(designWithoutSlug.title)
      fireEvent.click(designElement)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          `/project/${designWithoutSlug._id}`
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { container } = render(<MobileGallery designs={mockDesigns} />)

      const section = container.querySelector('section')
      expect(section).toHaveAttribute('aria-label', 'Mobile textile gallery')
    })

    it('should use semantic HTML (section and article elements)', () => {
      const { container } = render(<MobileGallery designs={mockDesigns} />)

      expect(container.querySelector('section')).toBeInTheDocument()
      expect(container.querySelectorAll('article')).toHaveLength(
        mockDesigns.length
      )
    })

    it('should have proper heading hierarchy', () => {
      render(<MobileGallery designs={mockDesigns} />)

      // Each design title should be in an h2 or h3
      mockDesigns.forEach((design) => {
        const heading = screen.getByText(design.title)
        const tagName = heading.tagName.toLowerCase()
        expect(['h2', 'h3']).toContain(tagName)
      })
    })

    it('should provide keyboard navigation support', () => {
      const { container } = render(<MobileGallery designs={mockDesigns} />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        // Articles should be focusable for keyboard navigation
        expect(article).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('Image Optimization', () => {
    it('should use optimized image URLs', async () => {
      const imageHelpers = await import('@/utils/image-helpers')
      render(<MobileGallery designs={mockDesigns} />)

      mockDesigns.forEach((design) => {
        if (design.image) {
          expect(imageHelpers.getOptimizedImageUrl).toHaveBeenCalledWith(
            expect.objectContaining({
              asset: expect.objectContaining({
                _ref: design.image.asset?._ref,
              }),
            }),
            expect.objectContaining({
              format: 'webp',
            })
          )
        }
      })
    })

    it('should handle designs without images gracefully', () => {
      const designWithoutImage = { ...mockDesigns[0], image: undefined }
      const { container } = render(
        <MobileGallery designs={[designWithoutImage]} />
      )

      // Should still render the design
      expect(screen.getByText(designWithoutImage.title)).toBeInTheDocument()

      // Should show placeholder or handle missing image
      const articles = container.querySelectorAll('article')
      expect(articles).toHaveLength(1)
    })
  })

  describe('Performance', () => {
    it('should render efficiently with many designs', () => {
      const manyDesigns = Array.from({ length: 20 }, (_, i) => ({
        ...mockDesigns[0],
        _id: `design-${i}`,
        title: `Design ${i}`,
      }))

      const startTime = performance.now()
      render(<MobileGallery designs={manyDesigns} />)
      const endTime = performance.now()

      // Should render in reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe('Touch Interactions', () => {
    it('should be touch-friendly with adequate touch targets', () => {
      const { container } = render(<MobileGallery designs={mockDesigns} />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        // Touch targets should be at least 44x44 pixels
        const rect = article.getBoundingClientRect()
        expect(rect.height).toBeGreaterThanOrEqual(44)
      })
    })
  })
})
