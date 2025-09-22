// ABOUTME: Client-side deferred CSS loader for non-critical styles
// Loads below-fold CSS asynchronously after critical rendering

'use client'

import { useEffect, useState } from 'react'

export function DeferredCSSLoader() {
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
        console.warn('Failed to load deferred CSS, falling back to globals.css')
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

  // Loading indicator (optional)
  if (!isLoaded) {
    return (
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
              pointer-events: none;
            }
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `,
        }}
      />
    )
  }

  return null
}
