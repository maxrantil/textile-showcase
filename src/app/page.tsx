import { Metadata } from 'next'
import Gallery from '@/components/adaptive/Gallery'
import { TextileDesign } from '@/types/textile'
import { FirstImage } from '@/components/server/FirstImage'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { generatePortfolioFAQSchema } from '@/app/metadata/faq-schema'

// Enhanced metadata with structured data - optimized for search visibility
export const metadata: Metadata = {
  title: 'Ida Romme - Scandinavian Textile Artist | Contemporary Hand Weaving',
  description:
    'Award-winning Scandinavian textile artist Ida Romme creates contemporary hand-woven art exploring color theory and sustainable practices. Swedish School of Textiles graduate based in Gothenburg. View portfolio and commission custom textile artwork.',
  keywords: [
    // Primary
    'Scandinavian textile artist',
    'Nordic textile artist',
    'contemporary textile art',
    'hand woven textiles',
    // Location
    'Gothenburg textile artist',
    'Scandinavian weaving artist',
    'Scandinavian textile design',
    // Technique
    'sustainable hand weaving',
    'color exploration',
    'contemporary weaving',
    // Intent
    'textile art commission',
    'custom textile artwork',
    // Credentials
    'Swedish School of Textiles',
    'award winning textile artist',
  ],
  openGraph: {
    title: 'Ida Romme - Scandinavian Textile Artist | Contemporary Hand Weaving',
    description:
      'Award-winning Scandinavian textile artist creating contemporary hand-woven art. Swedish School of Textiles graduate. Commissions welcome.',
    type: 'website',
    locale: 'en_US',
    url: 'https://idaromme.dk',
    siteName: 'Ida Romme',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ida Romme - Scandinavian Textile Artist | Contemporary Hand Weaving',
    description:
      'Award-winning Scandinavian textile artist creating contemporary hand-woven art. Commissions welcome.',
    creator: '@idaromme',
  },
  alternates: {
    canonical: 'https://idaromme.dk',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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

  // Issue #78/#41: Generate preload URLs for LCP image using helper
  // Issue #41: Quality reduced from 50 to 40, breakpoint 320w → 480w for mobile
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
          crossOrigin="anonymous"
        />
      )}

      {/* Structured data for SEO - Person schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Ida Romme',
            url: 'https://idaromme.dk',
            jobTitle: 'Contemporary Textile Designer',
            worksFor: {
              '@type': 'Organization',
              name: 'Ida Romme Studio',
            },
            knowsAbout: [
              'Textile Design',
              'Hand Weaving',
              'Sustainable Textiles',
              'Contemporary Craft',
              'Nordic Design',
            ],
            alumniOf: {
              '@type': 'CollegeOrUniversity',
              name: 'Swedish School of Textiles',
              sameAs: 'https://www.hb.se/en/the-swedish-school-of-textiles/',
            },
            sameAs: ['https://www.instagram.com/idaromme'],
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Gothenburg',
              addressRegion: 'Västra Götaland County',
              addressCountry: 'SE',
            },
          }),
        }}
      />

      {/* FAQ structured data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePortfolioFAQSchema()),
        }}
      />

      {/* Issue #86: WCAG 2.1 AA - Level-one heading for proper document structure
          Screen reader users need H1 for page identification and navigation
          Visually hidden to maintain existing minimal gallery-first design
          SEO: Keywords include location, profession, and specialty */}
      <h1 className="sr-only">
        Ida Romme - Scandinavian Textile Artist | Contemporary Hand Weaving &amp;
        Color Exploration | Gothenburg
      </h1>

      {/* Issue #51 Phase 2: Static HTML first image for LCP optimization
          Renders in initial HTML so browser can discover and load immediately
          Hidden after client hydration completes */}
      {firstDesign && <FirstImage design={firstDesign} />}

      <Gallery designs={designs} />
    </>
  )
}
