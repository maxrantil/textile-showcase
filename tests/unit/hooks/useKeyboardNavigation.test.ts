// ABOUTME: Unit tests for keyboard navigation hook functionality
// Tests modifier key detection, event handling, and browser shortcut compatibility

import { renderHook, act } from '@testing-library/react'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'

// Mock throttle function
jest.mock('@/utils/performance', () => ({
  throttle: (fn: (...args: unknown[]) => unknown) => fn, // Return unthrottled version for testing
}))

// Helper to create keyboard events
const createKeyboardEvent = (
  key: string,
  modifiers?: {
    ctrlKey?: boolean
    metaKey?: boolean
    altKey?: boolean
    shiftKey?: boolean
  },
  target?: HTMLElement
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers?.ctrlKey || false,
    metaKey: modifiers?.metaKey || false,
    altKey: modifiers?.altKey || false,
    shiftKey: modifiers?.shiftKey || false,
    bubbles: true,
  })

  // Mock target if provided
  if (target) {
    Object.defineProperty(event, 'target', {
      value: target,
      writable: false,
    })
  }

  return event
}

// Helper to create mock DOM elements
const createMockTarget = (
  tagName: string,
  attributes?: Record<string, string>
): HTMLElement => {
  const element = document.createElement(tagName)
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'contentEditable') {
        element.contentEditable = value
      } else {
        element.setAttribute(key, value)
      }
    })
  }
  return element
}

describe('useKeyboardNavigation', () => {
  let mockCallbacks: {
    onNext: jest.Mock
    onPrevious: jest.Mock
    onEscape: jest.Mock
    onEnter: jest.Mock
    onScrollUp: jest.Mock
    onScrollDown: jest.Mock
    onAbout: jest.Mock
    onWork: jest.Mock
    onContact: jest.Mock
  }

  beforeEach(() => {
    mockCallbacks = {
      onNext: jest.fn(),
      onPrevious: jest.fn(),
      onEscape: jest.fn(),
      onEnter: jest.fn(),
      onScrollUp: jest.fn(),
      onScrollDown: jest.fn(),
      onAbout: jest.fn(),
      onWork: jest.fn(),
      onContact: jest.fn(),
    }

    // Clear all timers
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('Basic Navigation Functions', () => {
    it('should call onNext when ArrowRight is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('ArrowRight')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onNext).toHaveBeenCalledTimes(1)
    })

    it('should call onNext when "l" is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('l')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onNext).toHaveBeenCalledTimes(1)
    })

    it('should call onPrevious when ArrowLeft is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('ArrowLeft')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onPrevious).toHaveBeenCalledTimes(1)
    })

    it('should call onPrevious when "h" is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('h')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onPrevious).toHaveBeenCalledTimes(1)
    })

    it('should call onEscape when Escape is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('Escape')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onEscape).toHaveBeenCalledTimes(1)
    })

    it('should call onEnter when Enter is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('Enter')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onEnter).toHaveBeenCalledTimes(1)
    })

    it('should call onEnter when Spacebar is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent(' ')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onEnter).toHaveBeenCalledTimes(1)
    })
  })

  describe('Modifier Key Detection (Browser Shortcut Compatibility)', () => {
    it('should NOT intercept Ctrl+L (focus URL bar)', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('l', { ctrlKey: true })
      act(() => {
        window.dispatchEvent(event)
      })

      // onNext should NOT be called when Ctrl is held
      expect(mockCallbacks.onNext).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })

    it('should NOT intercept Cmd+L (focus URL bar on Mac)', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('l', { metaKey: true })
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onNext).not.toHaveBeenCalled()
    })

    it('should NOT intercept Ctrl+R (browser refresh)', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('r', { ctrlKey: true })
      act(() => {
        window.dispatchEvent(event)
      })

      // No callbacks should be triggered
      expect(
        Object.values(mockCallbacks).every(
          (mock) => mock.mock.calls.length === 0
        )
      ).toBe(true)
    })

    it('should NOT intercept Cmd+T (new tab on Mac)', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('t', { metaKey: true })
      act(() => {
        window.dispatchEvent(event)
      })

      expect(
        Object.values(mockCallbacks).every(
          (mock) => mock.mock.calls.length === 0
        )
      ).toBe(true)
    })

    it('should NOT intercept Alt+Left (browser back)', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('ArrowLeft', { altKey: true })
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onPrevious).not.toHaveBeenCalled()
    })

    it('should intercept plain "l" key (no modifiers)', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('l')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onNext).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple modifiers gracefully', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('h', { ctrlKey: true, shiftKey: true })
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onPrevious).not.toHaveBeenCalled()
    })
  })

  describe('Typing Context Detection', () => {
    it('should ignore keys when focused on input elements', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const inputTarget = createMockTarget('input')
      const event = createKeyboardEvent('l', {}, inputTarget)

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onNext).not.toHaveBeenCalled()
    })

    it('should ignore keys when focused on textarea elements', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const textareaTarget = createMockTarget('textarea')
      const event = createKeyboardEvent('h', {}, textareaTarget)

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onPrevious).not.toHaveBeenCalled()
    })

    it('should ignore keys when focused on select elements', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const selectTarget = createMockTarget('select')
      const event = createKeyboardEvent('ArrowDown', {}, selectTarget)

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onScrollDown).not.toHaveBeenCalled()
    })

    it('should ignore keys when contentEditable=true', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const editableTarget = createMockTarget('div', {
        contentEditable: 'true',
      })
      const event = createKeyboardEvent('l', {}, editableTarget)

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onNext).not.toHaveBeenCalled()
    })

    it('should ignore keys when focused on buttons', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const buttonTarget = createMockTarget('button')
      const event = createKeyboardEvent('Enter', {}, buttonTarget)

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onEnter).not.toHaveBeenCalled()
    })

    it('should ignore keys when focused on links', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const linkTarget = createMockTarget('a')
      const event = createKeyboardEvent(' ', {}, linkTarget)

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onEnter).not.toHaveBeenCalled()
    })
  })

  describe('Continuous Scrolling', () => {
    it('should handle ArrowUp for continuous scrolling', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('ArrowUp')

      act(() => {
        window.dispatchEvent(event)
      })

      // Should be called immediately
      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(1)

      // Should continue with interval
      act(() => {
        jest.advanceTimersByTime(150)
      })

      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(2)
    })

    it('should handle "k" for vim-like scrolling up', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('k')

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(1)
    })

    it('should handle ArrowDown for continuous scrolling', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('ArrowDown')

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onScrollDown).toHaveBeenCalledTimes(1)
    })

    it('should handle "j" for vim-like scrolling down', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('j')

      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onScrollDown).toHaveBeenCalledTimes(1)
    })

    it('should clear intervals on keyup', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      // Start scrolling
      const keydownEvent = createKeyboardEvent('ArrowUp')
      act(() => {
        window.dispatchEvent(keydownEvent)
      })

      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(1)

      // Stop scrolling
      const keyupEvent = new KeyboardEvent('keyup', { key: 'ArrowUp' })
      act(() => {
        window.dispatchEvent(keyupEvent)
      })

      // Advance timer - should not call again
      act(() => {
        jest.advanceTimersByTime(150)
      })

      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(1)
    })

    it('should clear intervals on window blur', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      // Start scrolling
      const event = createKeyboardEvent('ArrowDown')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onScrollDown).toHaveBeenCalledTimes(1)

      // Trigger blur
      act(() => {
        window.dispatchEvent(new Event('blur'))
      })

      // Advance timer - should not call again
      act(() => {
        jest.advanceTimersByTime(150)
      })

      expect(mockCallbacks.onScrollDown).toHaveBeenCalledTimes(1)
    })

    it('should prevent duplicate intervals for same key', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      // Press same key multiple times rapidly
      const event1 = createKeyboardEvent('ArrowUp')
      const event2 = createKeyboardEvent('ArrowUp')

      act(() => {
        window.dispatchEvent(event1)
        window.dispatchEvent(event2)
      })

      // Should only be called once initially (not twice)
      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(1)
    })
  })

  describe('Navigation Shortcuts', () => {
    it('should call onAbout when "a" is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('a')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onAbout).toHaveBeenCalledTimes(1)
    })

    it('should call onWork when "w" is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('w')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onWork).toHaveBeenCalledTimes(1)
    })

    it('should call onContact when "c" is pressed', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      const event = createKeyboardEvent('c')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onContact).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined callback functions gracefully', () => {
      renderHook(() => useKeyboardNavigation({ enabled: true }))

      const event = createKeyboardEvent('l')

      expect(() => {
        act(() => {
          window.dispatchEvent(event)
        })
      }).not.toThrow()
    })

    it('should disable all handlers when enabled=false', () => {
      renderHook(() =>
        useKeyboardNavigation({ ...mockCallbacks, enabled: false })
      )

      const event = createKeyboardEvent('l')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onNext).not.toHaveBeenCalled()
    })

    it('should cleanup intervals when component unmounts', () => {
      const { unmount } = renderHook(() => useKeyboardNavigation(mockCallbacks))

      // Start scrolling
      const event = createKeyboardEvent('ArrowUp')
      act(() => {
        window.dispatchEvent(event)
      })

      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(1)

      // Unmount component
      unmount()

      // Advance timer - should not call again
      act(() => {
        jest.advanceTimersByTime(150)
      })

      expect(mockCallbacks.onScrollUp).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid key sequences without memory leaks', () => {
      renderHook(() => useKeyboardNavigation(mockCallbacks))

      // Simulate rapid key presses
      for (let i = 0; i < 10; i++) {
        const event = createKeyboardEvent('l')
        act(() => {
          window.dispatchEvent(event)
        })
      }

      expect(mockCallbacks.onNext).toHaveBeenCalledTimes(10)
    })
  })
})
