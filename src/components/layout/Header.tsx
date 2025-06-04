// src/components/layout/ResponsiveHeader.tsx
'use client'

import { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RESPONSIVE_CONFIG } from '@/config/responsiveConfig'
import { useBreakpoint } from '@/hooks/useBreakpoint'

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
  isMobile = false,
  onClick
}: {
  href: string
  label: string
  isActive: boolean
  isMobile?: boolean
  onClick?: () => void
}) => (
  <Link 
    href={href}
    onClick={onClick}
    style={{
      fontSize: isMobile ? RESPONSIVE_CONFIG.typography.bodyLarge : RESPONSIVE_CONFIG.typography.bodySmall,
      letterSpacing: '1px',
      color: isActive ? '#666' : '#333',
      textDecoration: 'none',
      transition: 'color 0.3s ease',
      position: 'relative',
      padding: isMobile ? '16px 0' : '8px 0',
      display: 'block',
      // Mobile touch target
      ...(isMobile && {
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center'
      })
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
          bottom: isMobile ? '12px' : '4px',
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

// Mobile menu component with improved animations
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 998,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(4px)'
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
          width: '100%',
          maxWidth: '320px',
          backgroundColor: '#fff',
          zIndex: 999,
          padding: '80px 32px 40px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <button
          onClick={onClose}
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
            transition: 'background-color 0.2s ease'
          }}
          aria-label="Close menu"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span style={{
            width: '20px',
            height: '2px',
            backgroundColor: '#333',
            position: 'relative',
            transform: 'rotate(45deg)',
          }}>
            <span style={{
              content: '""',
              position: 'absolute',
              width: '20px',
              height: '2px',
              backgroundColor: '#333',
              transform: 'rotate(-90deg)',
              top: 0,
              left: 0
            }} />
          </span>
        </button>

        {/* Navigation */}
        <nav style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          marginTop: '40px'
        }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
              isMobile={true}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Footer info */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '40px',
          borderTop: '1px solid #e5e5e5',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.5'
        }}>
          <p style={{ margin: 0 }}>Stockholm Studio</p>
          <p style={{ margin: '4px 0 0 0' }}>Contemporary Textile Design</p>
        </div>
      </div>
    </>
  )
})

MobileMenu.displayName = 'MobileMenu'

// Hamburger menu button component
const HamburgerButton = memo(({ 
  isOpen, 
  onClick 
}: { 
  isOpen: boolean
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    style={{
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
      transition: 'background-color 0.2s ease'
    }}
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
    aria-expanded={isOpen}
    aria-controls="mobile-menu"
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    {/* Top line */}
    <span
      style={{
        display: 'block',
        width: '20px',
        height: '2px',
        backgroundColor: '#333',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: isOpen ? 'rotate(45deg) translateY(6px)' : 'none',
        transformOrigin: 'center'
      }}
    />
    {/* Middle line */}
    <span
      style={{
        display: 'block',
        width: '20px',
        height: '2px',
        backgroundColor: '#333',
        margin: '4px 0',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        opacity: isOpen ? 0 : 1,
        transform: isOpen ? 'scale(0)' : 'scale(1)'
      }}
    />
    {/* Bottom line */}
    <span
      style={{
        display: 'block',
        width: '20px',
        height: '2px',
        backgroundColor: '#333',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: isOpen ? 'rotate(-45deg) translateY(-6px)' : 'none',
        transformOrigin: 'center'
      }}
    />
  </button>
))

HamburgerButton.displayName = 'HamburgerButton'

// Main responsive header component
const ResponsiveHeader = memo(function ResponsiveHeader() {
  const pathname = usePathname()
  const breakpoint = useBreakpoint()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Header background change
      setIsScrolled(currentScrollY > 10)
      
      // Auto-hide header on mobile when scrolling down
      if (breakpoint === 'mobile' && !isMobileMenuOpen) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsHeaderVisible(false)
        } else {
          setIsHeaderVisible(true)
        }
      } else {
        setIsHeaderVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [breakpoint, isMobileMenuOpen, lastScrollY])

  // Close mobile menu when breakpoint changes
  useEffect(() => {
    if (breakpoint !== 'mobile') {
      setIsMobileMenuOpen(false)
    }
  }, [breakpoint])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const headerHeight = RESPONSIVE_CONFIG.header[breakpoint].height

  const headerStyles = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: `${headerHeight}px`,
    background: isScrolled 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: isScrolled 
      ? '1px solid rgba(0, 0, 0, 0.1)' 
      : '1px solid rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
    // Add safe area padding for mobile devices with notches
    ...(breakpoint === 'mobile' && {
      paddingTop: 'env(safe-area-inset-top, 0)',
      height: `calc(${headerHeight}px + env(safe-area-inset-top, 0))`
    })
  }

  const containerStyles = {
    padding: breakpoint === 'mobile' ? '16px 20px' : '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    height: `${headerHeight}px`
  }

  const logoStyles = {
    fontSize: breakpoint === 'mobile' 
      ? RESPONSIVE_CONFIG.typography.headingSmall 
      : RESPONSIVE_CONFIG.typography.headingMedium,
    fontWeight: 300,
    letterSpacing: breakpoint === 'mobile' ? '1.5px' : '2px',
    color: '#333',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    // Ensure proper touch target on mobile
    ...(breakpoint === 'mobile' && {
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center'
    })
  }

  return (
    <>
      <header style={headerStyles} role="banner">
        <div style={containerStyles}>
          {/* Logo/Brand */}
          <Link 
            href="/" 
            style={logoStyles}
            onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            aria-label="Ida Romme - Home"
          >
            IDA ROMME
          </Link>
          
          {/* Navigation */}
          <nav 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: breakpoint === 'mobile' ? '16px' : '32px'
            }}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Desktop menu */}
            {breakpoint !== 'mobile' && (
              <div style={{
                display: 'flex',
                gap: '32px',
                alignItems: 'center'
              }}>
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                  />
                ))}
              </div>
            )}

            {/* Mobile menu button */}
            {breakpoint === 'mobile' && (
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={toggleMobileMenu}
              />
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {breakpoint === 'mobile' && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          pathname={pathname}
        />
      )}

      {/* Add safe area CSS for iOS devices */}
      <style jsx global>{`
        @supports (padding: max(0px)) {
          .safe-area-header {
            padding-top: max(env(safe-area-inset-top), 0px);
          }
        }
        
        /* Ensure smooth scrolling on mobile */
        html {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Hide scrollbar on webkit browsers when needed */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
})

export default ResponsiveHeader
