// src/components/desktop/Header/DesktopHeader.tsx
'use client'

import { DesktopLogo } from './DesktopLogo'
import { DesktopNavigation } from './DesktopNavigation'
import { useHeaderScrollEffects } from '@/hooks/desktop/useHeaderScrollEffects'
import styles from './DesktopHeader.module.css'

export function DesktopHeader() {
  const { isScrolled, isHeaderVisible } = useHeaderScrollEffects()

  return (
    <header
      className={`desktop-header ${isScrolled ? 'scrolled' : ''} ${isHeaderVisible ? styles.headerVisible : styles.headerHidden}`}
    >
      <div className="desktop-header-content">
        <DesktopLogo />
        <DesktopNavigation />
      </div>
    </header>
  )
}
