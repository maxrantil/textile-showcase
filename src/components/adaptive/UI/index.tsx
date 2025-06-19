// src/components/adaptive/UI/index.tsx
'use client'

import { forwardRef } from 'react'
import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileButton } from '@/components/mobile/UI/MobileButton'
import { DesktopButton } from '@/components/desktop/UI/DesktopButton'
import { BaseButtonProps } from '@/components/ui/BaseButton'

interface AdaptiveButtonProps extends BaseButtonProps {
  // Platform-specific props (optional)
  mobileProps?: {
    hapticFeedback?: boolean
  }
  desktopProps?: {
    hoverAnimation?: boolean
  }
}

export const AdaptiveButton = forwardRef<
  HTMLButtonElement,
  AdaptiveButtonProps
>(function AdaptiveButton({ mobileProps, desktopProps, ...baseProps }, ref) {
  const deviceType = useDeviceType()

  return deviceType === 'mobile' ? (
    <MobileButton ref={ref} {...baseProps} {...mobileProps} />
  ) : (
    <DesktopButton ref={ref} {...baseProps} {...desktopProps} />
  )
})
