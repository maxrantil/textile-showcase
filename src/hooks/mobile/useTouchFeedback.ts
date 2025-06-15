// src/hooks/mobile/useTouchFeedback.ts
'use client'
import { useCallback } from 'react'

export function useTouchFeedback({ disabled = false } = {}) {
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      const target = e.currentTarget as HTMLElement
      target.style.transform = 'scale(0.95)'
      target.style.opacity = '0.8'
    },
    [disabled]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      const target = e.currentTarget as HTMLElement
      target.style.transform = ''
      target.style.opacity = ''
    },
    [disabled]
  )

  return {
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  }
}
