// ABOUTME: Detects an open on-screen keyboard from the viewport height
// ABOUTME: shrinking more than 150px compared with its height on mount
'use client'

import { useState, useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

const getViewportHeight = () => window.innerHeight

export function useVirtualKeyboard() {
  const viewportHeight = useSyncExternalStore(
    subscribe,
    getViewportHeight,
    () => 0
  )
  // Height when the hook first rendered on the client (0 during SSR)
  const [initialHeight, setInitialHeight] = useState(viewportHeight)
  if (initialHeight === 0 && viewportHeight !== 0) {
    setInitialHeight(viewportHeight)
  }

  // Assume keyboard is open if height decreased by more than 150px
  const isKeyboardOpen = initialHeight - viewportHeight > 150

  return { isKeyboardOpen, viewportHeight }
}
