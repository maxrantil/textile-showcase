// src/components/ui/NavigationArrows.tsx - Complete file with regular CSS classes
'use client'

import { memo } from 'react'

interface NavigationArrowsProps {
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  variant?: 'gallery' | 'project'
  size?: 'small' | 'medium' | 'large'
  position?: 'static' | 'fixed' | 'absolute'
  showOnMobile?: boolean
}

const NavigationArrows = memo(function NavigationArrows({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  size = 'large',
  position = 'fixed',
  variant = 'gallery',
  showOnMobile = false,
}: NavigationArrowsProps) {
  // Size configurations
  const sizeConfig = {
    small: {
      triangleSize: 16,
      clickableWidth: 80,
      padding: 15,
    },
    medium: {
      triangleSize: 24,
      clickableWidth: 100,
      padding: 20,
    },
    large: {
      triangleSize: 32,
      clickableWidth: 120,
      padding: 25,
    },
  }

  const config = sizeConfig[size]
  const triangleSize = config.triangleSize

  // Triangle colors
  const triangleColor = '#a3a3a3'

  // Triangle components with regular CSS classes
  const LeftTriangle = ({ size }: { size: number }) => (
    <div
      className="triangle-left"
      style={{
        width: 0,
        height: 0,
        borderTop: `${Math.round(size * 1.5)}px solid transparent`,
        borderBottom: `${Math.round(size * 1.5)}px solid transparent`,
        borderRight: `${Math.round(size * 1.5)}px solid ${triangleColor}`,
        transition: 'border-color 0.2s ease',
      }}
      aria-hidden="true"
    />
  )

  const RightTriangle = ({ size }: { size: number }) => (
    <div
      className="triangle-right"
      style={{
        width: 0,
        height: 0,
        borderTop: `${Math.round(size * 1.5)}px solid transparent`,
        borderBottom: `${Math.round(size * 1.5)}px solid transparent`,
        borderLeft: `${Math.round(size * 1.5)}px solid ${triangleColor}`,
        transition: 'border-color 0.2s ease',
      }}
      aria-hidden="true"
    />
  )

  // Updated positioning logic
  const getClickableAreaStyle = (
    side: 'left' | 'right'
  ): React.CSSProperties => {
    const baseStyles = {
      width: `${config.clickableWidth}px`,
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
      paddingLeft: side === 'left' ? `${config.padding}px` : 0,
      paddingRight: side === 'right' ? `${config.padding}px` : 0,
      zIndex: 40,
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      opacity: 1,
      transition: 'none',
      [side]: 0,
    } as React.CSSProperties

    // Different positioning based on variant and position prop
    if (variant === 'project' || position === 'absolute') {
      return {
        ...baseStyles,
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        height: '70vh',
        maxHeight: '700px',
        minHeight: '300px',
      }
    } else {
      // Gallery mode - fixed positioning
      return {
        ...baseStyles,
        position: 'fixed',
        top: 0,
        bottom: 0,
        height: '100vh',
      }
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  return (
    <>
      {/* Left Navigation Area */}
      {canScrollLeft && (
        <button
          onClick={onScrollLeft}
          style={getClickableAreaStyle('left')}
          aria-label="Previous image"
          type="button"
          onKeyDown={(e) => handleKeyDown(e, onScrollLeft)}
          data-nav="left"
          className={`nav-button ${showOnMobile ? 'nav-show-mobile' : 'nav-hide-mobile'}`}
        >
          <LeftTriangle size={triangleSize} />
        </button>
      )}

      {/* Right Navigation Area */}
      {canScrollRight && (
        <button
          onClick={onScrollRight}
          style={getClickableAreaStyle('right')}
          aria-label="Next image"
          type="button"
          onKeyDown={(e) => handleKeyDown(e, onScrollRight)}
          data-nav="right"
          className={`nav-button ${showOnMobile ? 'nav-show-mobile' : 'nav-hide-mobile'}`}
        >
          <RightTriangle size={triangleSize} />
        </button>
      )}
    </>
  )
})

export { NavigationArrows }
