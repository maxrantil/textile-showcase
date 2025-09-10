// ABOUTME: Real integration tests for gallery navigation with actual components and data

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DesktopGallery } from '@/components/desktop/Gallery/DesktopGallery'
import { MobileGallery } from '@/components/mobile/Gallery/MobileGallery'
import { TextileDesign } from '@/sanity/types'

// Real test data - no mocks, actual data structures
const realTestDesigns: TextileDesign[] = [
  {
    _id: 'design-1',
    title: 'Sustainable Cotton Weave',
    slug: { current: 'sustainable-cotton-weave' },
    description: 'A beautiful sustainable cotton textile design',
    image: {
      asset: {
        _ref: 'image-asset-1',
        _type: 'reference',
      },
      alt: 'Sustainable cotton weave pattern',
    },
  },
  {
    _id: 'design-2',
    title: 'Organic Hemp Fiber',
    slug: { current: 'organic-hemp-fiber' },
    description: 'Modern organic hemp textile innovation',
    image: {
      asset: {
        _ref: 'image-asset-2',
        _type: 'reference',
      },
      alt: 'Organic hemp fiber texture',
    },
  },
  {
    _id: 'design-3',
    title: 'Recycled Wool Blend',
    slug: { current: 'recycled-wool-blend' },
    description: 'Innovative recycled wool textile blend',
    image: {
      asset: {
        _ref: 'image-asset-3',
        _type: 'reference',
      },
      alt: 'Recycled wool blend pattern',
    },
  },
]

// Mock Next.js router with real-like behavior
const mockRouterPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/gallery',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Gallery Navigation Integration Tests', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
  })

  describe('Desktop Gallery Real Integration', () => {
    it('should navigate to project when design is clicked', async () => {
      const user = userEvent.setup()

      render(<DesktopGallery designs={realTestDesigns} />)

      // Find and click the first design
      const firstDesign = screen.getByText('Sustainable Cotton Weave')
      await user.click(firstDesign)

      // Should navigate to project page
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          '/projects/sustainable-cotton-weave'
        )
      })
    })

    it('should display all designs with real content', () => {
      render(<DesktopGallery designs={realTestDesigns} />)

      // Check that all real design titles are rendered
      expect(screen.getByText('Sustainable Cotton Weave')).toBeInTheDocument()
      expect(screen.getByText('Organic Hemp Fiber')).toBeInTheDocument()
      expect(screen.getByText('Recycled Wool Blend')).toBeInTheDocument()

      // Check that descriptions are rendered
      expect(
        screen.getByText('A beautiful sustainable cotton textile design')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Modern organic hemp textile innovation')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Innovative recycled wool textile blend')
      ).toBeInTheDocument()
    })

    it('should handle keyboard navigation', async () => {
      render(<DesktopGallery designs={realTestDesigns} />)

      const gallery = screen.getByRole('main')
      gallery.focus()

      // Test arrow key navigation
      fireEvent.keyDown(gallery, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          '/projects/organic-hemp-fiber'
        )
      })

      fireEvent.keyDown(gallery, { key: 'ArrowLeft' })
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          '/projects/sustainable-cotton-weave'
        )
      })
    })
  })

  describe('Mobile Gallery Real Integration', () => {
    it('should handle touch interactions for navigation', async () => {
      const user = userEvent.setup()

      render(<MobileGallery designs={realTestDesigns} />)

      // Find and tap the second design
      const secondDesign = screen.getByText('Organic Hemp Fiber')
      await user.click(secondDesign)

      // Should navigate to project page
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          '/projects/organic-hemp-fiber'
        )
      })
    })

    it('should render mobile-optimized layout', () => {
      render(<MobileGallery designs={realTestDesigns} />)

      // Check for mobile-specific accessibility features
      const galleryItems = screen.getAllByRole('button')
      expect(galleryItems).toHaveLength(3)

      // Each item should be focusable for mobile accessibility
      galleryItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('Cross-Device Functionality', () => {
    it('should handle empty designs array gracefully', () => {
      render(<DesktopGallery designs={[]} />)

      // Should not crash and show appropriate message
      const gallery = screen.getByRole('main')
      expect(gallery).toBeInTheDocument()
    })

    it('should handle designs with missing slugs', async () => {
      const user = userEvent.setup()
      const designsWithoutSlug: TextileDesign[] = [
        {
          ...realTestDesigns[0],
          slug: undefined,
        },
      ]

      render(<DesktopGallery designs={designsWithoutSlug} />)

      const design = screen.getByText('Sustainable Cotton Weave')
      await user.click(design)

      // Should fallback to using _id for navigation
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/projects/design-1')
      })
    })
  })

  describe('Real Data Validation', () => {
    it('should render images with proper alt text', () => {
      render(<DesktopGallery designs={realTestDesigns} />)

      const images = screen.getAllByRole('img')
      expect(images[0]).toHaveAttribute(
        'alt',
        'Sustainable cotton weave pattern'
      )
      expect(images[1]).toHaveAttribute('alt', 'Organic hemp fiber texture')
      expect(images[2]).toHaveAttribute('alt', 'Recycled wool blend pattern')
    })

    it('should handle real Sanity image URLs', () => {
      render(<DesktopGallery designs={realTestDesigns} />)

      const images = screen.getAllByRole('img')
      images.forEach((img) => {
        // Images should have src attributes (real image processing)
        expect(img).toHaveAttribute('src')
        const src = img.getAttribute('src')
        expect(src).toBeTruthy()
      })
    })
  })
})
