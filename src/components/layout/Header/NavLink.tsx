'use client'

import { memo } from 'react'
import Link from 'next/link'
import { UmamiEvents } from '@/utils/analytics'
import { RESPONSIVE_CONFIG } from '@/config/responsiveConfig'

interface NavLinkProps {
  href: string
  label: string
  isActive: boolean
  isMobile?: boolean
  onClick?: () => void
}

export const NavLink = memo(function NavLink({
  href,
  label,
  isActive,
  isMobile = false,
  onClick,
}: NavLinkProps) {
  const handleClick = () => {
    // Track navigation
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
    onClick?.()
  }

  const linkStyles: React.CSSProperties = {
    fontSize: isMobile
      ? RESPONSIVE_CONFIG.typography.bodyLarge
      : RESPONSIVE_CONFIG.typography.bodySmall,
    letterSpacing: '1px',
    color: isActive ? '#666' : '#333',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    position: 'relative',
    padding: isMobile ? '16px 0' : '8px 0',
    display: 'block',
    // Mobile touch target
    ...(isMobile && {
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center',
    }),
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      style={linkStyles}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = isActive ? '#666' : '#333')
      }
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
      {/* Active indicator */}
      {isActive && (
        <span
          style={{
            position: 'absolute',
            bottom: isMobile ? '12px' : '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            borderRadius: '1px',
          }}
          aria-hidden="true"
        />
      )}
    </Link>
  )
})
