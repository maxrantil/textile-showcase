import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/ResponsiveHeader'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Better font loading performance
  preload: true,
})

// Enhanced metadata
export const metadata: Metadata = {
  title: {
    default: 'Ida Romme - Contemporary Textile Design',
    template: '%s - Ida Romme'
  },
  description: 'Contemporary textile designs by Ida Romme, featuring sustainable hand-woven pieces that bridge traditional craftsmanship with modern aesthetics.',
  keywords: ['textile design', 'hand weaving', 'sustainable textiles', 'contemporary craft', 'Stockholm', 'textile art'],
  authors: [{ name: 'Ida Romme' }],
  creator: 'Ida Romme',
  publisher: 'Ida Romme Studio',
  metadataBase: new URL('https://idaromme.dk'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://idaromme.dk',
    siteName: 'Ida Romme',
    title: 'Ida Romme - Contemporary Textile Design',
    description: 'Contemporary textile designs featuring sustainable hand-woven pieces',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ida Romme - Contemporary Textile Design',
    description: 'Contemporary textile designs featuring sustainable hand-woven pieces',
    creator: '@idaromme', // Add if Twitter handle exists
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
  colorScheme: 'light',
}

// Root layout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Performance hints */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Ida Romme Studio",
              "url": "https://idaromme.dk",
              "logo": "https://idaromme.dk/logo.png",
              "founder": {
                "@type": "Person",
                "name": "Ida Romme"
              },
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Stockholm",
                "addressCountry": "SE"
              },
              "sameAs": [
                // Add social media links when available
                // "https://instagram.com/idaromme",
                // "https://linkedin.com/in/idaromme"
              ]
            })
          }}
        />
        
        {/* Umami Analytics - FIXED: Moved to head and corrected syntax */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_UMAMI_URL && (
          <script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body className="bg-white font-sans antialiased">
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-black px-4 py-2 rounded border-2 border-black z-50"
        >
          Skip to main content
        </a>
        
        <ErrorBoundary>
          <Header />
          <main id="main-content" role="main">
            {children}
          </main>
        </ErrorBoundary>

        {/* Google Analytics - Keep existing GA code for fallback */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}

// Add global error boundary for unhandled errors
export function generateStaticParams() {
  return []
}
