// src/components/layout/BackButton.tsx - Updated for simple scroll manager
'use client'

import { useRouter } from 'next/navigation'
import { UmamiEvents } from '@/utils/analytics'

export default function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔙 Back button clicked - returning to gallery')
    }

    UmamiEvents.backToGallery()

    // Simply go back - the gallery will restore position automatically
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
