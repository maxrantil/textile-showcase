'use client'
import { useState, useEffect } from 'react'

type DeviceType = 'mobile' | 'desktop'

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')

  useEffect(() => {
    const checkDevice = () => {
      // Primary detection: User Agent
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = [
        'android',
        'webos',
        'iphone',
        'ipad',
        'ipod',
        'blackberry',
        'windows phone',
        'mobile',
      ]

      const isMobileUA = mobileKeywords.some((keyword) =>
        userAgent.includes(keyword)
      )

      // Secondary check: Screen size AND touch capability
      // Only consider touch if screen is small
      const isSmallScreen = window.innerWidth < 768
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isMobileScreenAndTouch = isSmallScreen && hasTouch

      // Final determination: Mobile if UA suggests mobile OR (small screen AND touch)
      const isMobile = isMobileUA || isMobileScreenAndTouch

      setDeviceType(isMobile ? 'mobile' : 'desktop')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return deviceType
}

// Alternative: More robust version with additional checks
export function useDeviceTypeAdvanced(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')

  useEffect(() => {
    const checkDevice = () => {
      // 1. User Agent check
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileUA =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent
        )

      // 2. Screen characteristics
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const isSmallScreen = Math.min(screenWidth, screenHeight) < 768

      // 3. Device pixel ratio (mobile devices often have higher DPR)
      const highDPR = window.devicePixelRatio > 1.5

      // 4. Touch with context
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // 5. Orientation API (mostly available on mobile)
      const hasOrientation = 'orientation' in window

      // Score-based detection
      let mobileScore = 0
      if (mobileUA) mobileScore += 3 // Strongest indicator
      if (isSmallScreen) mobileScore += 2
      if (hasTouch && isSmallScreen) mobileScore += 2 // Touch only counts if screen is small
      if (highDPR && isSmallScreen) mobileScore += 1
      if (hasOrientation) mobileScore += 1

      setDeviceType(mobileScore >= 3 ? 'mobile' : 'desktop')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return deviceType
}
