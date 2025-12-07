import { Metadata } from 'next'
import { generateAboutBreadcrumbs } from '@/app/metadata/breadcrumb-schema'

// SEO metadata for About page
export const metadata: Metadata = {
  title: 'Artist Statement - Color Exploration in Contemporary Nordic Textiles',
  description:
    "Learn about Ida Romme's approach to contemporary textile art through methodical color exploration, traditional Scandinavian weaving techniques, and sustainable design practices.",
  keywords: [
    'textile artist statement',
    'color exploration methodology',
    'traditional weaving modern aesthetics',
    'Scandinavian design philosophy',
    'sustainable craft practices',
    'contemporary textile research',
    'Nordic textile artist',
    'methodical color combinations',
    'sustainable textile practices',
    'traditional craftsmanship modern aesthetics',
  ],
  openGraph: {
    title:
      'Artist Statement - Color Exploration in Contemporary Nordic Textiles | Ida Romme',
    description:
      "Learn about Ida Romme's approach to contemporary textile art through methodical color exploration and traditional Scandinavian weaving techniques.",
    type: 'article',
    url: 'https://idaromme.dk/about',
    siteName: 'Ida Romme',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Artist Statement - Color Exploration in Contemporary Nordic Textiles',
    description:
      "Learn about Ida Romme's approach to contemporary textile art through methodical color exploration and traditional Scandinavian weaving techniques.",
    creator: '@idaromme',
  },
  alternates: {
    canonical: 'https://idaromme.dk/about',
  },
  robots: {
    index: true,
    follow: true,
  },
}

interface AboutLayoutProps {
  children: React.ReactNode
}

export default function AboutLayout({ children }: AboutLayoutProps) {
  const breadcrumbSchema = generateAboutBreadcrumbs()

  // Person schema with education and exhibition history
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Ida Romme',
    url: 'https://idaromme.dk',
    jobTitle: 'Contemporary Textile Designer',
    description:
      'Nordic textile artist exploring color combinations through methodical precision and traditional Scandinavian weaving techniques.',
    alumniOf: [
      {
        '@type': 'CollegeOrUniversity',
        name: 'Swedish School of Textiles',
        sameAs: 'https://www.hb.se/en/the-swedish-school-of-textiles/',
      },
    ],
    award: [
      'Paul Frankenius Stiftelse Grant 2025',
      'Tage Vanggaard og Hustrus Fond Grant 2023',
    ],
    knowsAbout: [
      'Color Theory',
      'Hand Weaving',
      'Textile Design',
      'Sustainable Practices',
      'Nordic Design',
    ],
    sameAs: ['https://www.instagram.com/idaromme'],
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

      {/* Person structured data with awards and education */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />

      {children}
    </>
  )
}
