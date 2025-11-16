// ABOUTME: Critical CSS wrapper component that combines server-side critical CSS with client-side deferred loading
// Implements Phase 2A Day 3-4 FCP optimization through strategic CSS loading
// Issue #204: Added CSP nonce support for inline style tags

import { CriticalCSSProvider } from './critical-css-provider'
import { DeferredCSSLoader } from './deferred-css-loader'

interface CriticalCSSProps {
  children?: React.ReactNode
  nonce?: string | null
}

export function CriticalCSS({ children, nonce }: CriticalCSSProps) {
  return (
    <CriticalCSSProvider nonce={nonce}>
      <DeferredCSSLoader nonce={nonce} />
      {children}
    </CriticalCSSProvider>
  )
}
