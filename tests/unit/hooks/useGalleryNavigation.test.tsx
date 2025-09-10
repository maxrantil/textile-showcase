// ABOUTME: Gallery navigation hook testing with TDD approach for Phase 3

import { renderHook, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useGalleryNavigation } from '@/hooks/gallery/useGalleryNavigation'
import { scrollManager } from '@/lib/scrollManager'
import { TextileDesign } from '@/sanity/types'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@/lib/scrollManager')

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

const mockScrollManager = {
  saveImmediate: jest.fn(),
  triggerNavigationStart: jest.fn(),
  restore: jest.fn(),
}

// Mock textile designs for testing
const mockDesigns: TextileDesign[] = [
  {
    _id: '1',
    title: 'Design One',
    slug: { current: 'design-one' },
    description: 'Test design 1',
    images: [],
    _createdAt: '2024-01-01',
    _updatedAt: '2024-01-01',
    _rev: 'rev1',
    _type: 'textileDesign',
  },
  {
    _id: '2',
    title: 'Design Two',
    slug: { current: 'design-two' },
    description: 'Test design 2',
    images: [],
    _createdAt: '2024-01-02',
    _updatedAt: '2024-01-02',
    _rev: 'rev2',
    _type: 'textileDesign',
  },
  {
    _id: '3',
    title: 'Design Three',
    slug: null, // Test fallback to _id
    description: 'Test design 3',
    images: [],
    _createdAt: '2024-01-03',
    _updatedAt: '2024-01-03',
    _rev: 'rev3',
    _type: 'textileDesign',
  },
]

describe('useGalleryNavigation Hook (Phase 3 TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(scrollManager as any).saveImmediate = mockScrollManager.saveImmediate
    ;(scrollManager as any).triggerNavigationStart =
      mockScrollManager.triggerNavigationStart

    // Mock Date.now for consistent timing tests
    jest.spyOn(Date, 'now').mockReturnValue(1000)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Image Click Navigation', () => {
    it('should navigate to correct project URL with slug', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      expect(mockScrollManager.triggerNavigationStart).toHaveBeenCalledTimes(1)
      expect(mockScrollManager.saveImmediate).toHaveBeenCalledWith(
        0,
        '/gallery'
      )
      expect(mockRouter.push).toHaveBeenCalledWith('/project/design-one')
    })

    it('should fallback to _id when slug is null', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(mockDesigns[2]) // Has null slug
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/project/3')
    })

    it('should not save scroll position on first mount', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 2,
          pathname: '/gallery',
          isFirstMount: true,
        })
      )

      act(() => {
        result.current.handleImageClick(mockDesigns[1])
      })

      expect(mockScrollManager.saveImmediate).not.toHaveBeenCalled()
      expect(mockScrollManager.triggerNavigationStart).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).toHaveBeenCalledWith('/project/design-two')
    })
  })

  describe('Click Debouncing (Phase 3 - Performance)', () => {
    it('should debounce rapid clicks on same design', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      const design = mockDesigns[0]

      // First click
      act(() => {
        result.current.handleImageClick(design)
      })

      // Immediate second click on same design (should be debounced)
      jest.spyOn(Date, 'now').mockReturnValue(1100) // 100ms later

      act(() => {
        result.current.handleImageClick(design)
      })

      // Should only navigate once
      expect(mockRouter.push).toHaveBeenCalledTimes(1)
    })

    it('should allow clicks on different designs with shorter debounce', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // First click
      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      // Click on different design after 150ms (should work)
      jest.spyOn(Date, 'now').mockReturnValue(1150)

      act(() => {
        result.current.handleImageClick(mockDesigns[1])
      })

      expect(mockRouter.push).toHaveBeenCalledTimes(2)
      expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/project/design-one')
      expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/project/design-two')
    })

    it('should allow clicks on same design after debounce period', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      const design = mockDesigns[0]

      // First click
      act(() => {
        result.current.handleImageClick(design)
      })

      // Wait longer than debounce period (200ms for same design)
      jest.spyOn(Date, 'now').mockReturnValue(1250)

      act(() => {
        result.current.handleImageClick(design)
      })

      expect(mockRouter.push).toHaveBeenCalledTimes(2)
    })
  })

  describe('Page Navigation', () => {
    it('should handle basic page navigation', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 1,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handlePageNavigation('/about')
      })

      expect(mockScrollManager.triggerNavigationStart).toHaveBeenCalledTimes(1)
      expect(mockScrollManager.saveImmediate).toHaveBeenCalledWith(
        1,
        '/gallery'
      )
      expect(mockRouter.push).toHaveBeenCalledWith('/about')
    })

    it('should not save scroll position on first mount for page navigation', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 1,
          pathname: '/gallery',
          isFirstMount: true,
        })
      )

      act(() => {
        result.current.handlePageNavigation('/contact')
      })

      expect(mockScrollManager.saveImmediate).not.toHaveBeenCalled()
      expect(mockScrollManager.triggerNavigationStart).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).toHaveBeenCalledWith('/contact')
    })

    it('should debounce page navigation', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // First navigation
      act(() => {
        result.current.handlePageNavigation('/about')
      })

      // Immediate second navigation (should be debounced)
      jest.spyOn(Date, 'now').mockReturnValue(1100) // 100ms later

      act(() => {
        result.current.handlePageNavigation('/contact')
      })

      // Should only navigate once
      expect(mockRouter.push).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).toHaveBeenCalledWith('/about')
    })

    it('should allow page navigation after debounce period', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // First navigation
      act(() => {
        result.current.handlePageNavigation('/about')
      })

      // Wait longer than debounce period (150ms)
      jest.spyOn(Date, 'now').mockReturnValue(1200)

      act(() => {
        result.current.handlePageNavigation('/contact')
      })

      expect(mockRouter.push).toHaveBeenCalledTimes(2)
      expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/about')
      expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/contact')
    })
  })

  describe('Scroll Management Integration', () => {
    it('should save correct current index and pathname', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 2,
          pathname: '/projects',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      expect(mockScrollManager.saveImmediate).toHaveBeenCalledWith(
        2,
        '/projects'
      )
    })

    it('should trigger navigation start for all navigation types', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      act(() => {
        result.current.handlePageNavigation('/about')
      })

      expect(mockScrollManager.triggerNavigationStart).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling and Edge Cases (Phase 3)', () => {
    it('should handle design without slug gracefully', () => {
      const designWithoutSlug = {
        ...mockDesigns[0],
        slug: undefined,
      } as TextileDesign

      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(designWithoutSlug)
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/project/1') // Falls back to _id
    })

    it('should handle rapid alternating clicks correctly', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // Click design 1
      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      // Immediately click design 2 (should work - different design)
      jest.spyOn(Date, 'now').mockReturnValue(1050)

      act(() => {
        result.current.handleImageClick(mockDesigns[1])
      })

      // Immediately click design 1 again (should work - different design)
      jest.spyOn(Date, 'now').mockReturnValue(1100)

      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      expect(mockRouter.push).toHaveBeenCalledTimes(3)
    })

    it('should handle empty designs array gracefully', () => {
      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: [],
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      // Should not throw error
      expect(result.current.handleImageClick).toBeInstanceOf(Function)
      expect(result.current.handlePageNavigation).toBeInstanceOf(Function)
    })
  })

  describe('Development Environment Logging', () => {
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
      jest.restoreAllMocks()
    })

    it('should log navigation in development mode', () => {
      process.env.NODE_ENV = 'development'

      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      expect(console.log).toHaveBeenCalledWith(
        '🖱️ Navigating to project:',
        'Design One'
      )
    })

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production'

      const { result } = renderHook(() =>
        useGalleryNavigation({
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        })
      )

      act(() => {
        result.current.handleImageClick(mockDesigns[0])
      })

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Navigating to project')
      )
    })
  })
})

describe('Hook Integration and Performance (Phase 3)', () => {
  it('should maintain stable function references across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useGalleryNavigation({
        designs: mockDesigns,
        currentIndex: 0,
        pathname: '/gallery',
        isFirstMount: false,
      })
    )

    const firstRender = {
      handleImageClick: result.current.handleImageClick,
      handlePageNavigation: result.current.handlePageNavigation,
    }

    // Re-render with same props
    rerender()

    const secondRender = {
      handleImageClick: result.current.handleImageClick,
      handlePageNavigation: result.current.handlePageNavigation,
    }

    // Functions should be stable (same reference)
    expect(firstRender.handleImageClick).toBe(secondRender.handleImageClick)
    expect(firstRender.handlePageNavigation).toBe(
      secondRender.handlePageNavigation
    )
  })

  it('should handle prop changes correctly', () => {
    const { result, rerender } = renderHook(
      (props) => useGalleryNavigation(props),
      {
        initialProps: {
          designs: mockDesigns,
          currentIndex: 0,
          pathname: '/gallery',
          isFirstMount: false,
        },
      }
    )

    act(() => {
      result.current.handleImageClick(mockDesigns[0])
    })

    expect(mockScrollManager.saveImmediate).toHaveBeenCalledWith(0, '/gallery')

    // Change props
    rerender({
      designs: mockDesigns,
      currentIndex: 2,
      pathname: '/projects',
      isFirstMount: false,
    })

    act(() => {
      result.current.handleImageClick(mockDesigns[1])
    })

    expect(mockScrollManager.saveImmediate).toHaveBeenCalledWith(2, '/projects')
  })
})
