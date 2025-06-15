// src/hooks/useSwipeGesture.ts
'use client'

import { useState, useCallback, useRef, TouchEvent } from 'react'

interface TouchPosition {
  x: number
  y: number
  time: number
}

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minSwipeDistance?: number
  maxSwipeTime?: number
  enabled?: boolean
  preventScroll?: boolean
  threshold?: number // How much movement before we consider it a swipe
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  maxSwipeTime = 500,
  enabled = true,
  preventScroll = false,
  threshold = 10,
}: SwipeGestureOptions) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeRef = useRef<{
    startX: number
    startY: number
    currentX: number
    currentY: number
    startTime: number
  } | null>(null)

  const getTouchPosition = (e: TouchEvent): TouchPosition => ({
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
    time: Date.now(),
  })

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return

      const touch = getTouchPosition(e)
      setTouchStart(touch)
      setIsSwiping(false)

      // Store initial touch data
      swipeRef.current = {
        startX: touch.x,
        startY: touch.y,
        currentX: touch.x,
        currentY: touch.y,
        startTime: touch.time,
      }

      console.log('🤏 Touch start:', { x: touch.x, y: touch.y })
    },
    [enabled]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStart || !swipeRef.current) return

      const currentTouch = getTouchPosition(e)
      swipeRef.current.currentX = currentTouch.x
      swipeRef.current.currentY = currentTouch.y

      // Calculate movement
      const deltaX = Math.abs(currentTouch.x - touchStart.x)
      const deltaY = Math.abs(currentTouch.y - touchStart.y)

      // Determine if this is likely a swipe gesture
      const isHorizontalMovement = deltaX > deltaY
      const hasSignificantMovement = deltaX > threshold || deltaY > threshold

      if (hasSignificantMovement) {
        if (!isSwiping) {
          setIsSwiping(true)
          console.log('🔄 Swipe detected:', {
            deltaX,
            deltaY,
            isHorizontal: isHorizontalMovement,
          })
        }

        // Prevent scroll if this is a horizontal swipe and we want to control it
        if (preventScroll && isHorizontalMovement && deltaX > deltaY) {
          e.preventDefault()
        }
      }
    },
    [enabled, touchStart, threshold, preventScroll, isSwiping]
  )

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !touchStart || !swipeRef.current) {
      console.log('🚫 Touch end - missing data')
      return
    }

    const endTime = Date.now()
    const swipeTime = endTime - swipeRef.current.startTime

    // Check if swipe was too slow
    if (swipeTime > maxSwipeTime) {
      console.log('⏰ Swipe too slow:', swipeTime + 'ms')
      setTouchStart(null)
      setIsSwiping(false)
      swipeRef.current = null
      return
    }

    const deltaX = swipeRef.current.startX - swipeRef.current.currentX
    const deltaY = swipeRef.current.startY - swipeRef.current.currentY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    console.log('📊 Swipe analysis:', {
      deltaX,
      deltaY,
      absDeltaX,
      absDeltaY,
      minDistance: minSwipeDistance,
      swipeTime,
    })

    // Determine swipe direction and execute callback
    const isHorizontalSwipe = absDeltaX > absDeltaY
    const isVerticalSwipe = absDeltaY > absDeltaX

    if (isHorizontalSwipe && absDeltaX > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left (finger moved right to left)
        console.log('👈 Swipe LEFT detected')
        onSwipeLeft?.()
      } else {
        // Swiped right (finger moved left to right)
        console.log('👉 Swipe RIGHT detected')
        onSwipeRight?.()
      }
    } else if (isVerticalSwipe && absDeltaY > minSwipeDistance) {
      if (deltaY > 0) {
        // Swiped up (finger moved bottom to top)
        console.log('👆 Swipe UP detected')
        onSwipeUp?.()
      } else {
        // Swiped down (finger moved top to bottom)
        console.log('👇 Swipe DOWN detected')
        onSwipeDown?.()
      }
    } else {
      console.log('❌ No valid swipe detected')
    }

    // Reset state
    setTouchStart(null)
    setIsSwiping(false)
    swipeRef.current = null
  }, [
    enabled,
    touchStart,
    maxSwipeTime,
    minSwipeDistance,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  ])

  // Return handlers and state
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isSwiping,
    // Helper object to spread onto elements
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

// Simpler version for basic left/right swiping
export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  minSwipeDistance = 75,
  maxSwipeTime = 400,
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  enabled?: boolean
  minSwipeDistance?: number
  maxSwipeTime?: number
}) {
  return useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    enabled,
    minSwipeDistance,
    maxSwipeTime,
    preventScroll: true, // Always prevent scroll for horizontal gallery swipes
    threshold: 15, // Slightly higher threshold for gallery
  })
}
