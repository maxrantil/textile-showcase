interface HtmlHeadProps {
  children?: React.ReactNode
}

export function HtmlHead({ children }: HtmlHeadProps) {
  return (
    <head>
      {/* Preconnect to external domains for better performance */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* Performance hints */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="idaromme.dk" />

      {/* Enhanced referrer policy meta tag */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      {children}
    </head>
  )
}
