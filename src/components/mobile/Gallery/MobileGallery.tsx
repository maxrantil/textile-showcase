// ABOUTME: Mobile gallery component with vertical scrolling layout

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { TextileDesign } from '@/types/textile'
import MobileGalleryItem from './MobileGalleryItem'
import styles from './MobileGallery.module.css'

interface MobileGalleryProps {
  designs: TextileDesign[]
}

export default function MobileGallery({ designs }: MobileGalleryProps) {
  const pathname = usePathname()
  const mountTimeRef = useRef(Date.now()) // Track when component mounts

  // Phase 4: Hide static first image AFTER first gallery image loads AND minimum display time
  // Issue #229: Align MobileGallery with Desktop Gallery pattern (hide FirstImage after load)
  // Issue #132: Ensures FirstImage visible for minimum time (allows E2E tests to verify + prevents CLS flash)
  // Issue #136: Fixed race condition on slow 3G - network-aware timing + proper image load detection
  useEffect(() => {
    // Network-aware minimum display time (Issue #136 - performance-optimizer recommendation)
    const getNetworkAwareMinDisplayTime = (): number => {
      // @ts-expect-error - effectiveType is experimental but widely supported
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

      if (connection) {
        const effectiveType = connection.effectiveType

        switch (effectiveType) {
          case 'slow-2g':
            return 2000
          case '2g':
            return 1500
          case '3g':
            return 1000
          case '4g':
            // Issue #136: Use 800ms even for 4G to handle:
            // 1. Simulated slow networks in tests (can't detect via Network API)
            // 2. Cache misses on fast networks
            // 3. CDN delays
            return 800
          default:
            return 300
        }
      }

      return 1000 // Conservative default (Issue #136: handles slow 3G when network API unavailable)
    }

    const MIN_DISPLAY_TIME = getNetworkAwareMinDisplayTime()
    console.log('[MobileGallery][FirstImage] MIN_DISPLAY_TIME:', MIN_DISPLAY_TIME, 'ms')

    const hideFirstImage = () => {
      const staticFirstImage = document.querySelector(
        '[data-first-image="true"]'
      ) as HTMLElement
      if (staticFirstImage) {
        // CSP compliant: Use CSS class instead of inline styles
        staticFirstImage.classList.add(styles.firstImageHidden)
        console.log('[MobileGallery][FirstImage] Hidden after gallery image loaded')
      }
    }

    const hideWithMinimumTime = () => {
      const elapsed = Date.now() - mountTimeRef.current
      const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed)

      console.log('[MobileGallery][FirstImage] Hiding after', remaining, 'ms (elapsed:', elapsed, 'ms)')
      setTimeout(hideFirstImage, remaining)
    }

    // Wait for first gallery image to exist AND fully load
    const checkForGalleryImage = () => {
      const firstGalleryImg = document.querySelector(
        '.mobile-gallery-image'
      ) as HTMLImageElement

      if (firstGalleryImg) {
        console.log('[MobileGallery][FirstImage] Gallery image found in DOM')

        // Check if image is truly loaded with valid dimensions (Issue #136 fix)
        const isImageLoaded = firstGalleryImg.complete &&
                             firstGalleryImg.naturalWidth > 0 &&
                             firstGalleryImg.naturalHeight > 0

        if (isImageLoaded) {
          console.log('[MobileGallery][FirstImage] Gallery image already loaded')
          hideWithMinimumTime()
        } else {
          // Wait for image load with proper cleanup
          console.log('[MobileGallery][FirstImage] Waiting for gallery image to load')

          let hasLoaded = false

          const handleLoad = () => {
            if (hasLoaded) return
            hasLoaded = true
            console.log('[MobileGallery][FirstImage] Gallery image loaded event fired')
            hideWithMinimumTime()
          }

          firstGalleryImg.addEventListener('load', handleLoad, { once: true })

          // Backup: Check if image becomes complete during wait
          const checkComplete = setInterval(() => {
            if (firstGalleryImg.complete && firstGalleryImg.naturalWidth > 0) {
              clearInterval(checkComplete)
              handleLoad()
            }
          }, 100)

          // Cleanup interval after fallback time
          setTimeout(() => clearInterval(checkComplete), 20000)
        }
      } else {
        // Gallery image not in DOM yet, retry
        console.log('[MobileGallery][FirstImage] Gallery image not found, retrying in 100ms')
        setTimeout(checkForGalleryImage, 100)
      }
    }

    // Start checking for gallery image
    checkForGalleryImage()

    // Fallback: hide after 20s (increased for slow 3G - Issue #136)
    const fallbackTimer = setTimeout(() => {
      console.log('[MobileGallery][FirstImage] Fallback timer triggered (20s)')
      hideFirstImage()
    }, 20000)

    return () => {
      clearTimeout(fallbackTimer)
    }
  }, [])

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

  if (!designs || designs.length === 0) {
    return (
      <section
        className="mobile-gallery"
        aria-label="Mobile textile gallery"
        data-testid="mobile-gallery"
      >
        <div className="mobile-gallery-empty" role="status" aria-live="polite">
          No designs available to display
        </div>
      </section>
    )
  }

  return (
    <section
      className="mobile-gallery"
      aria-label="Mobile textile gallery"
      data-testid="mobile-gallery"
    >
      {designs.map((design, index) => (
        <MobileGalleryItem
          key={design._id}
          design={design}
          index={index}
          isPriority={index < 2}
          isActive={index === 0}
        />
      ))}
    </section>
  )
}
