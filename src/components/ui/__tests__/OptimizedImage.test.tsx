// ABOUTME: Comprehensive unit tests for OptimizedImage component - TDD baseline (Phase 0)
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OptimizedImage } from '../OptimizedImage'
import type { ImageSource } from '@/types/textile'
import * as imageHelpers from '@/utils/image-helpers'
import * as imageOptimization from '@/utils/image-optimization'

interface ImageUrlOptions {
  width: number
  height: number
  quality: number
  format: string
}

interface MockImageProps {
  [key: string]: unknown
}

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: MockImageProps) {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock image helpers
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn(
    (src: ImageSource, options: ImageUrlOptions) =>
      `https://cdn.sanity.io/images/test/${options.format || 'auto'}?w=${options.width}&h=${options.height}&q=${options.quality}`
  ),
}))

// Mock image optimization utilities
jest.mock('@/utils/image-optimization', () => ({
  getImagePriority: jest.fn((imageType: string, isAboveFold: boolean) => {
    if (imageType === 'hero' || imageType === 'critical' || isAboveFold)
      return 'high'
    if (imageType === 'thumbnail' || imageType === 'deferred') return 'low'
    return 'auto'
  }),
  shouldPreloadImage: jest.fn((imageType: string, isAboveFold: boolean) => {
    return imageType === 'hero' || imageType === 'critical' || isAboveFold
  }),
  getOptimizedObserverConfig: jest.fn(() => ({
    rootMargin: '200px',
    threshold: 0.01,
  })),
}))

// Mock Loading Spinner
jest.mock('../LoadingSpinner', () => ({
  ImageLoadingPlaceholder: function MockPlaceholder({
    width,
    height,
  }: {
    width: string
    height: string
  }) {
    return <div data-testid="loading-placeholder" style={{ width, height }} />
  },
}))

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements: Set<Element>

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    this.elements = new Set()
  }

  observe(element: Element) {
    this.elements.add(element)
  }

  unobserve(element: Element) {
    this.elements.delete(element)
  }

  disconnect() {
    this.elements.clear()
  }

  // Utility method for testing
  triggerIntersection(isIntersecting: boolean) {
    const entries = Array.from(this.elements).map((element) => ({
      target: element,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    }))
    this.callback(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver
    )
  }
}

const mockImageSource: ImageSource = {
  asset: {
    _ref: 'image-test-123',
    _type: 'reference',
  },
  _type: 'image',
}

describe('OptimizedImage Component - Phase 0 TDD Baseline', () => {
  let intersectionObserverInstance: MockIntersectionObserver | null = null

  beforeEach(() => {
    // Setup IntersectionObserver mock
    global.IntersectionObserver = jest.fn((callback) => {
      intersectionObserverInstance = new MockIntersectionObserver(callback)
      return intersectionObserverInstance as unknown as IntersectionObserver
    }) as unknown as typeof IntersectionObserver

    // Clear all mocks
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    intersectionObserverInstance = null
  })

  // ========================================
  // Core Rendering Tests (5 tests)
  // ========================================

  describe('Core Rendering', () => {
    it('renders with required props only (alt and src)', () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" />)
      expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument()
    })

    it('renders null src gracefully without crashing', () => {
      render(<OptimizedImage src={null} alt="Test image" />)
      expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument()
    })

    it('renders undefined src gracefully without crashing', () => {
      render(<OptimizedImage src={undefined} alt="Test image" />)
      expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument()
    })

    it('applies custom className to wrapper div', () => {
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          className="custom-class"
        />
      )
      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass('relative')
    })

    it('applies custom styles to wrapper div', () => {
      const customStyle = { marginTop: '10px', border: '1px solid red' }
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          style={customStyle}
        />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle(customStyle)
    })
  })

  // ========================================
  // Intersection Observer Lazy Loading Tests (7 tests)
  // ========================================

  describe('Intersection Observer Lazy Loading', () => {
    it('creates IntersectionObserver when priority is false', () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" />)
      expect(global.IntersectionObserver).toHaveBeenCalled()
    })

    it('does not create IntersectionObserver when priority is true', () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)
      // IntersectionObserver is not called because priority=true bypasses lazy loading
      expect(global.IntersectionObserver).not.toHaveBeenCalled()
    })

    it('loads image when IntersectionObserver triggers', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" />)

      // Initially no image should be rendered
      expect(screen.queryByAltText('Test image')).not.toBeInTheDocument()

      // Trigger intersection
      act(() => {
        intersectionObserverInstance?.triggerIntersection(true)
      })

      // Image should now be rendered
      await waitFor(() => {
        expect(screen.getByAltText('Test image')).toBeInTheDocument()
      })
    })

    it('disconnects observer after intersection', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" />)

      const disconnectSpy = jest.spyOn(
        intersectionObserverInstance!,
        'disconnect'
      )

      act(() => {
        intersectionObserverInstance?.triggerIntersection(true)
      })

      await waitFor(() => {
        expect(disconnectSpy).toHaveBeenCalled()
      })
    })

    it('loads image immediately if IntersectionObserver is undefined', () => {
      // Remove IntersectionObserver
      // @ts-expect-error - Intentionally testing undefined IntersectionObserver
      global.IntersectionObserver = undefined

      render(<OptimizedImage src={mockImageSource} alt="Test image" />)

      // Image should load immediately
      expect(screen.getByAltText('Test image')).toBeInTheDocument()
    })

    it('triggers fallback timeout after 3 seconds if observer does not trigger', () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" />)

      // Initially no image
      expect(screen.queryByAltText('Test image')).not.toBeInTheDocument()

      // Fast-forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // Image should now be rendered
      expect(screen.getByAltText('Test image')).toBeInTheDocument()
    })

    it('clears timeout when observer triggers before 3 seconds', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" />)

      // Trigger intersection after 1 second
      act(() => {
        jest.advanceTimersByTime(1000)
        intersectionObserverInstance?.triggerIntersection(true)
      })

      await waitFor(() => {
        expect(screen.getByAltText('Test image')).toBeInTheDocument()
      })

      // Fast-forward remaining time
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // Should not trigger multiple times
      expect(screen.getAllByAltText('Test image')).toHaveLength(1)
    })
  })

  // ========================================
  // Error Handling & Fallback Tests (3 tests)
  // ========================================

  describe('Error Handling & Fallback', () => {
    it('displays error UI when image fails to load', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')

      // Trigger first error (tries fallback)
      act(() => {
        fireEvent.error(img)
      })

      // Wait for fallback to be applied
      await waitFor(() => {
        const imgAfterFirstError = screen.queryByAltText('Test image')
        if (imgAfterFirstError) {
          fireEvent.error(imgAfterFirstError)
        }
      })

      // Now error UI should be visible
      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('attempts fallback JPG format when primary format fails', async () => {
      const mockGetOptimizedImageUrl =
        imageHelpers.getOptimizedImageUrl as jest.Mock

      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')

      // Trigger first error (should try fallback)
      act(() => {
        fireEvent.error(img)
      })

      await waitFor(() => {
        // Check that getOptimizedImageUrl was called with 'jpg' format
        const callsWithJpg = mockGetOptimizedImageUrl.mock.calls.filter(
          (call: [ImageSource, ImageUrlOptions]) => call[1].format === 'jpg'
        )
        expect(callsWithJpg.length).toBeGreaterThan(0)
      })
    })

    it('shows error UI when both primary and fallback formats fail', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')

      // Trigger first error (tries fallback)
      act(() => {
        fireEvent.error(img)
      })

      // Trigger second error (fallback also fails)
      await waitFor(() => {
        const imgAfterFirstError = screen.getByAltText('Test image')
        fireEvent.error(imgAfterFirstError)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument()
      })
    })
  })

  // ========================================
  // Priority Detection Logic Tests (5 tests)
  // ========================================

  describe('Priority Detection Logic', () => {
    it('uses high priority for hero imageType', () => {
      const mockGetImagePriority =
        imageOptimization.getImagePriority as jest.Mock

      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Hero image"
          imageType="hero"
        />
      )

      expect(mockGetImagePriority).toHaveBeenCalledWith('hero', false)
    })

    it('uses high priority for critical imageType', () => {
      const mockGetImagePriority =
        imageOptimization.getImagePriority as jest.Mock

      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Critical image"
          imageType="critical"
        />
      )

      expect(mockGetImagePriority).toHaveBeenCalledWith('critical', false)
    })

    it('uses high priority when isAboveFold is true', () => {
      const mockGetImagePriority =
        imageOptimization.getImagePriority as jest.Mock

      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Above fold image"
          isAboveFold
        />
      )

      expect(mockGetImagePriority).toHaveBeenCalledWith('gallery', true)
    })

    it('uses low priority for thumbnail imageType', () => {
      const mockGetImagePriority =
        imageOptimization.getImagePriority as jest.Mock

      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Thumbnail image"
          imageType="thumbnail"
        />
      )

      expect(mockGetImagePriority).toHaveBeenCalledWith('thumbnail', false)
    })

    it('uses auto priority for gallery imageType by default', () => {
      const mockGetImagePriority =
        imageOptimization.getImagePriority as jest.Mock

      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Gallery image"
          imageType="gallery"
        />
      )

      expect(mockGetImagePriority).toHaveBeenCalledWith('gallery', false)
    })
  })

  // ========================================
  // Loading States Tests (2 tests)
  // ========================================

  describe('Loading States', () => {
    it('shows loading placeholder initially', () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument()
    })

    it('hides loading placeholder after image loads', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')

      act(() => {
        fireEvent.load(img)
      })

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-placeholder')
        ).not.toBeInTheDocument()
      })
    })
  })

  // ========================================
  // Accessibility Tests (7 tests)
  // ========================================

  describe('Accessibility', () => {
    it('applies aria-label when onClick is provided', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('aria-label', 'View Clickable image')
    })

    it('applies alt text as aria-label when onClick is not provided', () => {
      const { container } = render(
        <OptimizedImage src={mockImageSource} alt="Static image" />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('aria-label', 'Static image')
    })

    it('applies role="button" when onClick is provided', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('role', 'button')
    })

    it('applies tabIndex={0} when onClick is provided', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('tabIndex', '0')
    })

    it('calls onClick when Enter key is pressed', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement

      act(() => {
        fireEvent.keyDown(wrapper, { key: 'Enter', code: 'Enter' })
      })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onClick when Space key is pressed', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement

      act(() => {
        fireEvent.keyDown(wrapper, { key: ' ', code: 'Space' })
      })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not apply interactive attributes when onClick is not provided', () => {
      const { container } = render(
        <OptimizedImage src={mockImageSource} alt="Static image" />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).not.toHaveAttribute('role')
      expect(wrapper).not.toHaveAttribute('tabIndex')
    })
  })

  // ========================================
  // Debug Overlays Tests (2 tests - DEV mode)
  // ========================================

  describe('Debug Overlays (Development Mode)', () => {
    const originalNodeEnv = process.env.NODE_ENV

    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      })
    })

    it('shows priority debug overlay in development mode', () => {
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          imageType="hero"
          priority
        />
      )

      const debugOverlay = container.querySelector(
        'div[style*="position: absolute"]'
      )
      expect(debugOverlay).toHaveTextContent('HIGH')
    })

    it('shows fallback debug overlay when fallback format is used', async () => {
      const { container } = render(
        <OptimizedImage src={mockImageSource} alt="Test image" priority />
      )

      const img = screen.getByAltText('Test image')

      // Trigger error to use fallback
      act(() => {
        fireEvent.error(img)
      })

      await waitFor(() => {
        const fallbackOverlay = Array.from(
          container.querySelectorAll('div[style*="position: absolute"]')
        ).find((el) => el.textContent === 'FALLBACK')

        expect(fallbackOverlay).toBeInTheDocument()
      })
    })
  })

  // ========================================
  // Fade-in Animation Tests (3 tests)
  // ========================================

  describe('Fade-in Animation', () => {
    it('applies opacity 0 initially before image loads', () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')
      expect(img).toHaveStyle({ opacity: 0 })
    })

    it('applies opacity 1 after image loads', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')

      act(() => {
        fireEvent.load(img)
      })

      await waitFor(() => {
        expect(img).toHaveStyle({ opacity: 1 })
      })
    })

    it('applies cubic-bezier transition for smooth fade-in', () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')
      expect(img).toHaveStyle({
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      })
    })
  })

  // ========================================
  // URL Generation Tests (3 tests)
  // ========================================

  describe('URL Generation', () => {
    it('generates primary image URL with auto format', () => {
      const mockGetOptimizedImageUrl =
        imageHelpers.getOptimizedImageUrl as jest.Mock

      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          width={1000}
          height={800}
          quality={90}
          priority
        />
      )

      expect(mockGetOptimizedImageUrl).toHaveBeenCalledWith(mockImageSource, {
        width: 1000,
        height: 800,
        quality: 90,
        format: 'auto',
      })
    })

    it('generates fallback URL with JPG format and lower quality', () => {
      const mockGetOptimizedImageUrl =
        imageHelpers.getOptimizedImageUrl as jest.Mock

      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          width={1000}
          height={800}
          quality={90}
          priority
        />
      )

      const jpgCalls = mockGetOptimizedImageUrl.mock.calls.filter(
        (call: [ImageSource, ImageUrlOptions]) =>
          call[1].format === 'jpg' && call[1].quality === 80
      )

      expect(jpgCalls.length).toBeGreaterThan(0)
    })

    it('generates blur placeholder with small dimensions and low quality', () => {
      const mockGetOptimizedImageUrl =
        imageHelpers.getOptimizedImageUrl as jest.Mock

      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      expect(mockGetOptimizedImageUrl).toHaveBeenCalledWith(
        mockImageSource,
        expect.objectContaining({
          width: 20,
          height: 15,
          quality: 20,
          format: 'jpg',
        })
      )
    })
  })

  // ========================================
  // Edge Cases & Props Tests (8+ tests)
  // ========================================

  describe('Edge Cases & Props', () => {
    it('handles fill mode correctly', () => {
      const { container } = render(
        <OptimizedImage src={mockImageSource} alt="Test image" fill priority />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '100%', height: '100%' })

      // Note: Next.js Image component handles 'fill' internally, not as a DOM attribute
      // We verify fill mode by checking wrapper styles
      const img = screen.getByAltText('Test image')
      expect(img).toBeInTheDocument()
    })

    it('handles fixed dimensions correctly', () => {
      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          width={500}
          height={400}
          priority
        />
      )

      const img = screen.getByAltText('Test image')
      expect(img).toHaveAttribute('width', '500')
      expect(img).toHaveAttribute('height', '400')
    })

    it('applies objectFit style correctly', () => {
      render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          objectFit="cover"
          priority
        />
      )

      const img = screen.getByAltText('Test image')
      expect(img).toHaveStyle({ objectFit: 'cover' })
    })

    it('applies data-image-type attribute', () => {
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Test image"
          imageType="hero"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('data-image-type', 'hero')
    })

    it('applies data-size="large" for width > 600', () => {
      const { container } = render(
        <OptimizedImage src={mockImageSource} alt="Test image" width={800} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('data-size', 'large')
    })

    it('applies data-size="small" for width <= 600', () => {
      const { container } = render(
        <OptimizedImage src={mockImageSource} alt="Test image" width={500} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('data-size', 'small')
    })

    it('handles retry button click correctly', async () => {
      render(<OptimizedImage src={mockImageSource} alt="Test image" priority />)

      const img = screen.getByAltText('Test image')

      // Trigger error twice to show error UI
      act(() => {
        fireEvent.error(img)
      })

      await waitFor(() => {
        const imgAfterFirstError = screen.getByAltText('Test image')
        fireEvent.error(imgAfterFirstError)
      })

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')

      act(() => {
        fireEvent.click(retryButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('Retry')).not.toBeInTheDocument()
        expect(screen.getByAltText('Test image')).toBeInTheDocument()
      })
    })

    it('stops click propagation on retry button', async () => {
      const outerClick = jest.fn()
      render(
        <div onClick={outerClick}>
          <OptimizedImage src={mockImageSource} alt="Test image" priority />
        </div>
      )

      const img = screen.getByAltText('Test image')

      // Trigger errors to show retry button
      act(() => {
        fireEvent.error(img)
      })

      await waitFor(() => {
        const imgAfterFirstError = screen.getByAltText('Test image')
        fireEvent.error(imgAfterFirstError)
      })

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')

      act(() => {
        fireEvent.click(retryButton)
      })

      expect(outerClick).not.toHaveBeenCalled()
    })
  })

  // ========================================
  // Interaction Tests (2 tests)
  // ========================================

  describe('Interaction', () => {
    it('calls onClick handler when image is clicked', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement

      act(() => {
        fireEvent.click(wrapper)
      })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('prevents default event when onClick is called', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <OptimizedImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement

      const clickEvent = new MouseEvent('click', { bubbles: true })
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault')

      act(() => {
        wrapper.dispatchEvent(clickEvent)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  // ========================================
  // Cleanup Tests (1 test)
  // ========================================

  describe('Cleanup', () => {
    it('cleans up observer and timeout on unmount', () => {
      const { unmount } = render(
        <OptimizedImage src={mockImageSource} alt="Test image" />
      )

      const disconnectSpy = jest.spyOn(
        intersectionObserverInstance!,
        'disconnect'
      )

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()
    })
  })
})
