// src/components/layout/BackButton.tsx - Updated
'use client'

import { useRouter } from 'next/navigation'
import { scrollManager } from '@/lib/scrollManager'
import { UmamiEvents } from '@/utils/analytics'

export default function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔙 Back button clicked - returning to gallery')
    }

    UmamiEvents.backToGallery()

    // Mark navigation start for smooth restoration
    scrollManager.triggerNavigationStart()

    // Go back - the gallery will restore position automatically
    router.back()
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
