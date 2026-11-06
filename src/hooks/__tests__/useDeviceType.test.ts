// ABOUTME: Behaviour tests for useDeviceType (SSR default, detection, debounced resize)
// Pins behaviour so the hook can be refactored without changing results

import { renderHook, act } from '@testing-library/react'
import { useDeviceType } from '@/hooks/shared/useDeviceType'

function setViewport(width: number, height: number, ua?: string) {
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
  if (ua) {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      configurable: true,
    })
  }
}

const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130'
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'

describe('useDeviceType', () => {
  afterEach(() => jest.useRealTimers())

  it('reports desktop on a wide desktop viewport', () => {
    setViewport(1440, 900, DESKTOP_UA)
    const { result } = renderHook(() => useDeviceType())
    expect(result.current).toBe('desktop')
  })

  it('reports mobile for a phone user agent on a narrow viewport', () => {
    setViewport(390, 844, IPHONE_UA)
    const { result } = renderHook(() => useDeviceType())
    expect(result.current).toBe('mobile')
  })

  it('updates after a debounced resize', () => {
    jest.useFakeTimers()
    setViewport(1440, 900, IPHONE_UA)
    const { result } = renderHook(() => useDeviceType())
    expect(result.current).toBe('desktop') // landscape >= 1024 forces desktop

    act(() => {
      setViewport(390, 844)
      window.dispatchEvent(new Event('resize'))
    })
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(result.current).toBe('mobile')
  })

  it('removes its listeners on unmount', () => {
    const remove = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useDeviceType())
    unmount()
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    remove.mockRestore()
  })
})
