// src/components/mobile/UI/MobileButton.tsx
'use client'

import { forwardRef } from 'react'
import { BaseButton, BaseButtonProps } from '@/components/ui/BaseButton'
import { useTouchFeedback } from '@/hooks/mobile/useTouchFeedback'

interface MobileButtonProps extends BaseButtonProps {
  hapticFeedback?: boolean
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  function MobileButton(
    { hapticFeedback = true, disabled, loading, onClick, ...props },
    ref
  ) {
    const { touchProps } = useTouchFeedback({
      disabled: disabled || loading,
    })

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Add haptic feedback if enabled and supported
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(50) // Light haptic feedback (50ms)
      }
      onClick?.(e)
    }

    return (
      <BaseButton
        ref={ref}
        disabled={disabled}
        loading={loading}
        className={`btn-mobile ${props.className || ''}`}
        onClick={handleClick}
        {...touchProps}
        {...props}
      />
    )
  }
)
