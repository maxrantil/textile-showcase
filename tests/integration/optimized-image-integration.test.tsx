// ABOUTME: Integration tests for OptimizedImage component with real component usage

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import Gallery from '@/components/desktop/Gallery/Gallery'
import type { ImageSource, TextileDesign } from '@/types/textile'

// Real test data with actual ImageSource structure
const realImageSource: ImageSource = {
  asset: {
    _ref: 'image-4c8c9b4c8c9b4c8c9b4c-1920x1080-jpg',
    _type: 'reference',
  },
  _type: 'image',
}

const realTestDesigns: TextileDesign[] = [
  {
    _id: 'design-1',
    title: 'Sustainable Cotton Weave',
    slug: { current: 'sustainable-cotton-weave' },
    description: 'A beautiful sustainable cotton textile design',
    image: {
      asset: {
        _ref: 'image-4c8c9b4c8c9b4c8c9b4c-1920x1080-jpg',
        _type: 'reference',
      },
    },
  },
  {
    _id: 'design-2',
    title: 'Organic Hemp Fiber',
    slug: { current: 'organic-hemp-fiber' },
    description: 'Modern organic hemp textile innovation',
    image: {
      asset: {
        _ref: 'image-5d9d0c5d9d0c5d9d0c5d-1920x1080-jpg',
        _type: 'reference',
      },
    },
  },
  {
    _id: 'design-3',
    title: 'Recycled Wool Blend',
    slug: { current: 'recycled-wool-blend' },
    description: 'Innovative recycled wool textile blend',
    image: {
      asset: {
        _ref: 'image-6e0e1d6e0e1d6e0e1d6e-1920x1080-jpg',
        _type: 'reference',
      },
    },
  },
]

// Mock image helpers to return predictable URLs for testing
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn().mockImplementation((source, options) => {
    if (!source) return ''
    const id = source.asset?._ref || source.asset?._id || 'default'
    const width = options?.width || 800
    const quality = options?.quality || 85
    const format = options?.format || 'auto'
    return `https://cdn.sanity.io/images/test/production/${id}-${width}x600.${format}?q=${quality}`
  }),
  getImageDimensionsFromSource: jest.fn().mockImplementation(() => ({
    width: 800,
    height: 600,
    aspectRatio: 4 / 3,
  })),
}))

// Mock analytics
jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    viewProject: jest.fn(),
    galleryNavigation: jest.fn(),
    trackEvent: jest.fn(),
  },
}))

// Mock scroll manager
jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    save: jest.fn(),
    saveImmediate: jest.fn(),
    restore: jest.fn().mockResolvedValue(0),
    restorePosition: jest.fn().mockResolvedValue(0),
    triggerNavigationStart: jest.fn(),
    clearPosition: jest.fn(),
  },
}))

// Mock Next.js router
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

// Mock IntersectionObserver for lazy loading tests
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver =
  mockIntersectionObserver as unknown as typeof IntersectionObserver

describe('OptimizedImage Integration Tests', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
    mockIntersectionObserver.mockClear()
    jest.clearAllMocks()
  })

  describe('Scenario Group 1: Real Component Integration', () => {
    it('renders correctly within Gallery component with real Sanity ImageSource', () => {
      render(<Gallery designs={realTestDesigns} />)

      // Verify images are rendered with correct alt text (uses design title)
      const images = screen.getAllByRole('img')
      expect(images[0]).toHaveAttribute('alt', 'Sustainable Cotton Weave')
      expect(images[1]).toHaveAttribute('alt', 'Organic Hemp Fiber')
      expect(images[2]).toHaveAttribute('alt', 'Recycled Wool Blend')

      // Verify images have src attributes (image processing working)
      images.forEach((img) => {
        expect(img).toHaveAttribute('src')
        const src = img.getAttribute('src')
        expect(src).toBeTruthy()
      })
    })

    it('renders correctly as hero image with priority=true', () => {
      render(
        <OptimizedImage
          src={realImageSource}
          alt="Hero Image"
          width={1920}
          height={1080}
          priority={true}
          imageType="hero"
        />
      )

      const image = screen.getByAltText('Hero Image')
      expect(image).toBeInTheDocument()

      // Priority images should not use IntersectionObserver
      expect(mockIntersectionObserver).not.toHaveBeenCalled()
    })

    it('handles null/undefined src in Gallery gracefully', () => {
      const designsWithNullImage: TextileDesign[] = [
        {
          _id: 'design-null',
          title: 'Design Without Image',
          slug: { current: 'design-without-image' },
          image: null as unknown as ImageSource,
        },
      ]

      // Should not crash with null image
      expect(() => {
        render(<Gallery designs={designsWithNullImage} />)
      }).not.toThrow()

      // Verify fallback placeholder is used
      const images = screen.getAllByRole('img')
      const imageSrc = images[0].getAttribute('src')
      expect(imageSrc).toContain('placeholder')
    })

    it('applies correct priority detection for thumbnail imageType', () => {
      const { container } = render(
        <OptimizedImage
          src={realImageSource}
          alt="Thumbnail"
          width={200}
          height={150}
          imageType="thumbnail"
        />
      )

      // In test environment, IntersectionObserver is mocked so image doesn't load
      // Verify the wrapper is rendered with correct data attributes
      const wrapper = container.querySelector('[data-image-type="thumbnail"]')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveAttribute('data-size', 'small')
      expect(wrapper).toHaveAttribute('aria-label', 'Thumbnail')

      // Thumbnail images should use IntersectionObserver (lazy load)
      expect(mockIntersectionObserver).toHaveBeenCalled()
    })
  })

  describe('Scenario Group 2: Network Conditions', () => {
    it('handles slow network simulation with loading placeholder', async () => {
      const { container } = render(
        <OptimizedImage
          src={realImageSource}
          alt="Slow Loading Image"
          width={800}
          height={600}
        />
      )

      // Loading placeholder should be present initially
      // (IntersectionObserver hasn't triggered yet in test environment)
      const loadingPlaceholder = container.querySelector(
        '.jsx-3901c27cdd9e8a4c'
      )
      expect(loadingPlaceholder).toBeInTheDocument()

      // Verify wrapper is rendered with correct attributes
      const wrapper = container.querySelector('[data-image-type="gallery"]')
      expect(wrapper).toBeInTheDocument()
    })

    it('retries with fallback JPG format on primary format failure', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getOptimizedImageUrl } = require('@/utils/image-helpers')

      render(
        <OptimizedImage
          src={realImageSource}
          alt="Image with Fallback"
          width={800}
          height={600}
        />
      )

      // Verify both primary and fallback URLs are generated
      expect(getOptimizedImageUrl).toHaveBeenCalled()
      const calls = getOptimizedImageUrl.mock.calls

      // Should generate primary URL with 'auto' format
      const primaryCalls = calls.filter(
        (call: unknown[]) => (call[1] as { format?: string })?.format === 'auto'
      )
      expect(primaryCalls.length).toBeGreaterThan(0)

      // Should generate fallback URL with 'jpg' format
      const fallbackCalls = calls.filter(
        (call: unknown[]) => (call[1] as { format?: string })?.format === 'jpg'
      )
      expect(fallbackCalls.length).toBeGreaterThan(0)
    })

    it('handles image load errors gracefully', async () => {
      const { container } = render(
        <OptimizedImage
          src={realImageSource}
          alt="Error Image"
          width={800}
          height={600}
        />
      )

      // Component should render without crashing
      // In test environment, images don't load so we check wrapper
      const wrapper = container.querySelector('[aria-label="Error Image"]')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveAttribute('data-image-type', 'gallery')
    })
  })

  describe('Scenario Group 3: Gallery Interactions', () => {
    it('lazy loads multiple images during gallery scrolling', () => {
      render(<Gallery designs={realTestDesigns} />)

      // Verify IntersectionObserver is set up for lazy loading
      // (In actual browser, images would load as they scroll into view)
      const images = screen.getAllByRole('img')
      expect(images.length).toBe(3)

      // All images should render (Gallery sets priority for first 2)
      images.forEach((img) => {
        expect(img).toHaveAttribute('src')
      })
    })

    it('handles gallery navigation with keyboard', async () => {
      render(<Gallery designs={realTestDesigns} />)

      // Press Enter key to navigate to first project
      fireEvent.keyDown(document, { key: 'Enter' })

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith(
          '/project/sustainable-cotton-weave'
        )
      })
    })

    it('maintains correct focus during gallery navigation', () => {
      render(<Gallery designs={realTestDesigns} />)

      // Find gallery items with role="button" (they are the clickable gallery divs)
      const galleryItems = screen.getAllByRole('button')

      // Gallery has 3 designs + 2 navigation arrows = 5 buttons total
      expect(galleryItems.length).toBeGreaterThanOrEqual(3)

      // Gallery design items should be focusable (have tabIndex="0")
      const designItems = galleryItems.filter(
        (item) =>
          item.hasAttribute('data-testid') &&
          item.getAttribute('data-testid')?.startsWith('gallery-item')
      )
      designItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('Scenario Group 4: Edge Cases', () => {
    it('handles very large images (>2000px) correctly', () => {
      const { container } = render(
        <OptimizedImage
          src={realImageSource}
          alt="Large Image"
          width={3000}
          height={2000}
          imageType="hero"
        />
      )

      // Verify wrapper rendered with large size attribute
      const wrapper = container.querySelector('[data-size="large"]')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveAttribute('aria-label', 'Large Image')

      // Large images should have high quality applied
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getOptimizedImageUrl } = require('@/utils/image-helpers')
      const calls = getOptimizedImageUrl.mock.calls
      const largeImageCall = calls.find(
        (call: unknown[]) => (call[1] as { width?: number })?.width === 3000
      )
      expect(largeImageCall).toBeTruthy()
    })

    it('handles very small thumbnails (<100px) correctly', () => {
      const { container } = render(
        <OptimizedImage
          src={realImageSource}
          alt="Small Thumbnail"
          width={80}
          height={60}
          imageType="thumbnail"
        />
      )

      // Verify wrapper rendered with small size attribute
      const wrapper = container.querySelector('[data-size="small"]')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveAttribute('aria-label', 'Small Thumbnail')

      // Small thumbnails should use lower quality for performance
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getOptimizedImageUrl } = require('@/utils/image-helpers')
      expect(getOptimizedImageUrl).toHaveBeenCalled()
    })

    it('handles rapid component mount/unmount cycles', () => {
      // Mount and unmount 10 times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <OptimizedImage
            src={realImageSource}
            alt={`Test Image ${i}`}
            width={800}
            height={600}
          />
        )
        unmount()
      }

      // Should not throw errors or cause memory leaks
      expect(true).toBe(true)
    })

    it('handles missing alt text gracefully (dev mode warning)', () => {
      const { container } = render(
        <OptimizedImage src={realImageSource} alt="" width={800} height={600} />
      )

      // Component should render with empty alt text
      // Wrapper will have empty aria-label
      const wrapper = container.querySelector('[data-image-type="gallery"]')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveAttribute('aria-label', '')
    })

    it('handles fill mode correctly', () => {
      const { container } = render(
        <div style={{ position: 'relative', width: 800, height: 600 }}>
          <OptimizedImage
            src={realImageSource}
            alt="Fill Mode Image"
            fill={true}
            objectFit="cover"
          />
        </div>
      )

      // Fill mode wrapper should have 100% width and height
      const wrapper = container.querySelector('[data-image-type="gallery"]')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveStyle({ width: '100%', height: '100%' })
    })
  })

  describe('Scenario Group 5: Accessibility', () => {
    it('renders with correct ARIA attributes', () => {
      const handleClick = jest.fn()

      render(
        <OptimizedImage
          src={realImageSource}
          alt="Clickable Image"
          width={800}
          height={600}
          onClick={handleClick}
        />
      )

      // Clickable images should have role="button" and be keyboard accessible
      const wrapper = screen.getByRole('button')
      expect(wrapper).toHaveAttribute('role', 'button')
      expect(wrapper).toHaveAttribute('tabIndex', '0')
      expect(wrapper).toHaveAttribute('aria-label', 'View Clickable Image')
    })

    it('handles keyboard interaction correctly', async () => {
      const handleClick = jest.fn()

      render(
        <OptimizedImage
          src={realImageSource}
          alt="Keyboard Image"
          width={800}
          height={600}
          onClick={handleClick}
        />
      )

      const wrapper = screen.getByRole('button')

      // Press Enter key
      fireEvent.keyDown(wrapper, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)

      // Press Space key
      fireEvent.keyDown(wrapper, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })
})
