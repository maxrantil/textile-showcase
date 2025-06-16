// src/components/desktop/Header/DesktopNavLink.tsx
'use client'

import Link from 'next/link'
import { UmamiEvents } from '@/utils/analytics'

interface DesktopNavLinkProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
}

export function DesktopNavLink({
  href,
  children,
  isActive,
}: DesktopNavLinkProps) {
  const handleClick = () => {
    switch (href) {
      case '/':
        UmamiEvents.navigateHome()
        break
      case '/about':
        UmamiEvents.navigateToAbout()
        break
      case '/contact':
        UmamiEvents.navigateToContact()
        break
    }
  }

  return (
    <Link
      href={href}
      className={`desktop-nav-link ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      {children}
      {isActive && <span className="desktop-nav-indicator" />}
    </Link>
  )
}
