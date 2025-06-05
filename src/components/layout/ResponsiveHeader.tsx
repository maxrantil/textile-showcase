'use client'

import { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RESPONSIVE_CONFIG } from '@/config/responsiveConfig'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { UmamiEvents } from '@/utils/analytics'
import { DesktopNavigation } from './Header/DesktopNavigation'
import { MobileMenu } from './Header/MobileMenu'
import { HamburgerButton } from './Header/HamburgerButton'

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

  const headerStyles: React.CSSProperties = {
    position: 'fixed',
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

  const containerStyles: React.CSSProperties = {
    padding: breakpoint === 'mobile' ? '16px 20px' : '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    height: `${headerHeight}px`
  }

  const logoStyles: React.CSSProperties = {
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
            onClick={() => UmamiEvents.navigateHome()}
            onMouseEnter={(e) => e.currentTarget.style.color = '#666'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            aria-label="Ida Romme - Home"
          >
            IDA ROMME (this is a work in progress)
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
            {breakpoint !== 'mobile' && <DesktopNavigation pathname={pathname} />}

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
    </>
  )
})

export default ResponsiveHeader
