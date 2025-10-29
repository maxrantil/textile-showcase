// ABOUTME: Mobile header component with logo, hamburger menu, and navigation state management
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MobileMenu } from './MobileMenu'
import { HamburgerButton } from './HamburgerButton'
import { MobileLogo } from './MobileLogo'

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header-content">
          <MobileLogo />
          <HamburgerButton
            isOpen={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </div>
      </header>
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        pathname={pathname ?? '/'}
      />
    </>
  )
}
