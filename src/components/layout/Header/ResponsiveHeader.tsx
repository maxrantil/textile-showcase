// src/components/layout/Header/ResponsiveHeader.tsx
'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import { useHeaderState } from './HeaderState'
import { HeaderLogo } from './HeaderLogo'
import { HeaderNavigation } from './HeaderNavigation'
import { MobileMenu } from './MobileMenu'

const ResponsiveHeader = memo(function ResponsiveHeader() {
  const pathname = usePathname()
  const headerState = useHeaderState()

  return (
    <>
      <header style={headerState.headerStyles} role="banner">
        <div style={headerState.containerStyles}>
          {/* Logo/Brand */}
          <HeaderLogo logoStyles={headerState.logoStyles} />
          
          {/* Navigation */}
          <HeaderNavigation
            breakpoint={headerState.breakpoint}
            pathname={pathname}
            isMobileMenuOpen={headerState.isMobileMenuOpen}
            navigationStyles={headerState.navigationStyles}
            onToggleMobileMenu={headerState.toggleMobileMenu}
          />
        </div>
      </header>

      {/* Mobile Menu */}
      {headerState.breakpoint === 'mobile' && (
        <MobileMenu
          isOpen={headerState.isMobileMenuOpen}
          onClose={headerState.closeMobileMenu}
          pathname={pathname}
        />
      )}
    </>
  )
})

export default ResponsiveHeader
