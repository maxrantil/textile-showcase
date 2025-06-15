// src/hooks/desktop/useHoverEffects.ts
'use client'
import { useCallback } from 'react'

export function useHoverEffects() {
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.transform = 'translateY(-2px)'
    target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.transform = ''
    target.style.boxShadow = ''
  }, [])

  return {
    hoverProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  }
}
