// ABOUTME: Tests for useVirtualKeyboard - detects an open on-screen keyboard
// ABOUTME: from viewport height shrinking more than 150px since mount
import { renderHook, act } from '@testing-library/react'
import { useVirtualKeyboard } from '../useVirtualKeyboard'

const resizeTo = (height: number) => {
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('useVirtualKeyboard', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    })
  })

  it('reports the initial viewport height with keyboard closed', () => {
    const { result } = renderHook(() => useVirtualKeyboard())

    expect(result.current.viewportHeight).toBe(800)
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('reports keyboard open when height shrinks by more than 150px', () => {
    const { result } = renderHook(() => useVirtualKeyboard())

    act(() => resizeTo(500))

    expect(result.current.viewportHeight).toBe(500)
    expect(result.current.isKeyboardOpen).toBe(true)
  })

  it('keeps keyboard closed for small height changes and reopens to closed', () => {
    const { result } = renderHook(() => useVirtualKeyboard())

    act(() => resizeTo(700))
    expect(result.current.isKeyboardOpen).toBe(false)

    act(() => resizeTo(400))
    expect(result.current.isKeyboardOpen).toBe(true)

    act(() => resizeTo(800))
    expect(result.current.isKeyboardOpen).toBe(false)
  })
})
