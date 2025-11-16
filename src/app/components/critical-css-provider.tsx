// ABOUTME: Server-side critical CSS provider for inlining above-fold styles
// Implements Phase 2A Day 3-4 FCP optimization through strategic CSS loading
// Issue #204: CSP nonce support fully implemented for App Router

import { readFileSync } from 'fs'
import { join } from 'path'

// This is a server component - no 'use client' directive
// Read critical CSS at build time for inlining
function getCriticalCSS(): string {
  try {
    const criticalCSSPath = join(
      process.cwd(),
      'src/styles/critical/critical.css'
    )
    return readFileSync(criticalCSSPath, 'utf-8')
  } catch {
    console.warn('Critical CSS file not found, falling back to regular loading')
    return ''
  }
}

interface CriticalCSSProviderProps {
  children?: React.ReactNode
}

export function CriticalCSSProvider({ children }: CriticalCSSProviderProps) {
  const criticalCSS = getCriticalCSS()

  return (
    <>
      {/* Inline critical CSS for fastest FCP */}
      {/* Note: style-src uses 'unsafe-inline' (nonce not needed for styles) */}
      {criticalCSS && (
        <style
          dangerouslySetInnerHTML={{
            __html: criticalCSS,
          }}
        />
      )}
      {children}
    </>
  )
}
