// src/components/desktop/Header/DesktopLogo.tsx
'use client'

import Link from 'next/link'
import { UmamiEvents } from '@/utils/analytics'

export function DesktopLogo() {
  return (
    <Link
      href="/"
      className="desktop-logo"
      onClick={() => UmamiEvents.navigateHome()}
    >
      IDA ROMME
    </Link>
  )
}
