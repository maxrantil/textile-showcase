import { Metadata } from 'next'
import { resilientFetch, queries } from '@/sanity/lib'
import { TextileDesign } from '@/sanity/types'
import { HorizontalGallery } from '@/components/gallery'
import { GalleryLoadingSkeleton } from '@/components/ui/LoadingSpinner'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Suspense } from 'react'

// Enhanced metadata with structured data
export const metadata: Metadata = {
  title: 'Ida Romme - Contemporary Textile Design',
  description: 'Explore contemporary textile designs by Ida Romme, featuring sustainable hand-woven pieces that bridge traditional craftsmanship with modern aesthetics.',
  keywords: ['textile design', 'hand weaving', 'sustainable textiles', 'contemporary craft', 'Stockholm', 'textile art'],
  openGraph: {
    title: 'Ida Romme - Contemporary Textile Design',
    description: 'Contemporary textile designs featuring sustainable hand-woven pieces',
    type: 'website',
    locale: 'en_US',
    url: 'https://idaromme.dk',
    siteName: 'Ida Romme',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ida Romme - Contemporary Textile Design',
    description: 'Contemporary textile designs featuring sustainable hand-woven pieces',
  },
  alternates: {
    canonical: 'https://idaromme.dk',
  },
  robots: {
    index: true,
    follow: true,
  }
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600

async function getDesigns(): Promise<TextileDesign[]> {
  try {
    const designs = await resilientFetch<TextileDesign[]>(
      queries.getDesignsForHome,
      {},
      { 
        retries: 3, 
        timeout: 8000, 
        cache: true, 
        cacheTTL: 300000 // 5 minutes
      }
    )
    
    return designs || []
  } catch (error) {
    console.error('Failed to fetch designs for home page:', error)
    return []
  }
}

// Gallery component with error boundary
function GalleryWithErrorBoundary({ designs }: { designs: TextileDesign[] }) {
  if (!designs || designs.length === 0) {
    return (
      <div className="full-height-mobile" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fafafa' 
      }}>
        <div className="container-mobile" style={{ textAlign: 'center' }}>
          <h2 className="text-h2-mobile text-crisp" style={{
            margin: '0 0 16px 0',
            color: '#333'
          }}>
            No designs available
          </h2>
          <p className="text-body-mobile" style={{
            color: '#666'
          }}>
            Please check back later for new work.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <HorizontalGallery designs={designs} />
    </ErrorBoundary>
  )
}

export default async function Home() {
  const designs = await getDesigns()
  
  return (
    <>
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Ida Romme",
            "url": "https://idaromme.dk",
            "jobTitle": "Textile Designer",
            "worksFor": {
              "@type": "Organization",
              "name": "Ida Romme Studio"
            },
            "knowsAbout": ["Textile Design", "Hand Weaving", "Sustainable Textiles"],
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Stockholm",
              "addressCountry": "DK"
            }
          })
        }}
      />
      
      <Suspense fallback={<GalleryLoadingSkeleton />}>
        <GalleryWithErrorBoundary designs={designs} />
      </Suspense>
    </>
  )
}
