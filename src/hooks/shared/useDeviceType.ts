'use client'
import { useState, useEffect } from 'react'

type DeviceType = 'mobile' | 'desktop'

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop') // Default to desktop for SSR
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated immediately
    setIsHydrated(true)

    const checkDevice = () => {
      // User Agent check
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileUA =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent
        )

      // Screen characteristics
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const viewportWidth = window.innerWidth
      const isSmallScreen = Math.min(screenWidth, screenHeight) < 768
      const isSmallViewport = viewportWidth < 768

      // Device pixel ratio
      const highDPR = window.devicePixelRatio > 1.5

      // Touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Orientation API
      const hasOrientation = 'orientation' in window

      // Score-based detection
      let mobileScore = 0
      if (mobileUA) mobileScore += 3
      if (isSmallScreen || isSmallViewport) mobileScore += 2
      if (hasTouch && (isSmallScreen || isSmallViewport)) mobileScore += 2
      if (highDPR && (isSmallScreen || isSmallViewport)) mobileScore += 1
      if (hasOrientation) mobileScore += 1

      const detectedType = mobileScore >= 3 ? 'mobile' : 'desktop'

      console.log('🔍 Device detection (stable):', {
        viewportWidth,
        mobileUA,
        hasTouch,
        mobileScore,
        detectedType,
        isHydrated: true, // We know we're hydrated at this point
      })

      setDeviceType(detectedType)
    }

    // Initial detection after hydration
    checkDevice()

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkDevice, 200) // Longer debounce
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, []) // Empty dependency array is correct here

  // Only return the detected type after hydration
  return isHydrated ? deviceType : 'desktop'
}
