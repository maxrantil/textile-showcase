// ABOUTME: Server-side critical CSS provider for inlining above-fold styles
// Implements Phase 2A Day 3-4 FCP optimization through strategic CSS loading
// Note: CSP nonce support requires framework-level solution (See Issue #200)

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

export function CriticalCSSProvider({
  children,
}: CriticalCSSProviderProps) {
  const criticalCSS = getCriticalCSS()

  return (
    <>
      {/* Inline critical CSS for fastest FCP */}
      {/* Note: CSP nonce would cause hydration mismatch - requires framework solution */}
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
