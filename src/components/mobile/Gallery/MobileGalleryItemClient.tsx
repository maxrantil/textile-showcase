// ABOUTME: Client-side click handler and analytics wrapper for mobile gallery items

'use client'

import Link from 'next/link'
import { UmamiEvents } from '@/utils/analytics'
import type { ReactNode } from 'react'

interface MobileGalleryItemClientProps {
  href: string
  ariaLabel: string
  index: number
  isActive: boolean
  designTitle: string
  designYear?: number
  children: ReactNode
}

export function MobileGalleryItemClient({
  href,
  ariaLabel,
  index,
  isActive,
  designTitle,
  designYear,
  children,
}: MobileGalleryItemClientProps) {
  const handleClick = () => {
    // Save focus index BEFORE navigation for restoration (WCAG 2.4.3)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('galleryFocusIndex', index.toString())
    }

    // Track project view
    UmamiEvents.viewProject(designTitle, designYear)
  }

  return (
    <Link
      href={href}
      className="mobile-gallery-item"
      onClick={handleClick}
      aria-label={ariaLabel}
      data-testid={`gallery-item-${index}`}
      data-active={isActive}
    >
      {children}
    </Link>
  )
}
