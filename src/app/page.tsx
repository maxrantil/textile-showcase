import { Metadata } from 'next'
import { ClientGallery } from '@/components/ClientGallery'

// Enhanced metadata with structured data
export const metadata: Metadata = {
  title: 'Ida Romme - Contemporary Textile Design',
  description:
    'Explore contemporary textile designs by Ida Romme, featuring sustainable hand-woven pieces that bridge traditional craftsmanship with modern aesthetics.',
  keywords: [
    'textile design',
    'hand weaving',
    'sustainable textiles',
    'contemporary craft',
    'Stockholm',
    'textile art',
  ],
  openGraph: {
    title: 'Ida Romme - Contemporary Textile Design',
    description:
      'Contemporary textile designs featuring sustainable hand-woven pieces',
    type: 'website',
    locale: 'en_US',
    url: 'https://idaromme.dk',
    siteName: 'Ida Romme',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ida Romme - Contemporary Textile Design',
    description:
      'Contemporary textile designs featuring sustainable hand-woven pieces',
  },
  alternates: {
    canonical: 'https://idaromme.dk',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Home() {
  return (
    <>
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Ida Romme',
            url: 'https://idaromme.dk',
            jobTitle: 'Textile Designer',
            worksFor: {
              '@type': 'Organization',
              name: 'Ida Romme Studio',
            },
            knowsAbout: [
              'Textile Design',
              'Hand Weaving',
              'Sustainable Textiles',
            ],
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Stockholm',
              addressCountry: 'DK',
            },
          }),
        }}
      />

      <ClientGallery />
    </>
  )
}
