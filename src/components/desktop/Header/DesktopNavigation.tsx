// src/components/desktop/Header/DesktopNavigation.tsx
'use client'

import { usePathname } from 'next/navigation'
import { DesktopNavLink } from './DesktopNavLink'

export function DesktopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="desktop-nav">
      <DesktopNavLink href="/" isActive={pathname === '/'}>
        WORK
      </DesktopNavLink>
      <DesktopNavLink href="/about" isActive={pathname === '/about'}>
        ABOUT
      </DesktopNavLink>
      <DesktopNavLink href="/contact" isActive={pathname === '/contact'}>
        CONTACT
      </DesktopNavLink>
    </nav>
  )
}
