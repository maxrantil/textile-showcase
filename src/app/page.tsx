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

  // Generate /_next/image preload URLs for the LCP element (MobileGalleryItem)
  // Issue #345: Previous preload pointed to Sanity CDN URLs which don't match the LCP image URL.
  // MobileGalleryItem uses next/image which proxies through /_next/image, so the browser
  // must wait for JS hydration (~2.7s) to discover the image. Preloading /_next/image URLs
  // here (SSR) lets the browser start fetching before any JS runs.
  const imageSource = firstDesign?.image || firstDesign?.images?.[0]?.asset
  // Match MobileGalleryItem: getOptimizedImageUrl(imageSource, { width: 800, quality: 80 })
  const baseImageUrl = imageSource
    ? getOptimizedImageUrl(imageSource, { width: 800, quality: 80 })
    : null

  // Breakpoints: 750w, 828w cover mobile DPR 1–2; 1080w, 1200w cover larger screens
  // q=75 matches Next.js Image default quality
  const nextImageSrcSet = baseImageUrl
    ? [750, 828, 1080, 1200]
        .map(
          (w) =>
            `/_next/image?url=${encodeURIComponent(baseImageUrl)}&w=${w}&q=75 ${w}w`
        )
        .join(', ')
    : null

  return (
    <>
      {/* CRITICAL: Preconnect to Sanity CDN for faster image loading (Issue #94 Phase 2) */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* Issue #345: Preload /_next/image URL for LCP element (MobileGalleryItem)
          MobileGalleryItem is 'use client' — without this, browser waits 2.7s for JS
          hydration to discover the LCP image. Preloading /_next/image srcset here
          (SSR HTML) lets the browser start fetching before any JavaScript executes. */}
      {nextImageSrcSet && (
        <link
          rel="preload"
          as="image"
          imageSrcSet={nextImageSrcSet}
          imageSizes="100vw"
          fetchPriority="high"
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
