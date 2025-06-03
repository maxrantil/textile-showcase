import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useKeyboardNavigation } from '../useKeyboardNavigation'

describe('useKeyboardNavigation Hook', () => {
  it('calls onNext when right arrow is pressed', () => {
    const mockOnNext = jest.fn()
    const mockOnPrevious = jest.fn()
    
    renderHook(() => 
      useKeyboardNavigation({
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
        enabled: true,
      })
    )
    
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(mockOnNext).toHaveBeenCalledTimes(1)
    expect(mockOnPrevious).not.toHaveBeenCalled()
  })

  it('calls onPrevious when left arrow is pressed', () => {
    const mockOnNext = jest.fn()
    const mockOnPrevious = jest.fn()
    
    renderHook(() => 
      useKeyboardNavigation({
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
        enabled: true,
      })
    )
    
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(mockOnPrevious).toHaveBeenCalledTimes(1)
    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('does not call handlers when disabled', () => {
    const mockOnNext = jest.fn()
    
    renderHook(() => 
      useKeyboardNavigation({
        onNext: mockOnNext,
        enabled: false,
      })
    )
    
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(mockOnNext).not.toHaveBeenCalled()
  })
})
