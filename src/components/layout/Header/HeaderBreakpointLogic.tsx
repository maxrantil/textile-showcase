// src/components/layout/Header/HeaderBreakpointLogic.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { UmamiEvents } from '@/utils/analytics'

export function useHeaderBreakpointLogic() {
  const breakpoint = useBreakpoint()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when breakpoint changes
  useEffect(() => {
    if (breakpoint !== 'mobile') {
      setIsMobileMenuOpen(false)
    }
  }, [breakpoint])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => {
      const newState = !prev
      UmamiEvents.mobileMenuToggle(newState ? 'open' : 'close')
      return newState
    })
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
    UmamiEvents.mobileMenuClose('click')
  }, [])

  const handleMobileMenuBackdrop = useCallback(() => {
    setIsMobileMenuOpen(false)
    UmamiEvents.mobileMenuClose('backdrop')
  }, [])

  const handleMobileMenuEscape = useCallback(() => {
    setIsMobileMenuOpen(false)
    UmamiEvents.mobileMenuClose('keyboard')
  }, [])

  return {
    breakpoint,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    handleMobileMenuBackdrop,
    handleMobileMenuEscape
  }
}
