// ABOUTME: Client component that initializes Web Vitals tracking
// Issue #41: Performance Excellence - Real User Monitoring (RUM)

'use client'

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/web-vitals'

/**
 * WebVitalsTracker component
 *
 * This component initializes Core Web Vitals tracking when mounted.
 * It should be placed in the app layout to track metrics across all pages.
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - INP (Interaction to Next Paint) - Responsiveness (replaces FID)
 * - FCP (First Contentful Paint) - Perceived load speed
 * - TTFB (Time to First Byte) - Server response time
 */
export function WebVitalsTracker() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals()
  }, [])

  // This component doesn't render anything
  return null
}
