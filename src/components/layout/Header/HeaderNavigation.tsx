// src/components/layout/Header/HeaderNavigation.tsx
'use client'

import { memo } from 'react'
import { DesktopNavigation } from './DesktopNavigation'
import { HamburgerButton } from './HamburgerButton'

interface HeaderNavigationProps {
  breakpoint: 'mobile' | 'tablet' | 'desktop'
  pathname: string
  isMobileMenuOpen: boolean
  navigationStyles: React.CSSProperties
  onToggleMobileMenu: () => void
}

export const HeaderNavigation = memo(function HeaderNavigation({
  breakpoint,
  pathname,
  isMobileMenuOpen,
  navigationStyles,
  onToggleMobileMenu
}: HeaderNavigationProps) {
  return (
    <nav 
      style={navigationStyles}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Desktop menu */}
      {breakpoint !== 'mobile' && <DesktopNavigation pathname={pathname} />}

      {/* Mobile menu button */}
      {breakpoint === 'mobile' && (
        <HamburgerButton
          isOpen={isMobileMenuOpen}
          onClick={onToggleMobileMenu}
        />
      )}
    </nav>
  )
})
