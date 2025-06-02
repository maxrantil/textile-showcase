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

const buttonVariants = {
  primary: {
    backgroundColor: '#333',
    color: '#fff',
    border: '2px solid #333',
    ':hover': {
      backgroundColor: '#000',
      borderColor: '#000'
    }
  },
  secondary: {
    backgroundColor: '#666',
    color: '#fff',
    border: '2px solid #666',
    ':hover': {
      backgroundColor: '#333',
      borderColor: '#333'
    }
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#333',
    border: '2px solid #333',
    ':hover': {
      backgroundColor: '#333',
      color: '#fff'
    }
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#333',
    border: '1px solid #ddd',
    ':hover': {
      backgroundColor: '#f9f9f9',
      borderColor: '#333'
    }
  }
}

const buttonSizes = {
  small: {
    padding: '8px 16px',
    fontSize: '12px',
    letterSpacing: '0.5px'
  },
  medium: {
    padding: '12px 24px',
    fontSize: '14px',
    letterSpacing: '1px'
  },
  large: {
    padding: '16px 32px',
    fontSize: '14px',
    letterSpacing: '1px'
  }
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
  
  const baseStyle: React.CSSProperties = {
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
    ...buttonSizes[size],
    ...buttonVariants[variant],
    ...(isHovered && !disabled && !loading ? buttonVariants[variant][':hover'] : {}),
    ...style
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
      style={baseStyle}
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
