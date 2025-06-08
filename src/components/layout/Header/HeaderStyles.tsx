// src/components/layout/Header/HeaderStyles.tsx
'use client'

import { useMemo } from 'react'
import { RESPONSIVE_CONFIG } from '@/config/responsiveConfig'

interface UseHeaderStylesProps {
  breakpoint: 'mobile' | 'tablet' | 'desktop'
  isScrolled: boolean
  isHeaderVisible: boolean
}

export function useHeaderStyles({
  breakpoint,
  isScrolled,
  isHeaderVisible,
}: UseHeaderStylesProps) {
  const headerHeight = RESPONSIVE_CONFIG.header[breakpoint].height

  const headerStyles = useMemo(
    (): React.CSSProperties => ({
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
        height: `calc(${headerHeight}px + env(safe-area-inset-top, 0))`,
      }),
    }),
    [headerHeight, isScrolled, isHeaderVisible, breakpoint]
  )

  const containerStyles = useMemo(
    (): React.CSSProperties => ({
      padding: breakpoint === 'mobile' ? '16px 20px' : '24px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: '1400px',
      margin: '0 auto',
      height: `${headerHeight}px`,
    }),
    [breakpoint, headerHeight]
  )

  const logoStyles = useMemo(
    (): React.CSSProperties => ({
      fontSize:
        breakpoint === 'mobile'
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
        alignItems: 'center',
      }),
    }),
    [breakpoint]
  )

  const navigationStyles = useMemo(
    (): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: breakpoint === 'mobile' ? '16px' : '32px',
    }),
    [breakpoint]
  )

  return {
    headerHeight,
    headerStyles,
    containerStyles,
    logoStyles,
    navigationStyles,
  }
}
