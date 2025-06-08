// src/components/layout/Header/HeaderScrollEffects.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseHeaderScrollEffectsProps {
  breakpoint: 'mobile' | 'tablet' | 'desktop'
  isMobileMenuOpen: boolean
}

export function useHeaderScrollEffects({
  breakpoint,
  isMobileMenuOpen,
}: UseHeaderScrollEffectsProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY

    // Header background change
    setIsScrolled(currentScrollY > 10)

    // Auto-hide header on mobile when scrolling down
    if (breakpoint === 'mobile' && !isMobileMenuOpen) {
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false)
      } else {
        setIsHeaderVisible(true)
      }
    } else {
      setIsHeaderVisible(true)
    }

    setLastScrollY(currentScrollY)
  }, [breakpoint, isMobileMenuOpen, lastScrollY])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Reset header visibility when breakpoint changes
  useEffect(() => {
    if (breakpoint !== 'mobile') {
      setIsHeaderVisible(true)
    }
  }, [breakpoint])

  return {
    isScrolled,
    isHeaderVisible,
    lastScrollY,
  }
}
