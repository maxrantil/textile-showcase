// ABOUTME: Tests for useDeviceType - score-based mobile/desktop detection
// ABOUTME: covering initial detection and debounced resize updates
import { renderHook, act } from '@testing-library/react'
import { useDeviceType } from '../useDeviceType'

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  })
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
  })
  Object.defineProperty(window.screen, 'width', {
    value: width,
    configurable: true,
  })
  Object.defineProperty(window.screen, 'height', {
    value: height,
    configurable: true,
  })
}

const setUserAgent = (ua: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  })
}

describe('useDeviceType', () => {
  const originalUA = window.navigator.userAgent

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    setUserAgent(originalUA)
    setViewport(1280, 800)
  })

  it('detects desktop for a wide non-mobile viewport', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)')
    setViewport(1280, 800)

    const { result } = renderHook(() => useDeviceType())

    expect(result.current).toBe('desktop')
  })

  it('detects mobile for a small phone viewport with a mobile user agent', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    setViewport(390, 844)

    const { result } = renderHook(() => useDeviceType())

    expect(result.current).toBe('mobile')
  })

  it('re-detects after a debounced resize', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    setViewport(390, 844)
    const { result } = renderHook(() => useDeviceType())
    expect(result.current).toBe('mobile')

    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)')
    setViewport(1280, 800)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    // Debounced: not updated yet
    expect(result.current).toBe('mobile')

    act(() => {
      jest.advanceTimersByTime(150)
    })
    expect(result.current).toBe('desktop')
  })
})
