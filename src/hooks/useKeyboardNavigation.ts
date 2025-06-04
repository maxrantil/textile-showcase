'use client'

import { useEffect, useRef } from 'react'

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
  const scrollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const scrollAmount = 150

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return
      }

      // For scroll keys, handle continuous scrolling
      if (['ArrowUp', 'ArrowDown', 'j', 'k'].includes(e.key)) {
        e.preventDefault()
        
        // If interval already exists for this key, don't create another
        if (scrollIntervals.current.has(e.key)) {
          return
        }

        // Execute immediately
        switch (e.key) {
          case 'ArrowUp':
          case 'k':
            onScrollUp?.()
            break
          case 'ArrowDown':
          case 'j':
            onScrollDown?.()
            break
        }

        // Set up continuous scrolling
        const interval = setInterval(() => {
          switch (e.key) {
            case 'ArrowUp':
            case 'k':
              onScrollUp?.()
              break
            case 'ArrowDown':
            case 'j':
              onScrollDown?.()
              break
          }
        }, 150) // Repeat every 150ms while held

        scrollIntervals.current.set(e.key, interval)
        return
      }

      // For non-scroll keys, handle normally (single execution)
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

    const handleKeyUp = (e: KeyboardEvent) => {
      // Clear scroll interval when key is released
      const interval = scrollIntervals.current.get(e.key)
      if (interval) {
        clearInterval(interval)
        scrollIntervals.current.delete(e.key)
      }
    }

    // Clear all intervals when window loses focus
    const handleBlur = () => {
      scrollIntervals.current.forEach(interval => clearInterval(interval))
      scrollIntervals.current.clear()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      // Clean up intervals
      scrollIntervals.current.forEach(interval => clearInterval(interval))
      scrollIntervals.current.clear()
      
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [onPrevious, onNext, onEscape, onEnter, onScrollUp, onScrollDown, onAbout, onWork, onContact, enabled])
}
