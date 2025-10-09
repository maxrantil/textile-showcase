import type { Metadata, Viewport } from 'next'

export const baseMetadata: Metadata = {
  title: {
    default:
      'Ida Romme - Contemporary Nordic Textile Artist | Sustainable Hand Weaving & Color Exploration',
    template: '%s - Ida Romme',
  },
  description:
    'Explore contemporary textile designs by Nordic artist Ida Romme. Sustainable hand-woven pieces featuring innovative color exploration and traditional Scandinavian craftsmanship techniques.',
  keywords: [
    'contemporary textile design',
    'Nordic textile artist',
    'sustainable hand weaving',
    'color exploration textiles',
    'Scandinavian design aesthetic',
    'Stockholm textile designer',
    'traditional weaving techniques',
    'natural fiber textiles',
    'sustainable textile practices',
    'textile art commission',
    'contemporary craft',
    'Nordic contemporary craft',
    'sustainable weaving practices',
    'methodical color combinations',
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
  title: 'Ida Romme - Contemporary Textile Design',
  description:
    'Contemporary textile designs featuring sustainable hand-woven pieces',
}

export const twitterMetadata: Metadata['twitter'] = {
  card: 'summary_large_image',
  title: 'Ida Romme - Contemporary Textile Design',
  description:
    'Contemporary textile designs featuring sustainable hand-woven pieces',
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
