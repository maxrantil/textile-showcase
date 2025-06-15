// src/components/desktop/Header/DesktopHeader.tsx
'use client'

import { DesktopLogo } from './DesktopLogo'
import { DesktopNavigation } from './DesktopNavigation'
import { useHeaderScrollEffects } from '@/hooks/desktop/useHeaderScrollEffects'

export function DesktopHeader() {
  const { isScrolled, isHeaderVisible } = useHeaderScrollEffects()

  return (
    <header
      className={`desktop-header ${isScrolled ? 'scrolled' : ''}`}
      style={{
        transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <div className="desktop-header-content">
        <DesktopLogo />
        <DesktopNavigation />
      </div>
    </header>
  )
}
