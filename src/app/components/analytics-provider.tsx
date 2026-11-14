// ABOUTME: Loads the Umami tracking script on the client and renders Web Vitals tracking
// The script is optional: it is added after the page has loaded and nothing here can throw into the page (Issue #263)
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
    const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

    if (process.env.NODE_ENV !== 'production' || !umamiUrl || !websiteId) {
      return
    }

    let cancelled = false
    let idleHandle: number | undefined
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined

    const loadAnalytics = () => {
      if (cancelled) return

      // Analytics is optional: whatever goes wrong here stays here
      try {
        // The nonce changes per request; a re-run must not add a second tracker
        if (document.querySelector('script[data-website-id]')) return

        // A script added from code never blocks parsing or rendering, and a
        // failed, slow or malformed response only fails this one request
        const script = document.createElement('script')
        script.defer = true
        script.src = `${umamiUrl}/script.js`

        // Apply nonce for CSP compliance (Issue #204)
        if (nonce) {
          script.setAttribute('nonce', nonce)
        }

        script.setAttribute('data-website-id', websiteId)
        document.head.appendChild(script)
      } catch {
        // The page works the same without the tracker
      }
    }

    // Use requestIdleCallback to load analytics when browser is idle
    const scheduleLoad = () => {
      if ('requestIdleCallback' in window) {
        idleHandle = window.requestIdleCallback(loadAnalytics, {
          timeout: 2000,
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        timeoutHandle = setTimeout(loadAnalytics, 1000)
      }
    }

    // A script added before the window load event holds that event back until
    // the request settles. Waiting for it keeps a hanging Umami from delaying it.
    if (document.readyState === 'complete') {
      scheduleLoad()
    } else {
      window.addEventListener('load', scheduleLoad, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', scheduleLoad)
      if (idleHandle !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleHandle)
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle)
      }
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
