// src/components/mobile/UI/MobileButton.tsx - Update with better touch feedback
'use client'

import { forwardRef } from 'react'
import { useTouchFeedback } from '@/hooks/mobile/useTouchFeedback'
import { MobileLoadingSpinner } from './MobileLoadingSpinner'

interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  loading?: boolean
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  function MobileButton(
    {
      children,
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      disabled = false,
      loading = false,
      className = '',
      ...props
    },
    ref
  ) {
    const { touchProps } = useTouchFeedback({ disabled: disabled || loading })

    const buttonClasses = [
      'mobile-btn',
      `mobile-btn-${variant}`,
      `mobile-btn-${size}`,
      fullWidth ? 'mobile-btn-full' : '',
      loading ? 'mobile-btn-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...touchProps}
        {...props}
      >
        {loading && <MobileLoadingSpinner size="small" />}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>
      </button>
    )
  }
)
