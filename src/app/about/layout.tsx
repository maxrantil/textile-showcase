import { Metadata } from 'next'
import { generateAboutBreadcrumbs } from '@/app/metadata/breadcrumb-schema'

// SEO metadata for About page - optimized for artist discovery
export const metadata: Metadata = {
  title:
    'About Ida Romme - Scandinavian Textile Artist | Color Theory & Sustainable Weaving',
  description:
    'Scandinavian textile artist Ida Romme explores color combinations through methodical precision. Swedish School of Textiles (Borås) graduate. Paul Frankenius Stiftelse Grant 2025 recipient. Based in Gothenburg, exhibiting internationally.',
  keywords: [
    // Artist identity
    'Scandinavian textile artist',
    'Nordic textile artist',
    'Gothenburg textile designer',
    'contemporary fiber artist',
    // Education & credentials
    'Swedish School of Textiles',
    'Borås textile graduate',
    'textile design MA',
    'Paul Frankenius Grant',
    // Technique & approach
    'color exploration textiles',
    'color theory weaving',
    'methodical color combinations',
    'sustainable textile practices',
    'traditional Scandinavian weaving',
    // Recognition
    'textile art exhibitions',
    'contemporary craft awards',
    '3daysofdesign Copenhagen',
    'Textilmuseet Borås',
  ],
  openGraph: {
    title:
      'About Ida Romme - Scandinavian Textile Artist | Color Theory & Sustainable Weaving',
    description:
      'Swedish School of Textiles graduate exploring color through hand weaving. Award-winning artist exhibiting in Copenhagen and Borås.',
    type: 'article',
    url: 'https://idaromme.dk/about',
    siteName: 'Ida Romme',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'About Ida Romme - Scandinavian Textile Artist | Color Theory & Sustainable Weaving',
    description:
      'Swedish School of Textiles graduate exploring color through hand weaving. Award-winning artist.',
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
