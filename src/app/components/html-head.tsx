interface HtmlHeadProps {
  children?: React.ReactNode
}

/**
 * HtmlHead component with performance-optimized resource hints
 * Implements Phase 2A resource prioritization per PDR specifications
 * - DNS prefetch control for faster DNS lookups
 * - Preconnect hints for critical domains (Sanity CDN, Google Fonts)
 * - Preload hints for critical resources (CSS, fonts)
 * Target: 200-300ms FCP improvement
 */
export function HtmlHead({ children }: HtmlHeadProps) {
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
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

      {/* Preload critical resources */}
      <link
        rel="preload"
        href="/_next/static/css/app.css"
        as="style"
        type="text/css"
      />
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />
      <link
        rel="preload"
        href="/fonts/noto-sans-var.woff2"
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
