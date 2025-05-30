'use client'

import { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Navigation items configuration
const NAV_ITEMS = [
  { href: '/', label: 'WORK', exact: true },
  { href: '/about', label: 'ABOUT', exact: false },
  { href: '/contact', label: 'CONTACT', exact: false },
] as const

// Individual navigation link component
const NavLink = memo(({ 
  href, 
  label, 
  isActive, 
  isMobile = false 
}: {
  href: string
  label: string
  isActive: boolean
  isMobile?: boolean
}) => (
  <Link 
    href={href}
    style={{
      fontSize: isMobile ? '18px' : '14px',
      letterSpacing: '1px',
      color: isActive ? '#666' : '#333',
      textDecoration: 'none',
      transition: 'color 0.3s ease',
      position: 'relative',
      padding: isMobile ? '12px 0' : '0',
      display: 'block'
    }}
    onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
    onMouseLeave={(e) => e.currentTarget.style.color = isActive ? '#666' : '#333'}
    aria-current={isActive ? 'page' : undefined}
  >
    {label}
    {/* Active indicator */}
    {isActive && (
      <span
        style={{
          position: 'absolute',
          bottom: isMobile ? '8px' : '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '2px',
          backgroundColor: '#333',
          borderRadius: '1px'
        }}
        aria-hidden="true"
      />
    )}
  </Link>
))

NavLink.displayName = 'NavLink'

// Mobile menu component
const MobileMenu = memo(({ 
  isOpen, 
  onClose, 
  pathname 
}: {
  isOpen: boolean
  onClose: () => void
  pathname: string
}) => {
  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '280px',
          backgroundColor: '#fff',
          zIndex: 1000,
          padding: '80px 40px 40px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.1)'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
              isMobile={true}
            />
          ))}
        </nav>
      </div>
    </>
  )
})

MobileMenu.displayName = 'MobileMenu'

// Main header component
const Header = memo(function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: isScrolled 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: isScrolled 
            ? '1px solid rgba(0, 0, 0, 0.1)' 
            : '1px solid #e5e5e5',
          transition: 'all 0.3s ease'
        }}
        role="banner"
      >
        <div style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Logo/Brand */}
          <Link 
            href="/" 
            style={{
              fontSize: 'clamp(20px, 3vw, 24px)',
              fontWeight: 300,
              letterSpacing: '2px',
              color: '#333',
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            aria-label="Ida Romme - Home"
          >
            IDA ROMME
          </Link>
          
          {/* Desktop Navigation */}
          <nav 
            style={{
              display: 'flex',
              gap: '32px'
            }}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Desktop menu - hidden on mobile with CSS */}
            <div 
              className="desktop-nav"
              style={{
                display: 'flex',
                gap: '32px'
              }}
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                />
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="mobile-menu-btn"
              onClick={toggleMobileMenu}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '32px',
                height: '32px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                zIndex: 1001
              }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {/* Hamburger icon */}
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  backgroundColor: '#333',
                  transition: 'all 0.3s ease',
                  transform: isMobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none'
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  backgroundColor: '#333',
                  margin: '4px 0',
                  transition: 'all 0.3s ease',
                  opacity: isMobileMenuOpen ? 0 : 1
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  backgroundColor: '#333',
                  transition: 'all 0.3s ease',
                  transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'
                }}
              />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        pathname={pathname}
      />

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
})

export default Header
