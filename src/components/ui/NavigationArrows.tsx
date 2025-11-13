// src/components/ui/NavigationArrows.tsx - Complete file with regular CSS classes
'use client'

import { memo } from 'react'
import styles from './NavigationArrows.module.css'

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

  // Triangle components using CSS modules with size classes
  const LeftTriangle = ({ size }: { size: number }) => (
    <div
      className={`${styles.triangleLeft} ${styles[`triangleSize${size}`]}`}
      aria-hidden="true"
    />
  )

  const RightTriangle = ({ size }: { size: number }) => (
    <div
      className={`${styles.triangleRight} ${styles[`triangleSize${size}`]}`}
      aria-hidden="true"
    />
  )

  // Build CSS class names based on props
  const getButtonClasses = (side: 'left' | 'right'): string => {
    const classes = [
      styles.navButton,
      side === 'left' ? styles.navButtonLeft : styles.navButtonRight,
      variant === 'project' || position === 'absolute' ? styles.navButtonProject : styles.navButtonGallery,
      styles[`navButton${size.charAt(0).toUpperCase() + size.slice(1)}`], // Small/Medium/Large
    ]

    // Add padding classes
    if (side === 'left') {
      classes.push(styles[`navButtonLeft${size.charAt(0).toUpperCase() + size.slice(1)}`])
    } else {
      classes.push(styles[`navButtonRight${size.charAt(0).toUpperCase() + size.slice(1)}`])
    }

    // Add mobile visibility class
    classes.push(showOnMobile ? 'nav-show-mobile' : 'nav-hide-mobile')

    return classes.join(' ')
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
          className={getButtonClasses('left')}
          aria-label="Previous image"
          type="button"
          onKeyDown={(e) => handleKeyDown(e, onScrollLeft)}
          data-nav="left"
          data-testid="nav-arrow-left"
        >
          <LeftTriangle size={triangleSize} />
        </button>
      )}

      {/* Right Navigation Area */}
      {canScrollRight && (
        <button
          onClick={onScrollRight}
          className={getButtonClasses('right')}
          aria-label="Next image"
          type="button"
          onKeyDown={(e) => handleKeyDown(e, onScrollRight)}
          data-nav="right"
          data-testid="nav-arrow-right"
        >
          <RightTriangle size={triangleSize} />
        </button>
      )}
    </>
  )
})

export { NavigationArrows }
