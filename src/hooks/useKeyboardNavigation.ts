'use client'

import { useEffect } from 'react'

interface UseKeyboardNavigationProps {
  onPrevious?: () => void
  onNext?: () => void
  onEscape?: () => void
  onEnter?: () => void
  onScrollUp?: () => void
  onScrollDown?: () => void
  onAbout?: () => void
  onWork?: () => void
  onContact?: () => void
  enabled?: boolean
}

export function useKeyboardNavigation({
  onPrevious,
  onNext,
  onEscape,
  onEnter,
  onScrollUp,
  onScrollDown,
  onAbout,
  onWork,
  onContact,
  enabled = true
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'h': // Vim-like navigation
          e.preventDefault()
          onPrevious?.()
          break
        case 'ArrowRight':
        case 'l': // Vim-like navigation
          e.preventDefault()
          onNext?.()
          break
        case 'ArrowUp':
          e.preventDefault()
          onScrollUp?.()
          break
        case 'ArrowDown':
          e.preventDefault()
          onScrollDown?.()
          break
        case 'k': // Vim-like navigation - page scroll up
          e.preventDefault()
          onScrollUp?.()
          break
        case 'j': // Vim-like navigation - page scroll down
          e.preventDefault()
          onScrollDown?.()
          break
        case 'Escape':
          e.preventDefault()
          onEscape?.()
          break
        case 'Enter':
        case ' ': // Spacebar
          e.preventDefault()
          onEnter?.()
          break
        case 'a':
          e.preventDefault()
          onAbout?.()
          break
        case 'w':
          e.preventDefault()
          onWork?.()
          break
        case 'c':
          e.preventDefault()
          onContact?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onPrevious, onNext, onEscape, onEnter, onScrollUp, onScrollDown, onAbout, onWork, onContact, enabled])
}
