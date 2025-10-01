'use client'

import { useEffect } from 'react'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Defer analytics loading to improve TTI
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !process.env.NEXT_PUBLIC_UMAMI_URL
    ) {
      return
    }

    // Use requestIdleCallback to load analytics when browser is idle
    const loadAnalytics = () => {
      const script = document.createElement('script')
      script.defer = true
      script.src = `${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`
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
  }, [])

  return <>{children}</>
}
