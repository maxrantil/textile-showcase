import { Metadata } from 'next'
import { generateContactBreadcrumbs } from '@/app/metadata/breadcrumb-schema'

// SEO metadata for Contact page - optimized for commission inquiries
export const metadata: Metadata = {
  title:
    'Commission Textile Art | Contact Swedish Artist Ida Romme | Stockholm',
  description:
    'Commission custom hand-woven textile artwork from Swedish artist Ida Romme. Bespoke pieces for private collectors, galleries, and commercial projects. Based in Stockholm, serving Europe and North America.',
  keywords: [
    // Commission intent (high value)
    'commission textile art',
    'custom textile commission',
    'bespoke textile artwork',
    'hire textile artist',
    'textile art for sale',
    // Location-specific
    'commission artist Stockholm',
    'Swedish textile commission',
    'Nordic artist hire',
    'Scandinavian textile art buy',
    // Client types
    'textile art collectors',
    'gallery textile commission',
    'commercial textile art',
    'interior textile design',
    // Service descriptors
    'custom hand woven textiles',
    'sustainable textile commission',
    'contemporary craft commission',
    'bespoke weaving Sweden',
  ],
  openGraph: {
    title:
      'Commission Textile Art | Contact Swedish Artist Ida Romme | Stockholm',
    description:
      'Commission custom hand-woven textile artwork. Bespoke pieces for collectors and galleries. Based in Stockholm.',
    type: 'website',
    url: 'https://idaromme.dk/contact',
    siteName: 'Ida Romme',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Commission Textile Art | Contact Swedish Artist Ida Romme | Stockholm',
    description:
      'Commission custom hand-woven textile artwork. Bespoke pieces for collectors and galleries.',
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
