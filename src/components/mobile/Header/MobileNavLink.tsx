// src/components/mobile/Header/MobileNavLink.tsx
'use client'
import Link from 'next/link'

interface MobileNavLinkProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}

export function MobileNavLink({
  href,
  children,
  isActive,
  onClick,
}: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      className={`mobile-nav-link nordic-h3 ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
