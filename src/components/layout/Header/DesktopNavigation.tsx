'use client'

import { memo } from 'react'
import { NavLink } from './NavLink'

// Navigation items configuration
const NAV_ITEMS = [
  { href: '/', label: 'WORK', exact: true },
  { href: '/about', label: 'ABOUT', exact: false },
  { href: '/contact', label: 'CONTACT', exact: false },
] as const

interface DesktopNavigationProps {
  pathname: string
}

export const DesktopNavigation = memo(function DesktopNavigation({
  pathname,
}: DesktopNavigationProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          isActive={
            item.exact ? pathname === item.href : pathname.startsWith(item.href)
          }
          isMobile={false}
        />
      ))}
    </div>
  )
})
