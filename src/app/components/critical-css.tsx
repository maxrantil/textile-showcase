// ABOUTME: Critical CSS component for inlining above-fold styles and deferring non-critical CSS
// Implements Phase 2A Day 3-4 FCP optimization through strategic CSS loading

'use client'

import { readFileSync } from 'fs'
import { join } from 'path'
import { useEffect, useState } from 'react'

// Read critical CSS at build time for inlining (server-side only)
let criticalCSS = ''
try {
  if (typeof window === 'undefined') {
    const criticalCSSPath = join(
      process.cwd(),
      'src/styles/critical/critical.css'
    )
    criticalCSS = readFileSync(criticalCSSPath, 'utf-8')
  }
} catch {
  console.warn('Critical CSS file not found, falling back to regular loading')
}

interface CriticalCSSProps {
  children?: React.ReactNode
}

export function CriticalCSS({ children }: CriticalCSSProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load deferred CSS dynamically to comply with Next.js best practices
    const loadDeferredCSS = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/styles/critical/deferred.css'
      link.onload = () => setIsLoaded(true)
      link.onerror = () => {
        // Fallback: load full CSS if deferred loading fails
        const fallbackLink = document.createElement('link')
        fallbackLink.rel = 'stylesheet'
        fallbackLink.href = '/globals.css'
        document.head.appendChild(fallbackLink)
        setIsLoaded(true)
      }

      // Preload for faster loading
      const preloadLink = document.createElement('link')
      preloadLink.rel = 'preload'
      preloadLink.href = '/styles/critical/deferred.css'
      preloadLink.as = 'style'

      document.head.appendChild(preloadLink)

      // Small delay to ensure critical rendering is complete
      setTimeout(() => {
        document.head.appendChild(link)
      }, 100)
    }

    loadDeferredCSS()
  }, [])

  return (
    <>
      {/* Inline critical CSS for fastest FCP */}
      {criticalCSS && (
        <style
          dangerouslySetInnerHTML={{
            __html: criticalCSS,
          }}
        />
      )}

      {/* Loading indicator (optional) */}
      {!isLoaded && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
            .loading-indicator {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 2px;
              background: linear-gradient(90deg, transparent, var(--color-primary, #333), transparent);
              animation: loading 2s infinite;
              z-index: 9999;
            }
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `,
          }}
        />
      )}

      {children}
    </>
  )
}
