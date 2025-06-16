// src/components/mobile/Header/HamburgerButton.tsx - Update
'use client'

import { UmamiEvents } from '@/utils/analytics'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  const handleClick = () => {
    UmamiEvents.mobileMenuToggle(isOpen ? 'close' : 'open')
    onClick()
  }

  return (
    <button
      className="mobile-hamburger"
      onClick={handleClick}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <span className={`hamburger-line ${isOpen ? 'rotate-45' : ''}`} />
      <span className={`hamburger-line ${isOpen ? 'opacity-0' : ''}`} />
      <span className={`hamburger-line ${isOpen ? '-rotate-45' : ''}`} />
    </button>
  )
}
