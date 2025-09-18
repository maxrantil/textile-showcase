// ABOUTME: Font preloader component for critical fonts optimization

'use client'

import { useEffect } from 'react'
import { type FontConfig } from '@/utils/font-optimization'

interface FontPreloaderProps {
  fonts?: FontConfig[]
}

/**
 * Component to preload critical fonts for better performance
 */
export function FontPreloader({ fonts = [] }: FontPreloaderProps) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Default critical fonts if none provided
    const defaultFonts: FontConfig[] = [
      {
        family: 'Inter',
        weight: 400,
        display: 'block',
        url: '/fonts/inter-400.woff2',
      },
      {
        family: 'Inter',
        weight: 500,
        display: 'block',
        url: '/fonts/inter-500.woff2',
      },
    ]

    const fontsToPreload = fonts.length > 0 ? fonts : defaultFonts

    // Add preload links for critical fonts
    fontsToPreload.forEach((font) => {
      if (font.display === 'block') {
        const existingLink = document.querySelector(
          `link[rel="preload"][href="${font.url}"]`
        )

        if (!existingLink) {
          const link = document.createElement('link')
          link.rel = 'preload'
          link.href = font.url
          link.as = 'font'
          link.type = 'font/woff2'
          link.crossOrigin = 'anonymous'
          document.head.appendChild(link)
        }
      }
    })
  }, [fonts])

  // This component doesn't render anything visible
  return null
}

export default FontPreloader
