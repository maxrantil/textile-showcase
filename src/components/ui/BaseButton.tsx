// src/components/ui/BaseButton.tsx
'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export interface BaseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

export const BaseButton = forwardRef<HTMLButtonElement, BaseButtonProps>(
  function BaseButton(
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      style,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    // Get base mobile button classes (matching your old implementation)
    const baseClasses = `btn-mobile touch-feedback ${className}`

    // Get variant classes (matching your old implementation)
    const variantClasses = (() => {
      switch (variant) {
        case 'primary':
          return 'btn-mobile-primary'
        case 'secondary':
          return 'btn-mobile-secondary'
        case 'outline':
          return 'btn-mobile-secondary' // Your test expects this
        case 'ghost':
          return 'btn-mobile-ghost'
        default:
          return 'btn-mobile-secondary'
      }
    })()

    // Size adjustments (matching your old implementation)
    const sizeStyles: React.CSSProperties = (() => {
      switch (size) {
        case 'small':
          return { padding: '8px 16px', fontSize: '14px' }
        case 'large':
          return { padding: '16px 32px', fontSize: '16px' }
        default:
          return {}
      }
    })()

    const combinedClasses = `${baseClasses} ${variantClasses}`

    const combinedStyles: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.6 : 1,
      ...sizeStyles,
      ...style,
    }

    // Mouse event handlers (matching your old implementation)
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        onMouseEnter?.(e)
      }
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseLeave?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
      onBlur?.(e)
    }

    return (
      <button
        ref={ref}
        className={combinedClasses}
        style={combinedStyles}
        disabled={disabled || loading}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {loading && <LoadingSpinner size="small" />}
        {loading ? 'Loading...' : children}
      </button>
    )
  }
)
