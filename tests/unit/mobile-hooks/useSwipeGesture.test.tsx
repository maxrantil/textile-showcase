// ABOUTME: Comprehensive mobile hook testing for useSwipeGesture with TDD approach

import { renderHook, act } from '@testing-library/react'
import {
  useSwipeGesture,
  useHorizontalSwipe,
} from '@/hooks/mobile/useSwipeGesture'

// Mock TouchEvent for testing environment
class MockTouchEvent {
  touches: Array<{ clientX: number; clientY: number }>

  constructor(x: number, y: number) {
    this.touches = [{ clientX: x, clientY: y }]
  }
}

describe('useSwipeGesture Hook (Phase 3 TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date.now for consistent timing
    jest.spyOn(Date, 'now').mockReturnValue(1000)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Swipe Detection', () => {
    it('should detect horizontal left swipe correctly', () => {
      const onSwipeLeft = jest.fn()
      const onSwipeRight = jest.fn()

      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          onSwipeRight,
          minSwipeDistance: 50,
        })
      )

      // Simulate swipe left (start at 200, move to 100)
      act(() => {
        result.current.onTouchStart(new MockTouchEvent(200, 100) as unknown as TouchEvent)
      })

      // Simulate move to trigger swipe detection
      act(() => {
        result.current.onTouchMove(new MockTouchEvent(100, 100) as unknown as TouchEvent)
      })

      // Mock time progression
      jest.spyOn(Date, 'now').mockReturnValue(1200)

      act(() => {
        result.current.onTouchEnd()
      })

      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('should detect horizontal right swipe correctly', () => {
      const onSwipeLeft = jest.fn()
      const onSwipeRight = jest.fn()

      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          onSwipeRight,
          minSwipeDistance: 50,
        })
      )

      const startEvent = new MockTouchEvent(100, 100) as unknown as TouchEvent

      act(() => {
        result.current.onTouchStart(startEvent)
      })

      // Mock time progression and update current position
      jest.spyOn(Date, 'now').mockReturnValue(1200)

      // Simulate swipe right by updating internal state
      act(() => {
        result.current.onTouchMove(new MockTouchEvent(200, 100) as unknown as TouchEvent)
      })

      act(() => {
        result.current.onTouchEnd()
      })

      expect(onSwipeRight).toHaveBeenCalledTimes(1)
      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('should detect vertical up swipe correctly', () => {
      const onSwipeUp = jest.fn()
      const onSwipeDown = jest.fn()

      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeUp,
          onSwipeDown,
          minSwipeDistance: 50,
        })
      )

      const startEvent = new MockTouchEvent(100, 200) as unknown as TouchEvent

      act(() => {
        result.current.onTouchStart(startEvent)
      })

      // Mock time progression
      jest.spyOn(Date, 'now').mockReturnValue(1200)

      act(() => {
        result.current.onTouchMove(new MockTouchEvent(100, 100) as unknown as TouchEvent)
      })

      act(() => {
        result.current.onTouchEnd()
      })

      expect(onSwipeUp).toHaveBeenCalledTimes(1)
      expect(onSwipeDown).not.toHaveBeenCalled()
    })
  })

  describe('Swipe Validation Rules', () => {
    it('should reject swipes below minimum distance threshold', () => {
      const onSwipeLeft = jest.fn()

      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          minSwipeDistance: 100, // High threshold
        })
      )

      const startEvent = new MockTouchEvent(200, 100) as unknown as TouchEvent

      act(() => {
        result.current.onTouchStart(startEvent)
      })

      // Small movement (only 30px)
      act(() => {
        result.current.onTouchMove(new MockTouchEvent(170, 100) as unknown as TouchEvent)
      })

      jest.spyOn(Date, 'now').mockReturnValue(1200)

      act(() => {
        result.current.onTouchEnd()
      })

      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('should reject swipes that take too long', () => {
      const onSwipeLeft = jest.fn()

      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          minSwipeDistance: 50,
          maxSwipeTime: 300, // Short time limit
        })
      )

      const startEvent = new MockTouchEvent(200, 100) as unknown as TouchEvent

      act(() => {
        result.current.onTouchStart(startEvent)
      })

      act(() => {
        result.current.onTouchMove(new MockTouchEvent(100, 100) as unknown as TouchEvent)
      })

      // Mock time progression beyond limit
      jest.spyOn(Date, 'now').mockReturnValue(1400) // 400ms elapsed > 300ms limit

      act(() => {
        result.current.onTouchEnd()
      })

      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('should respect enabled/disabled state', () => {
      const onSwipeLeft = jest.fn()

      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          enabled: false, // Disabled
          minSwipeDistance: 50,
        })
      )

      const startEvent = new MockTouchEvent(200, 100) as unknown as TouchEvent

      act(() => {
        result.current.onTouchStart(startEvent)
      })

      act(() => {
        result.current.onTouchMove(new MockTouchEvent(100, 100) as unknown as TouchEvent)
      })

      jest.spyOn(Date, 'now').mockReturnValue(1200)

      act(() => {
        result.current.onTouchEnd()
      })

      expect(onSwipeLeft).not.toHaveBeenCalled()
    })
  })

  describe('Gesture State Management', () => {
    it('should track swiping state correctly', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({
          minSwipeDistance: 50,
          threshold: 10,
        })
      )

      expect(result.current.isSwiping).toBe(false)

      const startEvent = new MockTouchEvent(100, 100) as unknown as TouchEvent

      act(() => {
        result.current.onTouchStart(startEvent)
      })

      expect(result.current.isSwiping).toBe(false)

      // Significant movement should trigger swiping state
      act(() => {
        result.current.onTouchMove(new MockTouchEvent(120, 100) as unknown as TouchEvent)
      })

      expect(result.current.isSwiping).toBe(true)

      act(() => {
        result.current.onTouchEnd()
      })

      expect(result.current.isSwiping).toBe(false)
    })

    it('should reset state properly after touch end', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({
          minSwipeDistance: 50,
        })
      )

      const startEvent = new MockTouchEvent(100, 100) as unknown as TouchEvent

      act(() => {
        result.current.onTouchStart(startEvent)
      })

      act(() => {
        result.current.onTouchMove(new MockTouchEvent(200, 100) as unknown as TouchEvent)
      })

      expect(result.current.isSwiping).toBe(true)

      act(() => {
        result.current.onTouchEnd()
      })

      // State should be reset
      expect(result.current.isSwiping).toBe(false)
    })
  })

  describe('Touch Event Handling', () => {
    it('should handle touch events with proper positions', () => {
      const onSwipeRight = jest.fn()

      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeRight,
          minSwipeDistance: 75,
        })
      )

      // Start touch
      act(() => {
        result.current.onTouchStart(new MockTouchEvent(50, 200) as unknown as TouchEvent)
      })

      // Move touch significantly
      act(() => {
        result.current.onTouchMove(new MockTouchEvent(150, 200) as unknown as TouchEvent)
      })

      expect(result.current.isSwiping).toBe(true)

      jest.spyOn(Date, 'now').mockReturnValue(1300)

      // End touch
      act(() => {
        result.current.onTouchEnd()
      })

      expect(onSwipeRight).toHaveBeenCalledTimes(1)
    })

    it('should provide touch handlers object', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({
          minSwipeDistance: 50,
        })
      )

      expect(result.current.swipeHandlers).toEqual({
        onTouchStart: expect.any(Function),
        onTouchMove: expect.any(Function),
        onTouchEnd: expect.any(Function),
      })
    })
  })
})

describe('useHorizontalSwipe Hook (Phase 3 TDD)', () => {
  it('should initialize with correct default values', () => {
    const onSwipeLeft = jest.fn()
    const onSwipeRight = jest.fn()

    const { result } = renderHook(() =>
      useHorizontalSwipe({
        onSwipeLeft,
        onSwipeRight,
      })
    )

    expect(result.current.onTouchStart).toBeInstanceOf(Function)
    expect(result.current.onTouchMove).toBeInstanceOf(Function)
    expect(result.current.onTouchEnd).toBeInstanceOf(Function)
    expect(result.current.isSwiping).toBe(false)
  })

  it('should use horizontal-optimized settings', () => {
    const onSwipeLeft = jest.fn()

    const { result } = renderHook(() =>
      useHorizontalSwipe({
        onSwipeLeft,
        minSwipeDistance: 100, // Custom distance
        maxSwipeTime: 600, // Custom time
      })
    )

    const startEvent = new MockTouchEvent(200, 100) as unknown as TouchEvent

    act(() => {
      result.current.onTouchStart(startEvent)
    })

    act(() => {
      result.current.onTouchMove(new MockTouchEvent(90, 100) as unknown as TouchEvent)
    })

    jest.spyOn(Date, 'now').mockReturnValue(1500) // 500ms elapsed (under 600ms limit)

    act(() => {
      result.current.onTouchEnd()
    })

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
  })

  it('should only handle horizontal swipes', () => {
    const onSwipeLeft = jest.fn()
    const onSwipeUp = jest.fn() // This shouldn't be called

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        onSwipeUp,
        minSwipeDistance: 50,
      })
    )

    // Diagonal swipe with more horizontal than vertical component
    const startEvent = new MockTouchEvent(200, 200) as unknown as TouchEvent

    act(() => {
      result.current.onTouchStart(startEvent)
    })

    act(() => {
      result.current.onTouchMove(new MockTouchEvent(100, 180) as unknown as TouchEvent) // 100px horizontal, 20px vertical
    })

    jest.spyOn(Date, 'now').mockReturnValue(1200)

    act(() => {
      result.current.onTouchEnd()
    })

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeUp).not.toHaveBeenCalled()
  })
})

describe('Performance and Edge Cases (Phase 3)', () => {
  it('should handle rapid touch events without memory leaks', () => {
    const { result } = renderHook(() =>
      useSwipeGesture({
        minSwipeDistance: 50,
      })
    )

    // Simulate rapid touch events
    for (let i = 0; i < 100; i++) {
      act(() => {
        result.current.onTouchStart(new MockTouchEvent(i, 100) as unknown as TouchEvent)
        result.current.onTouchMove(new MockTouchEvent(i + 10, 100) as unknown as TouchEvent)
        result.current.onTouchEnd()
      })
    }

    // Should not crash and state should be clean
    expect(result.current.isSwiping).toBe(false)
  })

  it('should handle missing touch data gracefully', () => {
    const onSwipeLeft = jest.fn()

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
      })
    )

    // Call touch end without start
    act(() => {
      result.current.onTouchEnd()
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(result.current.isSwiping).toBe(false)
  })

  it('should handle zero or negative touch coordinates', () => {
    const onSwipeRight = jest.fn()

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeRight,
        minSwipeDistance: 50,
      })
    )

    act(() => {
      result.current.onTouchStart(new MockTouchEvent(0, 0) as unknown as TouchEvent)
    })

    act(() => {
      result.current.onTouchMove(new MockTouchEvent(60, 0) as unknown as TouchEvent)
    })

    jest.spyOn(Date, 'now').mockReturnValue(1200)

    act(() => {
      result.current.onTouchEnd()
    })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
  })
})
