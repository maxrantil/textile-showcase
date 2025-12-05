import { Metadata } from 'next'
import Gallery from '@/components/adaptive/Gallery'
import { TextileDesign } from '@/types/textile'
import { FirstImage } from '@/components/server/FirstImage'
import { getOptimizedImageUrl } from '@/utils/image-helpers'

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

  // Issue #51 Phase 1: Get first design for FirstImage component
  const firstDesign = designs[0]

  // Issue #78: Generate preload URLs for LCP image using helper
  const imageSource = firstDesign?.image || firstDesign?.images?.[0]?.asset
  const preloadUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        width: 640,
        quality: 50,
        format: 'avif',
      })
    : null

  const preloadSrcSet = imageSource
    ? [
        `${getOptimizedImageUrl(imageSource, { width: 320, quality: 50, format: 'avif' })} 320w`,
        `${getOptimizedImageUrl(imageSource, { width: 640, quality: 50, format: 'avif' })} 640w`,
        `${getOptimizedImageUrl(imageSource, { width: 960, quality: 50, format: 'avif' })} 960w`,
      ].join(', ')
    : null

  return (
    <>
      {/* CRITICAL: Preconnect to Sanity CDN for faster image loading (Issue #94 Phase 2) */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* Issue #78: Preload LCP image for immediate browser discovery
          Critical for Core Web Vitals - reduces Load Delay from 6.2s to <1s
          IMPORTANT: imageSizes MUST match FirstImage.tsx exactly to avoid double download
          Issue #41: Aligned sizes with FirstImage.tsx (max-width: 480px/768px) */}
      {preloadUrl && (
        <link
          rel="preload"
          as="image"
          href={preloadUrl}
          imageSrcSet={preloadSrcSet || undefined}
          imageSizes="(max-width: 480px) 100vw, (max-width: 768px) 90vw, 640px"
          type="image/avif"
          fetchPriority="high"
        />
      )}

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

      {/* Issue #86: WCAG 2.1 AA - Level-one heading for proper document structure
          Screen reader users need H1 for page identification and navigation
          Visually hidden to maintain existing minimal gallery-first design */}
      <h1 className="sr-only">Ida Romme - Contemporary Textile Design</h1>

      {/* Issue #51 Phase 2: Static HTML first image for LCP optimization
          Renders in initial HTML so browser can discover and load immediately
          Hidden after client hydration completes */}
      {firstDesign && <FirstImage design={firstDesign} />}

      <Gallery designs={designs} />
    </>
  )
}
