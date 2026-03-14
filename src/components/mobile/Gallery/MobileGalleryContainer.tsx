// ABOUTME: Client wrapper for mobile gallery focus restoration (WCAG 2.4.3)

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

interface MobileGalleryContainerProps {
  children: ReactNode
}

export function MobileGalleryContainer({
  children,
}: MobileGalleryContainerProps) {
  const pathname = usePathname()

  // Focus restoration effect for WCAG 2.4.3 compliance
  // Restores keyboard focus to previously selected gallery item after back navigation
  useEffect(() => {
    const savedFocusIndex = sessionStorage.getItem('galleryFocusIndex')
    if (savedFocusIndex !== null && pathname === '/') {
      const focusIndex = parseInt(savedFocusIndex, 10)

      // Mobile-specific timing: 250ms (50ms more than Desktop's 200ms)
      // Allows time for vertical layout reflow and browser scroll restoration
      setTimeout(() => {
        const galleryItem = document.querySelector(
          `[data-testid="gallery-item-${focusIndex}"]`
        ) as HTMLElement

        if (galleryItem) {
          galleryItem.focus()
          sessionStorage.removeItem('galleryFocusIndex')
        }
      }, 250)
    }
  }, [pathname])

  return <>{children}</>
}
