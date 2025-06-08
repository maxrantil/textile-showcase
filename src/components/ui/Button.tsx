'use client'

import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

export default function Button({
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
}: ButtonProps) {
  // Get base mobile button classes
  const baseClasses = `btn-mobile touch-feedback ${className}`

  // Get variant classes
  const variantClasses = (() => {
    switch (variant) {
      case 'primary':
        return 'btn-mobile-primary'
      case 'secondary':
        return 'btn-mobile-secondary'
      case 'ghost':
        return 'btn-mobile-ghost'
      default:
        return 'btn-mobile-secondary'
    }
  })()

  // Size adjustments (mobile utilities handle base sizing)
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
      {...props}
      disabled={disabled || loading}
      className={combinedClasses}
      style={combinedStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {loading && <LoadingSpinner size="small" />}
      {loading ? 'Loading...' : children}
    </button>
  )
}

// Pre-configured button variants for common use cases
export const BackButton = ({
  children = '← Back to Gallery',
  ...props
}: Omit<ButtonProps, 'variant'>) => (
  <Button variant="outline" {...props}>
    {children}
  </Button>
)

export const SubmitButton = ({
  children = 'Submit',
  ...props
}: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props}>
    {children}
  </Button>
)

export const CancelButton = ({
  children = 'Cancel',
  ...props
}: Omit<ButtonProps, 'variant'>) => (
  <Button variant="ghost" {...props}>
    {children}
  </Button>
)
