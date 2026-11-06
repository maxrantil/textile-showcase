// src/hooks/mobile/useVirtualKeyboard.ts
// ABOUTME: Detects the on-screen keyboard by watching the viewport height shrink
'use client'

import { useState, useSyncExternalStore } from 'react'

/** Viewport shrink (px) treated as the keyboard opening */
const KEYBOARD_THRESHOLD = 150

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

const getHeight = () => window.innerHeight
const getServerHeight = () => 0

export function useVirtualKeyboard() {
  const viewportHeight = useSyncExternalStore(
    subscribe,
    getHeight,
    getServerHeight
  )
  // Height when the component first mounted on the client
  const [initialHeight] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerHeight
  )

  // Assume keyboard is open if height decreased by more than the threshold
  const isKeyboardOpen =
    viewportHeight > 0 && initialHeight - viewportHeight > KEYBOARD_THRESHOLD

  return { isKeyboardOpen, viewportHeight }
}
