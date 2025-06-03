// src/components/ui/Button.tsx
'use client'

import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  
  // Base styles that apply to all buttons
  const baseStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    fontWeight: 500,
    textTransform: 'uppercase',
    borderRadius: '6px',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
  }

  // Size styles
  const sizeStyles: React.CSSProperties = (() => {
    switch (size) {
      case 'small':
        return { padding: '8px 16px', fontSize: '12px', letterSpacing: '0.5px' }
      case 'medium':
        return { padding: '12px 24px', fontSize: '14px', letterSpacing: '1px' }
      case 'large':
        return { padding: '16px 32px', fontSize: '14px', letterSpacing: '1px' }
      default:
        return {}
    }
  })()

  // Variant styles
  const variantStyles: React.CSSProperties = (() => {
    const isInteractive = !disabled && !loading
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered && isInteractive ? '#000' : '#333',
          color: '#fff',
          border: `2px solid ${isHovered && isInteractive ? '#000' : '#333'}`,
        }
      case 'secondary':
        return {
          backgroundColor: isHovered && isInteractive ? '#333' : '#666',
          color: '#fff',
          border: `2px solid ${isHovered && isInteractive ? '#333' : '#666'}`,
        }
      case 'outline':
        return {
          backgroundColor: isHovered && isInteractive ? '#333' : 'transparent',
          color: isHovered && isInteractive ? '#fff' : '#333',
          border: '2px solid #333',
        }
      case 'ghost':
        return {
          backgroundColor: isHovered && isInteractive ? '#f9f9f9' : 'transparent',
          color: '#333',
          border: `1px solid ${isHovered && isInteractive ? '#333' : '#ddd'}`,
        }
      default:
        return {}
    }
  })()

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles,
    ...variantStyles,
    ...style, // User styles override everything
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      setIsHovered(true)
      onMouseEnter?.(e)
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false)
    onMouseLeave?.(e)
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={combinedStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={(e) => {
        setIsHovered(true)
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsHovered(false)
        props.onBlur?.(e)
      }}
    >
      {loading && <LoadingSpinner size="small" />}
      {loading ? 'Loading...' : children}
    </button>
  )
}

// Pre-configured button variants for common use cases
export const BackButton = ({ children = '← Back to Gallery', ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="outline" {...props}>
    {children}
  </Button>
)

export const SubmitButton = ({ children = 'Submit', ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props}>
    {children}
  </Button>
)

export const CancelButton = ({ children = 'Cancel', ...props }: Omit<ButtonProps, 'variant'>) => (
  <Button variant="ghost" {...props}>
    {children}
  </Button>
)
