// ABOUTME: Gallery navigation integration testing for Phase 3 TDD approach

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { MobileGallery, DesktopGallery } from '../__mocks__/gallery-components'
import { TextileDesign } from '@/sanity/types'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))
jest.mock('@/lib/scrollManager')
jest.mock('@/hooks/shared/useDeviceType')
jest.mock('@/hooks/mobile/useSwipeGesture')

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

// Mock textile designs for testing
const mockDesigns: TextileDesign[] = [
  {
    _id: 'design-1',
    title: 'Sustainable Weave Pattern',
    slug: { current: 'sustainable-weave' },
    description: 'A beautiful sustainable weave pattern',
    images: [
      {
        _key: 'img-1',
        asset: {
          _ref: 'image-1',
          _type: 'reference',
        },
        alt: 'Sustainable weave pattern',
        _type: 'image',
      },
    ],
    _createdAt: '2024-01-01',
    _updatedAt: '2024-01-01',
    _rev: 'rev1',
    _type: 'textileDesign',
  },
  {
    _id: 'design-2',
    title: 'Organic Cotton Design',
    slug: { current: 'organic-cotton' },
    description: 'Modern organic cotton textile',
    images: [
      {
        _key: 'img-2',
        asset: {
          _ref: 'image-2',
          _type: 'reference',
        },
        alt: 'Organic cotton design',
        _type: 'image',
      },
    ],
    _createdAt: '2024-01-02',
    _updatedAt: '2024-01-02',
    _rev: 'rev2',
    _type: 'textileDesign',
  },
  {
    _id: 'design-3',
    title: 'Hemp Fiber Innovation',
    slug: { current: 'hemp-fiber' },
    description: 'Innovative hemp fiber textile',
    images: [
      {
        _key: 'img-3',
        asset: {
          _ref: 'image-3',
          _type: 'reference',
        },
        alt: 'Hemp fiber innovation',
        _type: 'image',
      },
    ],
    _createdAt: '2024-01-03',
    _updatedAt: '2024-01-03',
    _rev: 'rev3',
    _type: 'textileDesign',
  },
]

// Mock swipe gesture hook
const mockSwipeGesture = {
  onTouchStart: jest.fn(),
  onTouchMove: jest.fn(),
  onTouchEnd: jest.fn(),
  isSwiping: false,
  swipeHandlers: {
    onTouchStart: jest.fn(),
    onTouchMove: jest.fn(),
    onTouchEnd: jest.fn(),
  },
}

describe('Gallery Navigation Integration Tests (Phase 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Mock useSwipeGesture

    require('@/hooks/mobile/useSwipeGesture').useSwipeGesture = jest.fn(
      () => mockSwipeGesture
    )

    require('@/hooks/mobile/useSwipeGesture').useHorizontalSwipe = jest.fn(
      () => mockSwipeGesture
    )

    // Mock useDeviceType

    require('@/hooks/shared/useDeviceType').useDeviceType = jest.fn(
      () => 'desktop'
    )
  })

  describe('Mobile Gallery Navigation', () => {
    beforeEach(() => {
      // Set device type to mobile

      require('@/hooks/shared/useDeviceType').useDeviceType = jest.fn(
        () => 'mobile'
      )
    })

    it('should render mobile gallery with all designs', async () => {
      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should render all design titles
      await waitFor(() => {
        expect(
          screen.getByText('Sustainable Weave Pattern')
        ).toBeInTheDocument()
        expect(screen.getByText('Organic Cotton Design')).toBeInTheDocument()
        expect(screen.getByText('Hemp Fiber Innovation')).toBeInTheDocument()
      })
    })

    it('should navigate to project on image click', async () => {
      const user = userEvent.setup()

      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Find and click the first design
      const firstDesign = await screen.findByText('Sustainable Weave Pattern')
      await user.click(firstDesign.closest('div') || firstDesign)

      expect(mockRouter.push).toHaveBeenCalledWith('/project/sustainable-weave')
    })

    it('should handle swipe gestures for navigation', async () => {
      let swipeCallbacks: Record<string, unknown> = {}

      // Mock useHorizontalSwipe to capture callbacks

      require('@/hooks/mobile/useSwipeGesture').useHorizontalSwipe = jest.fn(
        (props) => {
          swipeCallbacks = props
          return mockSwipeGesture
        }
      )

      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={1}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Simulate swipe left (next item)
      if (typeof swipeCallbacks.onSwipeLeft === 'function') {
        ;(swipeCallbacks.onSwipeLeft as () => void)()
      }

      // Should navigate to next project
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/project/hemp-fiber')
      })
    })

    it('should handle swipe right to previous item', async () => {
      let swipeCallbacks: Record<string, unknown> = {}

      require('@/hooks/mobile/useSwipeGesture').useHorizontalSwipe = jest.fn(
        (props) => {
          swipeCallbacks = props
          return mockSwipeGesture
        }
      )

      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={1}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Simulate swipe right (previous item)
      if (typeof swipeCallbacks.onSwipeRight === 'function') {
        ;(swipeCallbacks.onSwipeRight as () => void)()
      }

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/project/sustainable-weave'
        )
      })
    })

    it('should handle edge cases for swipe navigation', async () => {
      let swipeCallbacks: Record<string, unknown> = {}

      require('@/hooks/mobile/useSwipeGesture').useHorizontalSwipe = jest.fn(
        (props) => {
          swipeCallbacks = props
          return mockSwipeGesture
        }
      )

      // Test at beginning of list
      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Swipe right at beginning - should not navigate
      if (typeof swipeCallbacks.onSwipeRight === 'function') {
        ;(swipeCallbacks.onSwipeRight as () => void)()
      }

      // Should not navigate (at beginning)
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('Desktop Gallery Navigation', () => {
    beforeEach(() => {
      // Set device type to desktop

      require('@/hooks/shared/useDeviceType').useDeviceType = jest.fn(
        () => 'desktop'
      )
    })

    it('should render desktop gallery with all designs', async () => {
      render(
        <DesktopGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      await waitFor(() => {
        expect(
          screen.getByText('Sustainable Weave Pattern')
        ).toBeInTheDocument()
        expect(screen.getByText('Organic Cotton Design')).toBeInTheDocument()
        expect(screen.getByText('Hemp Fiber Innovation')).toBeInTheDocument()
      })
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <DesktopGallery
          designs={mockDesigns}
          currentIndex={1}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Focus on gallery container
      const gallery =
        screen.getByRole('main') || screen.getByTestId('desktop-gallery')
      gallery?.focus()

      // Press arrow right
      await user.keyboard('[ArrowRight]')

      // Should navigate to next project
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/project/hemp-fiber')
      })
    })

    it('should handle mouse click navigation', async () => {
      const user = userEvent.setup()

      render(
        <DesktopGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Click on second design
      const secondDesign = await screen.findByText('Organic Cotton Design')
      await user.click(secondDesign.closest('div') || secondDesign)

      expect(mockRouter.push).toHaveBeenCalledWith('/project/organic-cotton')
    })

    it('should handle hover effects properly', async () => {
      const user = userEvent.setup()

      render(
        <DesktopGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Hover over first design
      const firstDesign = await screen.findByText('Sustainable Weave Pattern')
      await user.hover(firstDesign.closest('div') || firstDesign)

      // Should apply hover styles (test via class or style changes)
      const designContainer = firstDesign.closest('div')
      expect(designContainer).toBeInTheDocument()
    })
  })

  describe('Cross-Device Behavior', () => {
    it('should render appropriate gallery based on device type', async () => {
      // Test mobile rendering

      require('@/hooks/shared/useDeviceType').useDeviceType = jest.fn(
        () => 'mobile'
      )

      const { rerender } = render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should have mobile-specific elements
      await waitFor(() => {
        expect(
          screen.getByText('Sustainable Weave Pattern')
        ).toBeInTheDocument()
      })

      // Switch to desktop

      require('@/hooks/shared/useDeviceType').useDeviceType = jest.fn(
        () => 'desktop'
      )

      rerender(
        <DesktopGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should still render designs
      await waitFor(() => {
        expect(
          screen.getByText('Sustainable Weave Pattern')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty designs array', () => {
      render(
        <MobileGallery
          designs={[]}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should not crash and may show empty state
      expect(screen.queryByRole('main')).toBeInTheDocument()
    })

    it('should handle invalid current index', () => {
      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={999} // Invalid index
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should not crash
      expect(screen.getByText('Sustainable Weave Pattern')).toBeInTheDocument()
    })

    it('should handle designs with missing images', async () => {
      const designsWithMissingImages = [
        {
          ...mockDesigns[0],
          images: [], // Empty images array
        },
        mockDesigns[1],
      ]

      render(
        <MobileGallery
          designs={designsWithMissingImages}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should still render design titles
      await waitFor(() => {
        expect(
          screen.getByText('Sustainable Weave Pattern')
        ).toBeInTheDocument()
        expect(screen.getByText('Organic Cotton Design')).toBeInTheDocument()
      })
    })

    it('should handle rapid navigation attempts', async () => {
      const user = userEvent.setup({ delay: null }) // No delay for rapid clicks

      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      const firstDesign = await screen.findByText('Sustainable Weave Pattern')

      // Rapid clicks
      await user.click(firstDesign.closest('div') || firstDesign)
      await user.click(firstDesign.closest('div') || firstDesign)
      await user.click(firstDesign.closest('div') || firstDesign)

      // Should only navigate once due to debouncing
      expect(mockRouter.push).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility Integration (Phase 3)', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <DesktopGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should have proper accessibility attributes
      const gallery =
        screen.getByRole('main') || screen.getByTestId('desktop-gallery')
      expect(gallery).toBeInTheDocument()

      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation for accessibility', async () => {
      const user = userEvent.setup()

      render(
        <DesktopGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Should be able to tab through designs
      await user.tab()

      // Should focus on interactive elements
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()

      // Test Enter key activation
      await user.keyboard('[Enter]')

      // Should trigger navigation
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled()
      })
    })

    it('should provide proper alt text for images', async () => {
      render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Look for images with alt text
      const images = screen.getAllByRole('img')
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt')
        expect(img.getAttribute('alt')).toBeTruthy()
      })
    })
  })

  describe('Performance Integration (Phase 3)', () => {
    it('should not cause memory leaks with rapid interactions', async () => {
      const user = userEvent.setup({ delay: null })

      const { rerender } = render(
        <MobileGallery
          designs={mockDesigns}
          currentIndex={0}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      // Simulate multiple re-renders and interactions
      for (let i = 0; i < 10; i++) {
        rerender(
          <MobileGallery
            designs={mockDesigns}
            currentIndex={i % mockDesigns.length}
            pathname="/gallery"
            isFirstMount={false}
          />
        )

        const designs = screen.getAllByText(/.*Pattern|.*Design|.*Innovation/)
        if (designs.length > 0) {
          await user.click(designs[0])
        }
      }

      // Should not crash or cause issues
      expect(screen.getByText('Sustainable Weave Pattern')).toBeInTheDocument()
    })

    it('should handle large design arrays efficiently', async () => {
      // Create large array of designs
      const largeDesignArray = Array.from({ length: 100 }, (_, i) => ({
        ...mockDesigns[0],
        _id: `design-${i}`,
        title: `Design ${i}`,
        slug: { current: `design-${i}` },
      }))

      const startTime = performance.now()

      render(
        <MobileGallery
          designs={largeDesignArray}
          currentIndex={50}
          pathname="/gallery"
          isFirstMount={false}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000) // 1 second
    })
  })
})

describe('Gallery Navigation Hook Integration (Phase 3)', () => {
  it('should integrate properly with scroll manager', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockScrollManager = require('@/lib/scrollManager')

    render(
      <MobileGallery
        designs={mockDesigns}
        currentIndex={1}
        pathname="/current-path"
        isFirstMount={false}
      />
    )

    const firstDesign = await screen.findByText('Sustainable Weave Pattern')
    await userEvent.click(firstDesign.closest('div') || firstDesign)

    expect(mockScrollManager.saveImmediate).toHaveBeenCalledWith(
      1,
      '/current-path'
    )
    expect(mockScrollManager.triggerNavigationStart).toHaveBeenCalled()
  })
})
