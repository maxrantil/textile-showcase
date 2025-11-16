import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import './globals.css'

// Fonts are loaded via optimized-fonts.css and FontPreloader instead
import {
  baseMetadata,
  openGraphMetadata,
  twitterMetadata,
  viewport,
} from './metadata/base-metadata'
import {
  organizationStructuredData,
  artistStructuredData,
  websiteStructuredData,
  generateStructuredDataScript,
} from './metadata/structured-data'
import { SkipNavigation } from './components/skip-navigation'
import { AnalyticsProvider } from './components/analytics-provider'
import { CriticalCSS } from './components/critical-css'
import { FontPreloader } from '@/components/fonts/FontPreloader'
import { Header } from '@/components/Header'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Combine metadata
export const metadata: Metadata = {
  ...baseMetadata,
  openGraph: openGraphMetadata,
  twitter: twitterMetadata,
}

// Export viewport
export { viewport }

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Force dynamic rendering (required for per-request nonces - Issue #204)
  await connection()

  // Retrieve nonce from middleware for CSP compliance
  const headersList = await headers()
  const nonce = headersList.get('x-nonce')
  return (
    <html lang="en">
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
        <meta name="color-scheme" content="light dark" />

        {/* Resource hints for external services */}
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

        {/* Structured data with CSP nonce (Issue #204) */}
        {generateStructuredDataScript(organizationStructuredData, nonce)}
        {generateStructuredDataScript(artistStructuredData, nonce)}
        {generateStructuredDataScript(websiteStructuredData, nonce)}
      </head>

      <body className="bg-white font-sans antialiased">
        <CriticalCSS nonce={nonce}>
          <FontPreloader />
          <AnalyticsProvider>
            <SkipNavigation />

            <ErrorBoundary>
              <Header />
              <main id="main-content" role="main" tabIndex={-1}>
                {children}
              </main>
            </ErrorBoundary>
          </AnalyticsProvider>
        </CriticalCSS>
      </body>
    </html>
  )
}
