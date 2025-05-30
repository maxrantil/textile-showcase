'use client'

import { memo } from 'react'

interface NavigationArrowsProps {
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  position?: 'fixed' | 'absolute'
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'minimal' | 'bold'
}

const NavigationArrows = memo(function NavigationArrows({ 
  canScrollLeft, 
  canScrollRight, 
  onScrollLeft, 
  onScrollRight,
  position = 'fixed',
  size = 'medium',
  variant = 'default'
}: NavigationArrowsProps) {
  // Size configurations
  const sizeConfig = {
    small: { width: '40px', height: '40px', fontSize: '16px' },
    medium: { width: '60px', height: '60px', fontSize: '20px' },
    large: { width: '80px', height: '80px', fontSize: '24px' }
  }
  
  // Variant configurations
  const variantConfig = {
    default: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      color: '#333'
    },
    minimal: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(5px)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      color: '#333'
    },
    bold: {
      background: '#333',
      backdropFilter: 'none',
      border: 'none',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      color: '#fff'
    }
  }

  const baseStyle = {
    ...sizeConfig[size],
    ...variantConfig[variant],
    position,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: position === 'fixed' ? 10 : 5,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    outline: 'none'
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget
    if (variant === 'default' || variant === 'minimal') {
      target.style.background = 'rgba(255, 255, 255, 1)'
      target.style.transform = 'translateY(-50%) scale(1.1)'
    } else {
      target.style.background = '#000'
      target.style.transform = 'translateY(-50%) scale(1.1)'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget
    target.style.background = variantConfig[variant].background
    target.style.transform = 'translateY(-50%) scale(1)'
  }

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = '2px solid #333'
    e.currentTarget.style.outlineOffset = '2px'
  }

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = 'none'
  }

  return (
    <>
      {canScrollLeft && (
        <button
          onClick={onScrollLeft}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ ...baseStyle, left: '20px' }}
          aria-label="Previous image"
          type="button"
          // Add keyboard navigation
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onScrollLeft()
            }
          }}
        >
          <span 
            style={{ 
              display: 'inline-block',
              transition: 'transform 0.2s ease'
            }}
            aria-hidden="true"
          >
            ←
          </span>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={onScrollRight}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ ...baseStyle, right: '20px' }}
          aria-label="Next image"
          type="button"
          // Add keyboard navigation
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onScrollRight()
            }
          }}
        >
          <span 
            style={{ 
              display: 'inline-block',
              transition: 'transform 0.2s ease'
            }}
            aria-hidden="true"
          >
            →
          </span>
        </button>
      )}
    </>
  )
})

export default NavigationArrows
