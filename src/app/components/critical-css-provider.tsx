// ABOUTME: Server-side critical CSS provider for inlining above-fold styles
// Implements Phase 2A Day 3-4 FCP optimization through strategic CSS loading
// Issue #198: Added CSP nonce support for style tags

import { readFileSync } from 'fs'
import { join } from 'path'
import { headers } from 'next/headers'

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

export async function CriticalCSSProvider({
  children,
}: CriticalCSSProviderProps) {
  const criticalCSS = getCriticalCSS()

  // Get CSP nonce from middleware (Issue #198)
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') || ''

  return (
    <>
      {/* Inline critical CSS for fastest FCP */}
      {/* Issue #198: Added nonce for CSP compliance */}
      {criticalCSS && (
        <style
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: criticalCSS,
          }}
        />
      )}
      {children}
    </>
  )
}
