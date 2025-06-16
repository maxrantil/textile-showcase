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

      // Screen and viewport characteristics
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Check if in landscape mode
      const isLandscape = viewportWidth > viewportHeight

      // Adjusted thresholds for landscape (not too aggressive)
      const isSmallScreen = Math.min(screenWidth, screenHeight) < 768
      const isSmallViewport = isLandscape
        ? viewportWidth < 812 // iPhone X/11/12/13 landscape width
        : viewportWidth < 768

      // Device pixel ratio
      const highDPR = window.devicePixelRatio > 1.5

      // Touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Orientation API
      const hasOrientation = 'orientation' in window

      // Score-based detection with moderate landscape adjustments
      let mobileScore = 0

      // User agent still important but slightly less in landscape
      if (mobileUA) mobileScore += isLandscape ? 2.5 : 3

      // Screen size checks with landscape consideration
      if (isSmallScreen || isSmallViewport) {
        mobileScore += isLandscape ? 1.5 : 2
      }

      // Touch + small screen combo
      if (hasTouch && (isSmallScreen || isSmallViewport)) {
        mobileScore += isLandscape ? 1.5 : 2
      }

      // Additional factors
      if (highDPR && (isSmallScreen || isSmallViewport)) mobileScore += 1
      if (hasOrientation) mobileScore += 0.5

      // Special case: tablets in landscape should be desktop
      if (isLandscape && viewportWidth >= 1024) {
        mobileScore = 0 // Force desktop for tablet landscape
      }

      const detectedType = mobileScore >= 3 ? 'mobile' : 'desktop'

      console.log('🔍 Device detection (balanced):', {
        viewportWidth,
        viewportHeight,
        isLandscape,
        mobileUA,
        hasTouch,
        mobileScore,
        detectedType,
        isHydrated: true,
      })

      setDeviceType(detectedType)
    }

    // Initial detection after hydration
    checkDevice()

    // Handle orientation changes with a small delay
    const handleOrientationChange = () => {
      setTimeout(checkDevice, 100)
    }

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkDevice, 150) // Balanced debounce
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      clearTimeout(timeoutId)
    }
  }, []) // Empty dependency array is correct here

  // Only return the detected type after hydration
  return isHydrated ? deviceType : 'desktop'
}
