interface HtmlHeadProps {
  children?: React.ReactNode
  lcpImageUrl?: string
}

/**
 * HtmlHead component with performance-optimized resource hints
 * Implements Phase 2A resource prioritization per PDR specifications
 * - DNS prefetch control for faster DNS lookups
 * - Preconnect hints for critical domains (Sanity CDN, Google Fonts)
 * - Preload hints for critical resources (CSS, fonts)
 * - LCP image preload for immediate discovery (Issue #51 Phase 1)
 * Target: 200-300ms FCP improvement
 */
export function HtmlHead({ children, lcpImageUrl }: HtmlHeadProps) {
  return (
    <head>
      {/* DNS prefetch control for performance optimization */}
      <meta name="dns-prefetch-control" content="on" />

      {/* Critical resource hints for Core Web Vitals optimization */}
      <link
        rel="preconnect"
        href="https://cdn.sanity.io"
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* CRITICAL: Preload LCP image for immediate discovery (Issue #51) */}
      {lcpImageUrl && (
        <link
          rel="preload"
          as="image"
          href={lcpImageUrl}
          fetchPriority="high"
          imageSrcSet={`${lcpImageUrl}&w=450 450w, ${lcpImageUrl}&w=640 640w, ${lcpImageUrl}&w=750 750w`}
          imageSizes="(max-width: 768px) 100vw, 450px"
        />
      )}

      {/* Preload critical self-hosted fonts */}
      <link
        rel="preload"
        href="/fonts/inter-400.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />
      <link
        rel="preload"
        href="/fonts/inter-500.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />

      {/* Performance and mobile optimization */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta
        name="apple-mobile-web-app-title"
        content="Ida Romme - Nordic Textile Design"
      />

      {/* Enhanced SEO and performance meta tags */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta
        name="theme-color"
        content="#ffffff"
        media="(prefers-color-scheme: light)"
      />
      <meta
        name="theme-color"
        content="#1a1a1a"
        media="(prefers-color-scheme: dark)"
      />

      {/* Core Web Vitals optimization hints */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta name="color-scheme" content="light dark" />

      {/* Resource hints for external services */}
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

      {/* Security headers */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

      {children}
    </head>
  )
}
