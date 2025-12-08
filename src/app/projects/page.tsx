import { Metadata } from 'next'
import Gallery from '@/components/adaptive/Gallery'
import { TextileDesign } from '@/types/textile'
import { FirstImage } from '@/components/server/FirstImage'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { generateBreadcrumbSchema } from '@/app/metadata/breadcrumb-schema'

// Enhanced metadata for projects page - optimized for portfolio discovery
export const metadata: Metadata = {
  title: 'Textile Art Portfolio | Swedish Hand Weaving Projects - Ida Romme',
  description:
    'Browse the complete portfolio of Swedish textile artist Ida Romme. Contemporary hand-woven pieces exploring color theory, sustainable materials, and traditional Scandinavian weaving techniques.',
  keywords: [
    // Portfolio discovery
    'textile art portfolio',
    'weaving portfolio',
    'textile design projects',
    'hand woven art collection',
    // Artist identity
    'Swedish textile art',
    'Nordic weaving projects',
    'Stockholm artist portfolio',
    'Scandinavian textile design',
    // Technique
    'contemporary hand weaving',
    'color exploration textiles',
    'sustainable textile art',
    'natural fiber weaving',
    // Style
    'contemporary craft',
    'modern textile design',
    'traditional weaving contemporary',
  ],
  openGraph: {
    title: 'Textile Art Portfolio | Swedish Hand Weaving Projects - Ida Romme',
    description:
      'Complete portfolio of Swedish textile artist Ida Romme. Contemporary hand-woven pieces exploring color theory.',
    type: 'website',
    locale: 'en_US',
    url: 'https://idaromme.dk/projects',
    siteName: 'Ida Romme',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Textile Art Portfolio | Swedish Hand Weaving Projects - Ida Romme',
    description:
      'Complete portfolio of Swedish textile artist Ida Romme. Contemporary hand-woven pieces.',
    creator: '@idaromme',
  },
  alternates: {
    canonical: 'https://idaromme.dk/projects',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Server-side data fetching to eliminate client-side JavaScript execution delay
async function getDesigns(): Promise<TextileDesign[]> {
  try {
    console.log('🔍 Server: Fetching designs for /projects SSR')

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
      `✅ Server: Successfully fetched ${designs?.length || 0} designs for /projects SSR`
    )
    return designs || []
  } catch (error) {
    console.error('❌ Server: Failed to fetch designs for /projects SSR:', error)
    return []
  }
}

export default async function ProjectsPage() {
  // Server-side data fetching to eliminate TTI delays
  const designs = await getDesigns()

  // Get first design for FirstImage component
  const firstDesign = designs[0]

  // Issue #41: Generate preload URLs for LCP image using helper
  // Quality reduced from 50 to 40, breakpoint 320w → 480w for mobile
  const imageSource = firstDesign?.image || firstDesign?.images?.[0]?.asset
  const preloadUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        width: 640,
        quality: 40,
        format: 'avif',
      })
    : null

  const preloadSrcSet = imageSource
    ? [
        `${getOptimizedImageUrl(imageSource, { width: 480, quality: 40, format: 'avif' })} 480w`,
        `${getOptimizedImageUrl(imageSource, { width: 640, quality: 40, format: 'avif' })} 640w`,
        `${getOptimizedImageUrl(imageSource, { width: 960, quality: 40, format: 'avif' })} 960w`,
      ].join(', ')
    : null

  return (
    <>
      {/* CRITICAL: Preconnect to Sanity CDN for faster image loading */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* Preload LCP image for immediate browser discovery
          Critical for Core Web Vitals - reduces Load Delay
          Issue #41: imageSizes aligned with FirstImage.tsx to avoid double download */}
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

      {/* Breadcrumb structured data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Projects', path: '/projects' },
            ])
          ),
        }}
      />

      {/* CollectionPage structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Textile Design Portfolio - Ida Romme',
            description:
              'Complete collection of contemporary textile design projects by Nordic artist Ida Romme, featuring sustainable hand-woven pieces.',
            url: 'https://idaromme.dk/projects',
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: designs.length,
              itemListOrder: 'https://schema.org/ItemListOrderDescending',
              itemListElement: designs.slice(0, 10).map((design, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'VisualArtwork',
                  name: design.title,
                  url: `https://idaromme.dk/project/${design.slug?.current || design._id}`,
                  creator: {
                    '@type': 'Person',
                    name: 'Ida Romme',
                  },
                  artform: 'Textile Art',
                  dateCreated: design.year ? `${design.year}` : undefined,
                },
              })),
            },
            isPartOf: {
              '@type': 'WebSite',
              name: 'Ida Romme',
              url: 'https://idaromme.dk',
            },
            author: {
              '@type': 'Person',
              name: 'Ida Romme',
              jobTitle: 'Contemporary Textile Designer',
              url: 'https://idaromme.dk',
            },
          }),
        }}
      />

      {/* Static HTML first image for LCP optimization
          Renders in initial HTML so browser can discover and load immediately
          Hidden after client hydration completes */}
      {firstDesign && <FirstImage design={firstDesign} />}

      <Gallery designs={designs} />
    </>
  )
}
