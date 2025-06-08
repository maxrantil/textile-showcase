// src/hooks/useBreakpoint.ts
'use client'

import { useState, useEffect } from 'react'

const BREAKPOINTS = {
  sm: 640, // Mobile
  md: 768, // Tablet
  lg: 1024, // Desktop
  xl: 1280, // Large desktop
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  )

  useEffect(() => {
    const getBreakpoint = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.md) return 'mobile'
      if (width < BREAKPOINTS.lg) return 'tablet'
      return 'desktop'
    }

    const handleResize = () => setBreakpoint(getBreakpoint())
    handleResize() // Set initial value

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}
