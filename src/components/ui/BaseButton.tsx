// src/components/ui/BaseButton.tsx
'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export interface BaseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'submit'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

export const BaseButton = forwardRef<HTMLButtonElement, BaseButtonProps>(
  function BaseButton(
    {
      variant = 'secondary',
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
    // Build Nordic classes
    const baseClasses = 'nordic-btn'

    const variantClass = (() => {
      switch (variant) {
        case 'primary':
          return 'nordic-btn-primary'
        case 'ghost':
          return 'nordic-btn-ghost'
        case 'submit':
          return 'nordic-btn-submit'
        default:
          return 'nordic-btn-secondary'
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
        {loading ? (
          <>
            <LoadingSpinner size="small" />
            <span style={{ marginLeft: '8px' }}>Sending...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
