// src/components/layout/Header/HeaderState.tsx
'use client'

import { useHeaderScrollEffects } from './HeaderScrollEffects'
import { useHeaderBreakpointLogic } from './HeaderBreakpointLogic'
import { useHeaderStyles } from './HeaderStyles'

export function useHeaderState() {
  // Breakpoint and mobile menu logic
  const breakpointLogic = useHeaderBreakpointLogic()
  
  // Scroll effects
  const scrollEffects = useHeaderScrollEffects({
    breakpoint: breakpointLogic.breakpoint,
    isMobileMenuOpen: breakpointLogic.isMobileMenuOpen
  })
  
  // Style calculations
  const styles = useHeaderStyles({
    breakpoint: breakpointLogic.breakpoint,
    isScrolled: scrollEffects.isScrolled,
    isHeaderVisible: scrollEffects.isHeaderVisible
  })

  return {
    // Breakpoint logic
    breakpoint: breakpointLogic.breakpoint,
    isMobileMenuOpen: breakpointLogic.isMobileMenuOpen,
    toggleMobileMenu: breakpointLogic.toggleMobileMenu,
    closeMobileMenu: breakpointLogic.closeMobileMenu,
    handleMobileMenuBackdrop: breakpointLogic.handleMobileMenuBackdrop,
    handleMobileMenuEscape: breakpointLogic.handleMobileMenuEscape,
    
    // Scroll effects
    isScrolled: scrollEffects.isScrolled,
    isHeaderVisible: scrollEffects.isHeaderVisible,
    
    // Styles
    headerHeight: styles.headerHeight,
    headerStyles: styles.headerStyles,
    containerStyles: styles.containerStyles,
    logoStyles: styles.logoStyles,
    navigationStyles: styles.navigationStyles
  }
}
