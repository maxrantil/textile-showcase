// src/hooks/desktop/useHeaderScrollEffects.ts
'use client'

import { useState, useEffect } from 'react'

export function useHeaderScrollEffects() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Header background change
      setIsScrolled(currentScrollY > 10)

      // Auto-hide header on scroll down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false)
      } else {
        setIsHeaderVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return {
    isScrolled,
    isHeaderVisible,
  }
}
