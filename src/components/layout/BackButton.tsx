'use client'

import { useRouter } from 'next/navigation'
import { scrollManager } from '@/lib/scrollManager'
import { UmamiEvents } from '@/utils/analytics'

export default function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔙 Back button clicked - navigating to previous page')
    }

    // Track back button usage
    UmamiEvents.backToGallery()

    // Save current position before going back (if any)
    const container = document.querySelector(
      '[data-scroll-container]'
    ) as HTMLElement
    if (container) {
      const currentIndex = parseInt(
        container.getAttribute('data-current-index') || '0',
        10
      )
      scrollManager.saveImmediate(currentIndex, window.location.pathname)
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Saved current index ${currentIndex} before going back`)
      }
    }

    scrollManager.debug()
    scrollManager.triggerNavigationStart()
    router.back()
    scrollManager.triggerNavigationComplete()
  }

  return (
    <button
      onClick={handleBack}
      className="btn-mobile btn-mobile-secondary touch-feedback"
    >
      ← Back to Gallery
    </button>
  )
}
