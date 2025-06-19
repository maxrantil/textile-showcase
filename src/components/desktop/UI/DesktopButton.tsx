// src/components/desktop/UI/DesktopButton.tsx
'use client'

import { forwardRef } from 'react'
import { BaseButton, BaseButtonProps } from '@/components/ui/BaseButton'
import { useHoverEffects } from '@/hooks/desktop/useHoverEffects'

interface DesktopButtonProps extends BaseButtonProps {
  hoverAnimation?: boolean
}

const DesktopButton = forwardRef<HTMLButtonElement, DesktopButtonProps>(
  function DesktopButton({ hoverAnimation = true, ...props }, ref) {
    const { hoverProps } = useHoverEffects()

    return (
      <BaseButton
        ref={ref}
        className={`btn-desktop ${props.className || ''}`}
        {...(hoverAnimation ? hoverProps : {})}
        {...props}
      />
    )
  }
)

// Default export
export default DesktopButton

// Also export as named export for flexibility
export { DesktopButton }
