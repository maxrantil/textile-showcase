'use client'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return (
    <>
      {children}

      {/* Umami Analytics - Production only */}
      {process.env.NODE_ENV === 'production' &&
        process.env.NEXT_PUBLIC_UMAMI_URL && (
          <script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
    </>
  )
}
