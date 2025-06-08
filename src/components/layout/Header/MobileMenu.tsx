'use client'

import { memo, useEffect } from 'react'
import { NavLink } from './NavLink'
import { UmamiEvents } from '@/utils/analytics'

// Navigation items configuration
const NAV_ITEMS = [
  { href: '/', label: 'WORK', exact: true },
  { href: '/about', label: 'ABOUT', exact: false },
  { href: '/contact', label: 'CONTACT', exact: false },
] as const

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  pathname: string
}

export const MobileMenu = memo(function MobileMenu({
  isOpen,
  onClose,
  pathname,
}: MobileMenuProps) {
  // Track mobile menu usage
  useEffect(() => {
    if (isOpen) {
      UmamiEvents.mobileMenuOpen()
    }
  }, [isOpen])

  // Close menu on escape key and handle body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        UmamiEvents.mobileMenuClose('keyboard')
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleClose = () => {
    UmamiEvents.mobileMenuClose('click')
    onClose()
  }

  const handleBackdropClose = () => {
    UmamiEvents.mobileMenuClose('backdrop')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 998,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleBackdropClose}
        aria-hidden="true"
      />

      {/* Menu panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '100%',
          maxWidth: '320px',
          backgroundColor: '#fff',
          zIndex: 999,
          padding: '80px 32px 40px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        id="mobile-menu"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '44px',
            height: '44px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s ease',
          }}
          aria-label="Close menu"
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = '#f5f5f5')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span
            style={{
              width: '20px',
              height: '2px',
              backgroundColor: '#333',
              position: 'relative',
              transform: 'rotate(45deg)',
            }}
          >
            <span
              style={{
                content: '""',
                position: 'absolute',
                width: '20px',
                height: '2px',
                backgroundColor: '#333',
                transform: 'rotate(-90deg)',
                top: 0,
                left: 0,
              }}
            />
          </span>
        </button>

        {/* Navigation */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '40px',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={
                item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
              }
              isMobile={true}
              onClick={handleClose}
            />
          ))}
        </nav>

        {/* Footer info */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '40px',
            borderTop: '1px solid #e5e5e5',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.5',
          }}
        >
          <p style={{ margin: 0 }}>Stockholm Studio</p>
          <p style={{ margin: '4px 0 0 0' }}>Contemporary Textile Design</p>
        </div>
      </div>
    </>
  )
})
