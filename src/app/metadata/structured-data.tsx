// Enhanced organization structured data
export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://idaromme.dk#organization',
  name: 'Ida Romme Studio',
  url: 'https://idaromme.dk',
  logo: 'https://idaromme.dk/icon-512x512.png',
  image: 'https://idaromme.dk/icon-512x512.png',
  description:
    'Contemporary Nordic textile design studio specializing in sustainable hand-woven pieces and innovative color exploration techniques.',
  founder: {
    '@type': 'Person',
    '@id': 'https://idaromme.dk#person',
    name: 'Ida Romme',
    url: 'https://idaromme.dk',
    jobTitle: 'Contemporary Textile Designer',
    knowsAbout: [
      'Textile Design',
      'Hand Weaving',
      'Sustainable Textiles',
      'Color Theory',
      'Nordic Design',
      'Contemporary Craft',
    ],
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Stockholm',
    addressCountry: 'Sweden',
  },
  sameAs: ['https://instagram.com/idaromme'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English', 'Swedish', 'Danish'],
  },
  areaServed: ['Europe', 'North America'],
  serviceType: [
    'Custom Textile Design',
    'Hand Weaving Services',
    'Textile Art Commission',
    'Contemporary Craft Consultation',
  ],
}

// Artist/Person structured data
export const artistStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://idaromme.dk#person',
  name: 'Ida Romme',
  url: 'https://idaromme.dk',
  image: 'https://idaromme.dk/icon-512x512.png',
  jobTitle: 'Contemporary Textile Designer',
  description:
    'Nordic textile artist specializing in contemporary hand-woven textiles with innovative color exploration and sustainable practices.',
  knowsAbout: [
    'Contemporary Textile Design',
    'Hand Weaving Techniques',
    'Sustainable Textile Practices',
    'Color Theory in Textiles',
    'Nordic Design Aesthetic',
    'Traditional Scandinavian Craft',
    'Natural Fiber Textiles',
  ],
  worksFor: {
    '@type': 'Organization',
    '@id': 'https://idaromme.dk#organization',
    name: 'Ida Romme Studio',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Stockholm',
    addressRegion: 'Stockholm County',
    addressCountry: 'Sweden',
  },
  sameAs: ['https://instagram.com/idaromme'],
  hasOccupation: {
    '@type': 'Occupation',
    name: 'Textile Designer',
    occupationLocation: {
      '@type': 'Place',
      name: 'Stockholm, Sweden',
    },
    skills: [
      'Hand Weaving',
      'Color Theory',
      'Sustainable Design',
      'Traditional Craft Techniques',
    ],
  },
}

// Website structured data
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://idaromme.dk#website',
  name: 'Ida Romme - Contemporary Nordic Textile Design',
  url: 'https://idaromme.dk',
  description:
    'Portfolio of contemporary Nordic textile designs featuring sustainable hand-woven pieces and innovative color exploration.',
  inLanguage: 'en-US',
  author: {
    '@type': 'Person',
    '@id': 'https://idaromme.dk#person',
    name: 'Ida Romme',
  },
  publisher: {
    '@type': 'Organization',
    '@id': 'https://idaromme.dk#organization',
    name: 'Ida Romme Studio',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://idaromme.dk/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

// Creative work schema for textile pieces
export const createTextileWorkSchema = (project: {
  title: string
  year?: string
  materials?: string[]
  technique?: string
  description?: string
  images?: string[]
}) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  '@id': `https://idaromme.dk/project/${project.title.toLowerCase().replace(/\s+/g, '-')}`,
  name: project.title,
  creator: {
    '@type': 'Person',
    '@id': 'https://idaromme.dk#person',
    name: 'Ida Romme',
  },
  dateCreated: project.year,
  material: project.materials,
  artform: 'Contemporary Textile Art',
  artMedium: 'Hand Woven Textiles',
  description: project.description,
  image: project.images,
  technique: project.technique,
  genre: ['Contemporary Craft', 'Textile Art', 'Nordic Design'],
  keywords: [
    'contemporary textile',
    'hand woven',
    'Nordic design',
    'sustainable textile',
    'color exploration',
  ],
  publisher: {
    '@type': 'Organization',
    '@id': 'https://idaromme.dk#organization',
    name: 'Ida Romme Studio',
  },
})

export function generateStructuredDataScript(
  data: object,
  nonce?: string | null
) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}
