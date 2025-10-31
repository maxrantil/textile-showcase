// ABOUTME: Unified responsive header component for textile showcase
// Combines mobile and desktop navigation in a single component

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import './Header.css'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const pathname = usePathname()

  // Scroll effects for desktop view
  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Add scrolled class after 50px
      setIsScrolled(currentScrollY > 50)

      // Hide/show header based on scroll direction (desktop only)
      if (window.innerWidth >= 768) {
        setIsHeaderVisible(currentScrollY <= lastScrollY || currentScrollY < 50)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const navItems = [
    { href: '/', label: 'Work' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <>
      <header
        className={`header ${isScrolled ? 'header--scrolled' : ''} ${
          !isHeaderVisible ? 'header--hidden' : ''
        }`}
      >
        <div className="header__container">
          {/* Logo */}
          <Link href="/" className="header__logo" aria-label="Home">
            <span className="header__logo-text">Ida Romme</span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="header__nav header__nav--desktop"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`header__nav-link ${
                  pathname === item.href ? 'header__nav-link--active' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="header__menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <span
              className={`header__menu-icon ${isMenuOpen ? 'header__menu-icon--open' : ''}`}
            >
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu ${isMenuOpen ? 'mobile-menu--open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="mobile-menu__nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-menu__link ${
                pathname === item.href ? 'mobile-menu__link--active' : ''
              }`}
              onClick={() => setIsMenuOpen(false)}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
