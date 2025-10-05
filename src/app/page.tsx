import { Metadata } from 'next'
import Gallery from '@/components/Gallery'
import { TextileDesign } from '@/types/textile'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { HtmlHead } from './components/html-head'
import { FirstImage } from '@/components/server/FirstImage'

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

// Server-side data fetching to eliminate client-side JavaScript execution delay
async function getDesigns(): Promise<TextileDesign[]> {
  try {
    console.log('🔍 Server: Fetching designs for SSR')

    // Server-side dynamic import - Sanity only loaded on server
    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    const designs = await resilientFetch<TextileDesign[]>(
      queries.getDesignsForHome,
      {},
      {
        retries: 3,
        timeout: 8000,
        cache: true,
        cacheTTL: 300000, // 5 minutes
      }
    )

    console.log(
      `✅ Server: Successfully fetched ${designs?.length || 0} designs for SSR`
    )
    return designs || []
  } catch (error) {
    console.error('❌ Server: Failed to fetch designs for SSR:', error)
    return []
  }
}

export default async function Home() {
  // EMERGENCY FIX: Move data fetching to server-side to eliminate TTI delays
  const designs = await getDesigns()

  // Issue #51 Phase 1: Generate LCP image URL for preload hint
  const firstDesign = designs[0]
  const lcpImageUrl = firstDesign
    ? getOptimizedImageUrl(
        firstDesign.image || firstDesign.images?.[0]?.asset || '',
        {
          width: 450,
          quality: 80,
          format: 'auto',
        }
      )
    : undefined

  return (
    <>
      {/* Issue #51 Phase 1: Preload LCP image for immediate discovery */}
      <HtmlHead lcpImageUrl={lcpImageUrl} />

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

      {/* Issue #51 Phase 2: Static HTML first image for LCP optimization
          Renders in initial HTML so browser can discover and load immediately
          Hidden after client hydration completes */}
      {firstDesign && <FirstImage design={firstDesign} />}

      <Gallery designs={designs} />
    </>
  )
}
