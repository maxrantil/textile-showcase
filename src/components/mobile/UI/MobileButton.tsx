// src/components/mobile/UI/MobileButton.tsx
'use client'
import { forwardRef, ButtonHTMLAttributes } from 'react'

interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'submit'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  fullWidth?: boolean
  hapticFeedback?: boolean
  children: React.ReactNode
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  function MobileButton(
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      hapticFeedback = true,
      disabled,
      children,
      className = '',
      style,
      type = 'button',
      onClick,
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
      // Ensure adequate touch targets on mobile
      minHeight: '44px',
      // Add touch-specific styles
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation',
      ...style,
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Add haptic feedback if enabled and supported
      if (
        hapticFeedback &&
        typeof navigator.vibrate === 'function' &&
        !disabled &&
        !loading
      ) {
        navigator.vibrate(50) // Light haptic feedback (50ms)
      }
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClasses}
        style={combinedStyles}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)
