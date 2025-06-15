// src/hooks/desktop/useKeyboardNavigation.ts - Add more debugging
'use client'

import { useEffect, useRef, useMemo } from 'react'
import { throttle } from '@/utils/performance'

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
  enabled = true,
}: UseKeyboardNavigationProps) {
  const scrollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Debug: Log when the hook initializes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎹 Keyboard navigation initialized with:', {
        onEnter: !!onEnter,
        onEscape: !!onEscape,
        onPrevious: !!onPrevious,
        onNext: !!onNext,
        enabled,
      })
    }
  }, [onEnter, onEscape, onPrevious, onNext, enabled])

  // Create throttled scroll functions
  const throttledScrollUp = useMemo(
    () => (onScrollUp ? throttle(onScrollUp, 100) : undefined),
    [onScrollUp]
  )

  const throttledScrollDown = useMemo(
    () => (onScrollDown ? throttle(onScrollDown, 100) : undefined),
    [onScrollDown]
  )

  useEffect(() => {
    if (!enabled) return

    // Capture the current intervals map for cleanup
    const currentIntervals = scrollIntervals.current

    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🎹 Key pressed:', e.key, 'Target:', e.target)
      }

      // Don't interfere with form inputs or when user is typing
      const target = e.target as HTMLElement
      const isTypingContext =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.contentEditable === 'true' ||
        target?.tagName === 'BUTTON' ||
        target?.tagName === 'A' ||
        target?.hasAttribute('tabindex')

      if (isTypingContext) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎹 Ignoring key in typing context:', target.tagName)
        }
        return
      }

      // For scroll keys, handle continuous scrolling with throttling
      if (['ArrowUp', 'ArrowDown', 'j', 'k'].includes(e.key)) {
        e.preventDefault()

        // If interval already exists for this key, don't create another
        if (currentIntervals.has(e.key)) {
          return
        }

        // Execute immediately using throttled functions
        switch (e.key) {
          case 'ArrowUp':
          case 'k':
            throttledScrollUp?.()
            break
          case 'ArrowDown':
          case 'j':
            throttledScrollDown?.()
            break
        }

        // Set up continuous scrolling with throttled functions
        const interval = setInterval(() => {
          switch (e.key) {
            case 'ArrowUp':
            case 'k':
              throttledScrollUp?.()
              break
            case 'ArrowDown':
            case 'j':
              throttledScrollDown?.()
              break
          }
        }, 150) // Repeat every 150ms while held

        currentIntervals.set(e.key, interval)
        return
      }

      // For non-scroll keys, handle normally (single execution)
      switch (e.key) {
        case 'ArrowLeft':
        case 'h': // Vim-like navigation
          e.preventDefault()
          if (process.env.NODE_ENV === 'development') {
            console.log('🎹 Previous triggered, function exists:', !!onPrevious)
          }
          onPrevious?.()
          break
        case 'ArrowRight':
        case 'l': // Vim-like navigation
          e.preventDefault()
          if (process.env.NODE_ENV === 'development') {
            console.log('🎹 Next triggered, function exists:', !!onNext)
          }
          onNext?.()
          break
        case 'Escape':
          e.preventDefault()
          if (process.env.NODE_ENV === 'development') {
            console.log('🎹 Escape triggered, function exists:', !!onEscape)
          }
          onEscape?.()
          break
        case 'Enter':
          e.preventDefault()
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '🎹 Enter triggered, onEnter function exists:',
              !!onEnter
            )
            console.log('🎹 About to call onEnter...')
          }
          if (onEnter) {
            onEnter()
            if (process.env.NODE_ENV === 'development') {
              console.log('🎹 onEnter called successfully')
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('🎹 onEnter function is not defined!')
            }
          }
          break
        case ' ': // Spacebar
          e.preventDefault()
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '🎹 Spacebar triggered, onEnter function exists:',
              !!onEnter
            )
            console.log('🎹 About to call onEnter...')
          }
          if (onEnter) {
            onEnter()
            if (process.env.NODE_ENV === 'development') {
              console.log('🎹 onEnter called successfully via Spacebar')
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('🎹 onEnter function is not defined!')
            }
          }
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
      const interval = currentIntervals.get(e.key)
      if (interval) {
        clearInterval(interval)
        currentIntervals.delete(e.key)
      }
    }

    // Clear all intervals when window loses focus
    const handleBlur = () => {
      currentIntervals.forEach((interval) => clearInterval(interval))
      currentIntervals.clear()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      // Clean up intervals using the captured reference
      currentIntervals.forEach((interval) => clearInterval(interval))
      currentIntervals.clear()

      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [
    throttledScrollUp,
    throttledScrollDown,
    onPrevious,
    onNext,
    onEscape,
    onEnter,
    onAbout,
    onWork,
    onContact,
    enabled,
  ])
}
