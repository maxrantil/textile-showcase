// ABOUTME: Touch event simulation utilities for mobile component testing

import { fireEvent } from '@testing-library/react'

/**
 * Creates a mock Touch object for touch event simulation
 */
export const createTouch = (
  clientX: number,
  clientY: number,
  identifier: number = 0
): Touch => {
  return {
    identifier,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    pageX: clientX,
    pageY: clientY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
    target: document.body,
  } as Touch
}

/**
 * Creates a TouchEvent for testing
 */
export const createTouchEvent = (
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  touches: Array<{ clientX: number; clientY: number; identifier?: number }>
): TouchEvent => {
  const touchObjects = touches.map((touch, index) =>
    createTouch(touch.clientX, touch.clientY, touch.identifier ?? index)
  )

  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: type === 'touchend' ? [] : touchObjects,
    targetTouches: type === 'touchend' ? [] : touchObjects,
    changedTouches: touchObjects,
  })
}

/**
 * Simulates a swipe gesture on an element
 * @param element - The element to swipe on
 * @param direction - Direction of the swipe
 * @param distance - Distance of the swipe in pixels
 */
export const simulateSwipe = (
  element: HTMLElement,
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 100
) => {
  const start = { clientX: 150, clientY: 150 }
  const end = { ...start }

  switch (direction) {
    case 'left':
      end.clientX = start.clientX - distance
      break
    case 'right':
      end.clientX = start.clientX + distance
      break
    case 'up':
      end.clientY = start.clientY - distance
      break
    case 'down':
      end.clientY = start.clientY + distance
      break
  }

  fireEvent(element, createTouchEvent('touchstart', [start]))
  fireEvent(element, createTouchEvent('touchmove', [end]))
  fireEvent(element, createTouchEvent('touchend', [end]))
}

/**
 * Simulates a tap gesture on an element
 */
export const simulateTap = (element: HTMLElement) => {
  const touch = { clientX: 150, clientY: 150 }
  fireEvent(element, createTouchEvent('touchstart', [touch]))
  fireEvent(element, createTouchEvent('touchend', [touch]))
}

/**
 * Simulates a long press gesture on an element
 * @param element - The element to long press on
 * @param duration - Duration of the press in milliseconds
 */
export const simulateLongPress = async (
  element: HTMLElement,
  duration: number = 500
) => {
  const touch = { clientX: 150, clientY: 150 }
  fireEvent(element, createTouchEvent('touchstart', [touch]))

  await new Promise((resolve) => setTimeout(resolve, duration))

  fireEvent(element, createTouchEvent('touchend', [touch]))
}

/**
 * Simulates a pinch gesture on an element
 * @param element - The element to pinch on
 * @param scale - Scale factor (< 1 for pinch in, > 1 for pinch out)
 */
export const simulatePinch = (element: HTMLElement, scale: number = 0.5) => {
  const center = { clientX: 150, clientY: 150 }
  const distance = 100

  // Start with two touches close together
  const startTouches = [
    { clientX: center.clientX - 10, clientY: center.clientY, identifier: 0 },
    { clientX: center.clientX + 10, clientY: center.clientY, identifier: 1 },
  ]

  // End with touches further apart (pinch out) or closer (pinch in)
  const endDistance = distance * scale
  const endTouches = [
    {
      clientX: center.clientX - endDistance / 2,
      clientY: center.clientY,
      identifier: 0,
    },
    {
      clientX: center.clientX + endDistance / 2,
      clientY: center.clientY,
      identifier: 1,
    },
  ]

  fireEvent(element, createTouchEvent('touchstart', startTouches))
  fireEvent(element, createTouchEvent('touchmove', endTouches))
  fireEvent(element, createTouchEvent('touchend', endTouches))
}
