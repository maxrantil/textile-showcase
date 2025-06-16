// src/components/layout/BackButton.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { scrollManager } from '@/lib/scrollManager'
import { UmamiEvents } from '@/utils/analytics'
import { MobileButton } from '@/components/mobile/UI/MobileButton'
import { DesktopButton } from '@/components/desktop/UI/DesktopButton'

export default function BackButton() {
  const router = useRouter()
  const deviceType = useDeviceType()

  const handleBack = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔙 Back button clicked - returning to gallery')
    }
    UmamiEvents.backToGallery()
    scrollManager.triggerNavigationStart()
    router.back()
  }

  return deviceType === 'mobile' ? (
    <MobileButton
      onClick={handleBack}
      variant="secondary"
      className="touch-feedback"
    >
      ← Back to Gallery
    </MobileButton>
  ) : (
    <DesktopButton onClick={handleBack} variant="secondary">
      ← Back to Gallery
    </DesktopButton>
  )
}
