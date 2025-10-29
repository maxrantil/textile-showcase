// ABOUTME: Test suite for ScrollToTopButton - Dual scroll detection button component with visibility management

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScrollToTopButton } from '../ScrollToTopButton'

describe('ScrollToTopButton', () => {
  let containerRef: React.RefObject<HTMLDivElement>
  let mockContainer: HTMLDivElement

  beforeEach(() => {
    // Create a real container element
    mockContainer = document.createElement('div')
    containerRef = { current: mockContainer }

    // Mock scrollTo for both window and container
    window.scrollTo = jest.fn()
    mockContainer.scrollTo = jest.fn()

    // Reset scroll positions
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })

    Object.defineProperty(mockContainer, 'scrollTop', {
      writable: true,
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_not_render_when_scroll_below_threshold', () => {
      render(<ScrollToTopButton containerRef={containerRef} />)

      const button = screen.queryByLabelText('Scroll to top')
      expect(button).not.toBeInTheDocument()
    })

    it('should_render_when_scroll_above_threshold', () => {
      // Set window scroll above threshold
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      // Trigger scroll event
      fireEvent.scroll(window)

      waitFor(() => {
        const button = screen.getByLabelText('Scroll to top')
        expect(button).toBeInTheDocument()
      })
    })

    it('should_apply_custom_className_prop', () => {
      // Set scroll above threshold to make button visible
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(
        <ScrollToTopButton
          containerRef={containerRef}
          className="custom-scroll-button"
        />
      )

      fireEvent.scroll(window)

      waitFor(() => {
        const button = screen.getByLabelText('Scroll to top')
        expect(button).toHaveClass('custom-scroll-button')
        expect(button).toHaveClass('scroll-to-top-button')
      })
    })

    it('should_have_correct_aria_label', () => {
      // Set scroll above threshold
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} />)

      fireEvent.scroll(window)

      waitFor(() => {
        const button = screen.getByLabelText('Scroll to top')
        expect(button).toHaveAttribute('aria-label', 'Scroll to top')
      })
    })
  })

  describe('Container Scroll Detection', () => {
    it('should_detect_container_scroll_and_show_button', async () => {
      // Set container scroll above threshold
      Object.defineProperty(mockContainer, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      // Trigger scroll event on container
      fireEvent.scroll(mockContainer)

      await waitFor(() => {
        const button = screen.getByLabelText('Scroll to top')
        expect(button).toBeInTheDocument()
      })
    })

    it('should_hide_button_when_container_scrolled_below_threshold', async () => {
      // Start above threshold
      Object.defineProperty(mockContainer, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(mockContainer)

      await waitFor(() => {
        expect(screen.queryByLabelText('Scroll to top')).toBeInTheDocument()
      })

      // Scroll below threshold
      Object.defineProperty(mockContainer, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 500,
      })

      fireEvent.scroll(mockContainer)

      await waitFor(() => {
        expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument()
      })
    })

    it('should_set_activeScroller_to_container_when_container_scrolling', async () => {
      Object.defineProperty(mockContainer, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(mockContainer)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      // Click button
      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      // Should scroll container, not window
      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      })
      expect(window.scrollTo).not.toHaveBeenCalled()
    })

    it('should_scroll_container_to_top_on_click_when_container_active', async () => {
      Object.defineProperty(mockContainer, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(mockContainer)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      })
    })

    it('should_use_smooth_scroll_behavior', async () => {
      Object.defineProperty(mockContainer, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(mockContainer)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      expect(mockContainer.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })
  })

  describe('Window Scroll Detection', () => {
    it('should_detect_window_scroll_and_show_button', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(window)

      await waitFor(() => {
        const button = screen.getByLabelText('Scroll to top')
        expect(button).toBeInTheDocument()
      })
    })

    it('should_hide_button_when_window_scrolled_below_threshold', async () => {
      // Start above threshold
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.queryByLabelText('Scroll to top')).toBeInTheDocument()
      })

      // Scroll below threshold
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 500,
      })

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument()
      })
    })

    it('should_set_activeScroller_to_window_when_window_scrolling', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      // Should scroll window, not container
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      })
    })

    it('should_scroll_window_to_top_on_click_when_window_active', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      })
    })

    it('should_use_smooth_scroll_behavior_for_window', async () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })
  })

  describe('Custom Threshold', () => {
    it('should_use_default_threshold_900px', async () => {
      // Set scroll to exactly 900 (at threshold)
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 900,
      })

      render(<ScrollToTopButton containerRef={containerRef} />)

      fireEvent.scroll(window)

      // At threshold, button should not be visible (needs > threshold)
      expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument()

      // Set scroll above threshold
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 901,
      })

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })
    })

    it('should_respect_custom_threshold_prop', async () => {
      // Set scroll to 500 (above custom threshold of 400)
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 500,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={400} />)

      fireEvent.scroll(window)

      await waitFor(() => {
        const button = screen.getByLabelText('Scroll to top')
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Custom Callback', () => {
    it('should_call_onScrollToTop_callback_when_provided', async () => {
      const mockCallback = jest.fn()

      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(
        <ScrollToTopButton
          containerRef={containerRef}
          onScrollToTop={mockCallback}
        />
      )

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should_not_scroll_when_callback_provided', async () => {
      const mockCallback = jest.fn()

      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(
        <ScrollToTopButton
          containerRef={containerRef}
          onScrollToTop={mockCallback}
        />
      )

      fireEvent.scroll(window)

      await waitFor(() => {
        expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument()
      })

      const button = screen.getByLabelText('Scroll to top')
      fireEvent.click(button)

      // Should call callback, not scrollTo
      expect(mockCallback).toHaveBeenCalled()
      expect(window.scrollTo).not.toHaveBeenCalled()
      expect(mockContainer.scrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Event Listeners', () => {
    it('should_add_scroll_listeners_with_passive_true', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const containerAddEventListenerSpy = jest.spyOn(
        mockContainer,
        'addEventListener'
      )

      render(<ScrollToTopButton containerRef={containerRef} />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )

      expect(containerAddEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      )

      addEventListenerSpy.mockRestore()
      containerAddEventListenerSpy.mockRestore()
    })

    it('should_remove_listeners_on_unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const containerRemoveEventListenerSpy = jest.spyOn(
        mockContainer,
        'removeEventListener'
      )

      const { unmount } = render(
        <ScrollToTopButton containerRef={containerRef} />
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )

      expect(containerRemoveEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
      containerRemoveEventListenerSpy.mockRestore()
    })

    it('should_check_initial_scroll_state_on_mount', () => {
      // Set initial scroll position above threshold
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      render(<ScrollToTopButton containerRef={containerRef} threshold={900} />)

      // Button should be visible immediately after mount
      // (without needing to trigger scroll event)
      waitFor(() => {
        const button = screen.queryByLabelText('Scroll to top')
        expect(button).toBeInTheDocument()
      })
    })
  })
})
