import { Metadata } from 'next'
import { generateContactBreadcrumbs } from '@/app/metadata/breadcrumb-schema'

export const metadata: Metadata = {
  title:
    'Commission Contemporary Textile Art | Collaborate with Nordic Designer',
  description:
    'Commission custom contemporary textile artwork from Ida Romme. Specializing in sustainable hand-woven pieces, color exploration, and Scandinavian design aesthetics for galleries and collectors.',
  keywords: [
    'commission textile artwork',
    'textile design collaboration',
    'contemporary craft commission',
    'hire textile designer',
    'custom weaving services',
    'Nordic textile consultant',
    'commission contemporary textile',
    'bespoke Nordic textile art',
    'hire sustainable textile designer',
    'custom hand woven textiles',
    'textile art commission Stockholm',
  ],
  openGraph: {
    title:
      'Commission Contemporary Textile Art | Collaborate with Nordic Designer Ida Romme',
    description:
      'Commission custom contemporary textile artwork from Ida Romme. Specializing in sustainable hand-woven pieces and Scandinavian design aesthetics.',
    type: 'website',
    url: 'https://idaromme.dk/contact',
    siteName: 'Ida Romme',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Commission Contemporary Textile Art | Collaborate with Nordic Designer',
    description:
      'Commission custom contemporary textile artwork from Ida Romme. Specializing in sustainable hand-woven pieces and Scandinavian design aesthetics.',
    creator: '@idaromme',
  },
  alternates: {
    canonical: 'https://idaromme.dk/contact',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbSchema = generateContactBreadcrumbs()

  // ContactPage schema for commission inquiries
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Ida Romme - Textile Art Commissions',
    description:
      'Commission custom contemporary textile artwork or collaborate with Nordic textile designer Ida Romme.',
    url: 'https://idaromme.dk/contact',
    mainEntity: {
      '@type': 'Person',
      name: 'Ida Romme',
      jobTitle: 'Contemporary Textile Designer',
      url: 'https://idaromme.dk',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Stockholm',
        addressRegion: 'Stockholm County',
        addressCountry: 'SE',
      },
      makesOffer: {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Custom Textile Commission',
          description:
            'Bespoke hand-woven textile artworks created using sustainable materials and traditional Scandinavian techniques.',
          provider: {
            '@type': 'Person',
            name: 'Ida Romme',
          },
          areaServed: ['Europe', 'North America', 'Scandinavia'],
        },
      },
    },
  }

  return (
    <>
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* ContactPage structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema),
        }}
      />

      {children}
    </>
  )
}
