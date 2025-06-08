// src/components/layout/Header/HeaderLogo.tsx
'use client'

import { memo } from 'react'
import Link from 'next/link'
import { UmamiEvents } from '@/utils/analytics'

interface HeaderLogoProps {
  logoStyles: React.CSSProperties
}

export const HeaderLogo = memo(function HeaderLogo({
  logoStyles,
}: HeaderLogoProps) {
  return (
    <Link
      href="/"
      style={logoStyles}
      onClick={() => UmamiEvents.navigateHome()}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#333')}
      aria-label="Ida Romme - Home"
    >
      IDA ROMME (this is a work in progress)
    </Link>
  )
})
