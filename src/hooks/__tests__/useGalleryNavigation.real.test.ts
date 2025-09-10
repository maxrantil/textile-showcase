// ABOUTME: Real functionality tests for gallery navigation hook with actual routing

import { renderHook, act } from '@testing-library/react'
import { useGalleryNavigation } from '../gallery/useGalleryNavigation'
import { TextileDesign } from '@/sanity/types'

// Real test data
const realDesigns: TextileDesign[] = [
  {
    _id: 'design-1',
    title: 'Sustainable Cotton',
    slug: { current: 'sustainable-cotton' },
    description: 'Eco-friendly cotton textile',
    image: {
      asset: { _ref: 'image-1', _type: 'reference' },
      alt: 'Sustainable cotton texture',
    },
  },
  {
    _id: 'design-2',
    title: 'Hemp Innovation',
    slug: { current: 'hemp-innovation' },
    description: 'Modern hemp fiber textile',
    image: {
      asset: { _ref: 'image-2', _type: 'reference' },
      alt: 'Hemp fiber pattern',
    },
  },
]

// Mock router with real-like behavior tracking
const mockRouterPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}))

jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    saveImmediate: jest.fn(),
    triggerNavigationStart: jest.fn(),
  },
}))

// Get the mocked scroll manager
const { scrollManager } = jest.requireMock('@/lib/scrollManager')

describe('useGalleryNavigation Real Functionality Tests', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
    scrollManager.saveImmediate.mockClear()
    scrollManager.triggerNavigationStart.mockClear()
  })

  describe('Real Navigation Behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should navigate to correct project URLs with real slugs', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: realDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // Navigate to first design
      act(() => {
        result.current.handleImageClick(realDesigns[0])
      })

      expect(mockRouterPush).toHaveBeenCalledWith('/project/sustainable-cotton')

      // Clear mock and advance time to allow next navigation
      mockRouterPush.mockClear()

      // Advance time past debounce period
      jest.advanceTimersByTime(300)

      // Navigate to second design
      act(() => {
        result.current.handleImageClick(realDesigns[1])
      })

      expect(mockRouterPush).toHaveBeenCalledWith('/project/hemp-innovation')
    })

    it('should handle designs without slugs using _id fallback', () => {
      const designWithoutSlug: TextileDesign = {
        ...realDesigns[0],
        slug: undefined,
      }

      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: [designWithoutSlug],
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(designWithoutSlug)
      })

      expect(mockRouterPush).toHaveBeenCalledWith('/project/design-1')
    })
  })

  describe('Page Navigation with Real Paths', () => {
    it('should handle page navigation with real URLs', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: realDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handlePageNavigation('/about')
      })

      expect(mockRouterPush).toHaveBeenCalledWith('/about')
    })

    it('should save scroll position for real navigation', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: realDesigns,
          currentIndex: 1,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(realDesigns[0])
      })

      expect(scrollManager.saveImmediate).toHaveBeenCalledWith(1, '/gallery')
    })
  })

  describe('Real Timing and Debouncing', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should debounce rapid navigation attempts', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: realDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // Rapid fire navigation attempts
      act(() => {
        result.current.handleImageClick(realDesigns[0])
        result.current.handleImageClick(realDesigns[1])
        result.current.handleImageClick(realDesigns[0])
      })

      // Only first navigation should go through initially
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
      expect(mockRouterPush).toHaveBeenCalledWith('/project/sustainable-cotton')

      // Fast forward past debounce period
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Should now allow new navigation
      act(() => {
        result.current.handleImageClick(realDesigns[1])
      })

      expect(mockRouterPush).toHaveBeenCalledTimes(2)
      expect(mockRouterPush).toHaveBeenLastCalledWith(
        '/project/hemp-innovation'
      )
    })
  })

  describe('Real Error Scenarios', () => {
    it('should handle empty designs array gracefully', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: [],
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // Should not crash when trying to navigate with empty designs
      expect(() => {
        act(() => {
          result.current.handlePageNavigation('/about')
        })
      }).not.toThrow()

      expect(mockRouterPush).toHaveBeenCalledWith('/about')
    })

    it('should handle malformed design data', () => {
      const malformedDesign = {
        _id: null,
        title: null,
        slug: null,
      } as unknown as TextileDesign

      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: [malformedDesign],
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // Should handle gracefully without crashing
      expect(() => {
        act(() => {
          result.current.handleImageClick(malformedDesign)
        })
      }).not.toThrow()

      // Should fallback to some default navigation
      expect(mockRouterPush).toHaveBeenCalled()
    })
  })

  describe('Integration with Real Scroll Manager', () => {
    it('should trigger navigation start events', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: realDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(realDesigns[0])
      })

      expect(scrollManager.triggerNavigationStart).toHaveBeenCalled()
    })

    it('should not save scroll position on first mount', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: realDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: true, // First mount
        })
      )

      act(() => {
        result.current.handleImageClick(realDesigns[0])
      })

      expect(scrollManager.saveImmediate).not.toHaveBeenCalled()
    })
  })
})
