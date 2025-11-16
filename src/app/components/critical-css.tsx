// ABOUTME: Critical CSS wrapper component that combines server-side critical CSS with client-side deferred loading
// Implements Phase 2A Day 3-4 FCP optimization through strategic CSS loading

import { CriticalCSSProvider } from './critical-css-provider'
import { DeferredCSSLoader } from './deferred-css-loader'

interface CriticalCSSProps {
  children?: React.ReactNode
}

export function CriticalCSS({ children }: CriticalCSSProps) {
  return (
    <CriticalCSSProvider>
      <DeferredCSSLoader />
      {children}
    </CriticalCSSProvider>
  )
}
