'use client'

import { useEffect } from 'react'
import { WebVitalsTracker } from '@/components/WebVitalsTracker'

interface AnalyticsProviderProps {
  children: React.ReactNode
  nonce?: string | null
}

export function AnalyticsProvider({ children, nonce }: AnalyticsProviderProps) {
  // Defer analytics loading to improve TTI
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !process.env.NEXT_PUBLIC_UMAMI_URL
    ) {
      return
    }

    // HOTFIX Issue #262: Analytics server down (504 timeout), disable script loading
    // to prevent JavaScript errors that break React hydration and gallery clicks
    console.warn('⚠️ Analytics temporarily disabled - server unavailable')
    return

    // Use requestIdleCallback to load analytics when browser is idle
    const loadAnalytics = () => {
      const script = document.createElement('script')
      script.defer = true
      script.src = `${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`

      // Apply nonce for CSP compliance (Issue #204)
      if (nonce) {
        script.setAttribute('nonce', nonce)
      }

      script.setAttribute(
        'data-website-id',
        process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || ''
      )
      document.head.appendChild(script)
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(loadAnalytics, { timeout: 2000 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(loadAnalytics, 1000)
    }
  }, [nonce])

  return (
    <>
      {/* Issue #41: Core Web Vitals tracking for RUM */}
      <WebVitalsTracker />
      {children}
    </>
  )
}
