// ABOUTME: Score-based mobile/desktop detection from user agent, screen size,
// ABOUTME: touch support and orientation; returns 'desktop' during SSR and hydration
'use client'
import { useSyncExternalStore } from 'react'

type DeviceType = 'mobile' | 'desktop' | 'tablet'

const detectDeviceType = (): DeviceType => {
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
  return detectedType
}

// Re-detect on resize (debounced) and orientation change (short delay)
const subscribe = (onChange: () => void) => {
  let resizeTimeoutId: NodeJS.Timeout | undefined
  let orientationTimeoutId: NodeJS.Timeout | undefined

  const handleOrientationChange = () => {
    clearTimeout(orientationTimeoutId)
    orientationTimeoutId = setTimeout(onChange, 100)
  }

  const handleResize = () => {
    clearTimeout(resizeTimeoutId)
    resizeTimeoutId = setTimeout(onChange, 150) // Balanced debounce
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleOrientationChange)

  return () => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleOrientationChange)
    clearTimeout(resizeTimeoutId)
    clearTimeout(orientationTimeoutId)
  }
}

// Default to desktop for SSR
const getServerSnapshot = (): DeviceType => 'desktop'

export function useDeviceType(): DeviceType {
  return useSyncExternalStore(subscribe, detectDeviceType, getServerSnapshot)
}
