// ABOUTME: Behaviour tests for useVirtualKeyboard keyboard-open detection
// Keyboard counts as open when the viewport shrinks by more than 150px

import { renderHook, act } from '@testing-library/react'
import { useVirtualKeyboard } from '@/hooks/mobile/useVirtualKeyboard'

const setHeight = (h: number) =>
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true })

describe('useVirtualKeyboard', () => {
  beforeEach(() => setHeight(800))

  it('starts closed and reports the current viewport height', () => {
    const { result } = renderHook(() => useVirtualKeyboard())
    expect(result.current.isKeyboardOpen).toBe(false)
    expect(result.current.viewportHeight).toBe(800)
  })

  it('opens when the viewport shrinks by more than 150px and closes again', () => {
    const { result } = renderHook(() => useVirtualKeyboard())

    act(() => {
      setHeight(500)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isKeyboardOpen).toBe(true)
    expect(result.current.viewportHeight).toBe(500)

    act(() => {
      setHeight(800)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('ignores small shrinks (e.g. browser chrome)', () => {
    const { result } = renderHook(() => useVirtualKeyboard())
    act(() => {
      setHeight(700)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current.isKeyboardOpen).toBe(false)
  })
})
