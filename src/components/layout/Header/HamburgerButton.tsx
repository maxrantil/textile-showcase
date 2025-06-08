'use client'

import { memo } from 'react'
import { UmamiEvents } from '@/utils/analytics'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
}

export const HamburgerButton = memo(function HamburgerButton({
  isOpen,
  onClick,
}: HamburgerButtonProps) {
  const handleClick = () => {
    UmamiEvents.mobileMenuToggle(isOpen ? 'close' : 'open')
    onClick()
  }

  const buttonStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '44px',
    height: '44px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
  }

  const lineStyles = {
    display: 'block',
    width: '20px',
    height: '2px',
    backgroundColor: '#333',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  }

  return (
    <button
      onClick={handleClick}
      style={buttonStyles}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = 'transparent')
      }
    >
      <span
        style={{
          ...lineStyles,
          transform: isOpen ? 'rotate(45deg) translateY(6px)' : 'none',
          transformOrigin: 'center',
        }}
      />
      <span
        style={{
          ...lineStyles,
          margin: '4px 0',
          opacity: isOpen ? 0 : 1,
          transform: isOpen ? 'scale(0)' : 'scale(1)',
        }}
      />
      <span
        style={{
          ...lineStyles,
          transform: isOpen ? 'rotate(-45deg) translateY(-6px)' : 'none',
          transformOrigin: 'center',
        }}
      />
    </button>
  )
})
