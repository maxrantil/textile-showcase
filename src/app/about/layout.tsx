import { Metadata } from 'next'

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
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Artist Statement - Color Exploration in Contemporary Nordic Textiles',
    description:
      "Learn about Ida Romme's approach to contemporary textile art through methodical color exploration and traditional Scandinavian weaving techniques.",
  },
  alternates: {
    canonical: 'https://idaromme.dk/about',
  },
}

interface AboutLayoutProps {
  children: React.ReactNode
}

export default function AboutLayout({ children }: AboutLayoutProps) {
  return children
}
