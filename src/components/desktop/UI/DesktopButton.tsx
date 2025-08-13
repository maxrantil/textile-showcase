// src/components/desktop/UI/DesktopButton.tsx
'use client'
import { forwardRef, ButtonHTMLAttributes } from 'react'

interface DesktopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'submit'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

const DesktopButton = forwardRef<HTMLButtonElement, DesktopButtonProps>(
  function DesktopButton(
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      style,
      type = 'button',
      ...props
    },
    ref
  ) {
    // Use Nordic button classes consistently
    const baseClasses = 'nordic-btn'

    const variantClass = (() => {
      switch (variant) {
        case 'secondary':
          return 'nordic-btn-secondary'
        case 'ghost':
          return 'nordic-btn-ghost'
        case 'submit':
          return 'nordic-btn-submit'
        default:
          return 'nordic-btn-primary'
      }
    })()

    const sizeClass = (() => {
      switch (size) {
        case 'small':
          return 'nordic-btn-sm'
        case 'large':
          return 'nordic-btn-lg'
        default:
          return ''
      }
    })()

    const loadingClass = loading ? 'nordic-btn-loading' : ''

    const combinedClasses = [
      baseClasses,
      variantClass,
      sizeClass,
      loadingClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const combinedStyles: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
      ...style,
    }

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClasses}
        style={combinedStyles}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? 'Sending...' : children}
      </button>
    )
  }
)

// Default export
export default DesktopButton
// Also export as named export for flexibility
export { DesktopButton }
