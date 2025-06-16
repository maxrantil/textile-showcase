import type { Metadata } from 'next'
import './globals.css'

import { inter } from './fonts'
import {
  baseMetadata,
  openGraphMetadata,
  twitterMetadata,
  viewport,
} from './metadata/base-metadata'
import {
  organizationStructuredData,
  generateStructuredDataScript,
} from './metadata/structured-data'
import { HtmlHead } from './components/html-head'
import { SkipNavigation } from './components/skip-navigation'
import { AnalyticsProvider } from './components/analytics-provider'
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
    <html lang="en" className={inter.variable}>
      <HtmlHead>
        {generateStructuredDataScript(organizationStructuredData)}
      </HtmlHead>

      <body className="bg-white font-sans antialiased">
        <AnalyticsProvider>
          <SkipNavigation />

          <ErrorBoundary>
            <Header />
            <main id="main-content" role="main">
              {children}
            </main>
          </ErrorBoundary>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
