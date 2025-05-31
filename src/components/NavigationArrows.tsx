'use client'

import { memo } from 'react'

interface NavigationArrowsProps {
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  position?: "fixed" | "absolute" | "static" | undefined
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
    small: { width: '60px', height: '60px', triangleSize: '24px' },
    medium: { width: '80px', height: '80px', triangleSize: '32px' },
    large: { width: '100px', height: '100px', triangleSize: '40px' }
  }
  
  // Variant configurations
  const variantConfig = {
    default: {
      background: 'transparent',
      backdropFilter: 'none',
      border: 'none',
      boxShadow: 'none',
      triangleColor: '#f1f1f1', // Default grey
      triangleColorHover: '#e6e6e6' // Grey for hover
    },
    minimal: {
      background: 'transparent',
      backdropFilter: 'none',
      border: 'none',
      boxShadow: 'none',
      triangleColor: '#f1f1f1', // Default grey
      triangleColorHover: '#e6e6e6' // Grey for hover
    },
    bold: {
      background: 'transparent',
      backdropFilter: 'none',
      border: 'none',
      boxShadow: 'none',
      triangleColor: '#f1f1f1', // Default grey
      triangleColorHover: '#e6e6e6' // Grey for hover
    }
  }

  const baseStyle: React.CSSProperties = {
    width: sizeConfig[size].width,
    height: sizeConfig[size].height,
    background: variantConfig[variant].background,
    backdropFilter: variantConfig[variant].backdropFilter,
    border: variantConfig[variant].border,
    boxShadow: variantConfig[variant].boxShadow,
    position,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: position === 'fixed' ? 10 : 5,
    borderRadius: '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
    padding: '0',
    margin: '0'
  }

  // Triangle component for left arrow (pointing left)
  const LeftTriangle = ({ size, color }: { size: string, color: string }) => {
    const sizeNum = parseInt(size)
    const verticalSize = `${Math.round(sizeNum * 1.5)}px`
    const horizontalSize = `${Math.round(sizeNum * 1.5)}px`
    
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: `${verticalSize} solid transparent`,
          borderBottom: `${verticalSize} solid transparent`,
          borderRight: `${horizontalSize} solid ${color}`,
          transition: 'border-color 0.2s ease'
        }}
        aria-hidden="true"
      />
    )
  }

  // Triangle component for right arrow (pointing right)
  const RightTriangle = ({ size, color }: { size: string, color: string }) => {
    const sizeNum = parseInt(size)
    const verticalSize = `${Math.round(sizeNum * 1.5)}px`
    const horizontalSize = `${Math.round(sizeNum * 1.5)}px`
    
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: `${verticalSize} solid transparent`,
          borderBottom: `${verticalSize} solid transparent`,
          borderLeft: `${horizontalSize} solid ${color}`,
          transition: 'border-color 0.2s ease'
        }}
        aria-hidden="true"
      />
    )
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const triangle = e.currentTarget.querySelector('div') as HTMLElement
    if (triangle) {
      // Change triangle color on hover
      const hoverColor = variantConfig[variant].triangleColorHover
      if (triangle.style.borderRight) {
        triangle.style.borderRightColor = hoverColor
      }
      if (triangle.style.borderLeft) {
        triangle.style.borderLeftColor = hoverColor
      }
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const triangle = e.currentTarget.querySelector('div') as HTMLElement
    if (triangle) {
      // Reset triangle color
      const defaultColor = variantConfig[variant].triangleColor
      if (triangle.style.borderRight) {
        triangle.style.borderRightColor = defaultColor
      }
      if (triangle.style.borderLeft) {
        triangle.style.borderLeftColor = defaultColor
      }
    }
  }
  return (
    <>
      {canScrollLeft && (
        <button
          onClick={onScrollLeft}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ ...baseStyle, left: '20px' }}
          aria-label="Previous image"
          type="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onScrollLeft()
            }
          }}
        >
          <LeftTriangle 
            size={sizeConfig[size].triangleSize} 
            color={variantConfig[variant].triangleColor} 
          />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={onScrollRight}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ ...baseStyle, right: '20px' }}
          aria-label="Next image"
          type="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onScrollRight()
            }
          }}
        >
          <RightTriangle 
            size={sizeConfig[size].triangleSize} 
            color={variantConfig[variant].triangleColor} 
          />
        </button>
      )}
    </>
  )
})

export default NavigationArrows
