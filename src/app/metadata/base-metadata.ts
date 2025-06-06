import type { Metadata, Viewport } from 'next'

export const baseMetadata: Metadata = {
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
      { url: '/icon.svg', type: 'image/svg+xml' },
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
  description: 'Contemporary textile designs featuring sustainable hand-woven pieces',
}

export const twitterMetadata: Metadata['twitter'] = {
  card: 'summary_large_image',
  title: 'Ida Romme - Contemporary Textile Design',
  description: 'Contemporary textile designs featuring sustainable hand-woven pieces',
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
