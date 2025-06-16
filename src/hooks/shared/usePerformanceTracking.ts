// src/hooks/shared/usePerformanceTracking.ts
'use client'

import { useEffect } from 'react'

export function usePerformanceTracking(
  componentName: string,
  deviceType: string
) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Component loaded: ${componentName} on ${deviceType}`)

      // Track performance metrics
      const loadTime = performance.now()
      console.log(`⏱️ ${componentName} render time: ${loadTime.toFixed(2)}ms`)
    }
  }, [componentName, deviceType])
}
