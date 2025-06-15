// src/components/mobile/Header/MobileMenu.tsx
'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MobileNavLink } from './MobileNavLink'
import { UmamiEvents } from '@/utils/analytics'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  pathname: string
}

export function MobileMenu({ isOpen, onClose, pathname }: MobileMenuProps) {
  // Track menu open/close
  useEffect(() => {
    if (isOpen) {
      UmamiEvents.mobileMenuOpen()
    }
  }, [isOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        UmamiEvents.mobileMenuClose('keyboard')
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleBackdropClick = () => {
    UmamiEvents.mobileMenuClose('backdrop')
    onClose()
  }

  const handleCloseClick = () => {
    UmamiEvents.mobileMenuClose('click')
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="mobile-menu-overlay">
      <div className="mobile-menu-backdrop" onClick={handleBackdropClick} />
      <nav
        className="mobile-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <button
          className="mobile-menu-close"
          onClick={handleCloseClick}
          aria-label="Close menu"
        >
          ✕
        </button>
        <div className="mobile-menu-nav">
          <MobileNavLink href="/" isActive={pathname === '/'} onClick={onClose}>
            WORK
          </MobileNavLink>
          <MobileNavLink
            href="/about"
            isActive={pathname === '/about'}
            onClick={onClose}
          >
            ABOUT
          </MobileNavLink>
          <MobileNavLink
            href="/contact"
            isActive={pathname === '/contact'}
            onClick={onClose}
          >
            CONTACT
          </MobileNavLink>
        </div>
        <div className="mobile-menu-footer">
          <p>Stockholm Studio</p>
          <p>Contemporary Textile Design</p>
        </div>
      </nav>
    </div>,
    document.body
  )
}
