import type { Metadata } from 'next'
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
import { HtmlHead } from './components/html-head'
import { SkipNavigation } from './components/skip-navigation'
import { AnalyticsProvider } from './components/analytics-provider'
import { CriticalCSS } from './components/critical-css'
import { FontPreloader } from '@/components/fonts/FontPreloader'
import Header from '@/components/adaptive/Header'
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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <HtmlHead>
        {generateStructuredDataScript(organizationStructuredData)}
        {generateStructuredDataScript(artistStructuredData)}
        {generateStructuredDataScript(websiteStructuredData)}
      </HtmlHead>

      <body className="bg-white font-sans antialiased">
        <CriticalCSS>
          <FontPreloader />
          <AnalyticsProvider>
            <SkipNavigation />

            <ErrorBoundary>
              <Header />
              <main id="main-content" role="main">
                {children}
              </main>
            </ErrorBoundary>
          </AnalyticsProvider>
        </CriticalCSS>
      </body>
    </html>
  )
}
