// ABOUTME: Deferred hydration wrapper component
// Simple wrapper for components that should hydrate based on configuration

'use client'

import type { JSX } from 'react'
import { useProgressiveHydration } from './useProgressiveHydration'
import type { DeferredHydrationProps } from './types'

export function DeferredHydration({
  children,
  componentId,
  config,
  fallback: Fallback,
}: DeferredHydrationProps): JSX.Element {
  const { isHydrated, shouldHydrate } = useProgressiveHydration({
    ...config,
    componentId,
  })

  // Show fallback while not hydrated
  if (!isHydrated && Fallback) {
    return <Fallback />
  }

  // Render children only when should hydrate
  if (!shouldHydrate) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return <>{children}</>
}
