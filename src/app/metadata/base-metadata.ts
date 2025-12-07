import type { Metadata, Viewport } from 'next'

export const baseMetadata: Metadata = {
  title: {
    default:
      'Ida Romme - Contemporary Nordic Textile Artist | Sustainable Hand Weaving & Color Exploration',
    template: '%s - Ida Romme',
  },
  description:
    'Contemporary textile art by Swedish designer Ida Romme. Award-winning hand-woven pieces exploring color theory and sustainable practices. Swedish School of Textiles graduate based in Stockholm. Commissions welcome.',
  keywords: [
    // Primary keywords (high intent)
    'Nordic textile artist',
    'Swedish textile designer',
    'contemporary textile art',
    'hand woven textiles Sweden',
    'textile art commission',

    // Location-based (local SEO)
    'Stockholm textile artist',
    'Swedish weaving artist',
    'Scandinavian textile design',
    'Nordic fiber artist',
    'Sweden textile art',

    // Technique-specific
    'sustainable hand weaving',
    'color exploration textiles',
    'contemporary weaving',
    'hand woven art',
    'traditional Scandinavian weaving',

    // Long-tail / intent keywords
    'commission textile artwork',
    'custom hand woven textiles',
    'bespoke textile art Sweden',
    'sustainable fiber art',
    'contemporary craft Stockholm',

    // Credential-based
    'Swedish School of Textiles',
    'Borås textile graduate',
    'award winning textile artist',

    // Style/aesthetic
    'Nordic design aesthetic',
    'methodical color combinations',
    'natural fiber textiles',
    'sustainable textile practices',
    'contemporary Nordic craft',
  ],
  authors: [{ name: 'Ida Romme' }],
  creator: 'Ida Romme',
  publisher: 'Ida Romme Studio',
  metadataBase: new URL('https://idaromme.dk'),
  alternates: {
    canonical: '/',
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export const openGraphMetadata: Metadata['openGraph'] = {
  type: 'website',
  locale: 'en_US',
  url: 'https://idaromme.dk',
  siteName: 'Ida Romme',
  title: 'Ida Romme - Swedish Textile Artist | Contemporary Hand Weaving',
  description:
    'Award-winning Swedish textile artist exploring color theory through sustainable hand weaving. Swedish School of Textiles graduate. Commissions available.',
}

export const twitterMetadata: Metadata['twitter'] = {
  card: 'summary_large_image',
  title: 'Ida Romme - Swedish Textile Artist | Contemporary Hand Weaving',
  description:
    'Award-winning Swedish textile artist exploring color theory through sustainable hand weaving. Commissions available.',
  creator: '@idaromme',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
  colorScheme: 'light',
}
