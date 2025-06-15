'use client'
import { forwardRef, ForwardedRef, ButtonHTMLAttributes } from 'react'
import { useHoverEffects } from '@/hooks/desktop/useHoverEffects'

interface DesktopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary'
  children: React.ReactNode
}

function DesktopButtonComponent(
  props: DesktopButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const { children, variant = 'primary', ...otherProps } = props
  const { hoverProps } = useHoverEffects()

  return (
    <button
      ref={ref}
      className={`desktop-btn desktop-btn-${variant}`}
      {...hoverProps}
      {...otherProps}
    >
      {children}
    </button>
  )
}

export const DesktopButton = forwardRef(DesktopButtonComponent)
