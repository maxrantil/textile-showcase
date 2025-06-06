// src/components/project/ImageCarousel/CarouselLayoutDetector.tsx
'use client'

import { useState, useEffect } from 'react'

interface UseCarouselLayoutDetectorProps {
  mobileBreakpoint?: number
}

export function useCarouselLayoutDetector({ 
  mobileBreakpoint = 768 
}: UseCarouselLayoutDetectorProps = {}) {
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < mobileBreakpoint
      setIsMobile(mobile)
      
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint, isInitialized])

  return {
    isMobile,
    isDesktop: !isMobile,
    isInitialized, // Useful for preventing hydration mismatches
    breakpoint: isMobile ? 'mobile' : 'desktop' as const
  }
}

// Alternative hook for more granular breakpoint detection
export function useCarouselBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const getBreakpoint = () => {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet' 
      return 'desktop'
    }

    const updateBreakpoint = () => {
      const newBreakpoint = getBreakpoint()
      setBreakpoint(newBreakpoint)
      
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [isInitialized])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet', 
    isDesktop: breakpoint === 'desktop',
    isInitialized
  }
}
