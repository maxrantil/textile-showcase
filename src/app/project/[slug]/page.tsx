import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resilientFetch, queries, getOptimizedImageUrl } from '@/lib/sanity'
import { TextileDesign } from '@/types/sanity'
import ImageCarousel from '@/components/ImageCarousel'
import { ErrorBoundary } from '@/components/LoadingSpinner'
import Link from 'next/link'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600

// Generate static params for ISR
export async function generateStaticParams() {
  try {
    const designs = await resilientFetch<Array<{ slug: { current: string } }>>(
      queries.getAllSlugs,
      {},
      { retries: 2, timeout: 5000 }
    )
    
    if (!designs) return []
    
    return designs
      .filter(design => design.slug?.current)
      .map((design) => ({
        slug: design.slug.current,
      }))
  } catch (error) {
    console.error('Failed to generate static params:', error)
    return []
  }
}

async function getProject(slug: string): Promise<TextileDesign | null> {
  try {
    const project = await resilientFetch<TextileDesign>(
      queries.getProjectBySlug,
      { slug },
      { 
        retries: 3, 
        timeout: 10000, 
        cache: true, 
        cacheTTL: 600000 // 10 minutes
      }
    )
    
    return project
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  
  if (!project) {
    return {
      title: 'Project Not Found - Ida Romme',
      description: 'The requested textile project could not be found.',
    }
  }

  const imageUrl = getOptimizedImageUrl(project.image, { 
    width: 1200, 
    height: 630, 
    quality: 90 
  })

  const title = `${project.title} - Ida Romme`
  const description = project.description || project.detailedDescription || 
    `Contemporary textile design by Ida Romme featuring ${project.materials || 'sustainable materials'}.`

  return {
    title,
    description,
    keywords: [
      project.title,
      'textile design',
      project.materials,
      project.technique,
      'contemporary textiles',
      'Ida Romme'
    ].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://idaromme.dk/project/${slug}`,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: project.title,
        }
      ] : [],
      publishedTime: project.year ? `${project.year}-01-01` : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `https://idaromme.dk/project/${slug}`,
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProject(slug)
  
  if (!project) {
    notFound()
  }

  // Structured data for the project
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": project.title,
    "creator": {
      "@type": "Person",
      "name": "Ida Romme"
    },
    "description": project.description || project.detailedDescription,
    "dateCreated": project.year ? `${project.year}-01-01` : undefined,
    "material": project.materials,
    "artMedium": "Textile",
    "artform": "Weaving",
    "image": project.image ? getOptimizedImageUrl(project.image, { width: 800, height: 600 }) : undefined,
    "url": `https://idaromme.dk/project/${slug}`,
    "isPartOf": {
      "@type": "Collection",
      "name": "Ida Romme Textile Collection"
    }
  }

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        {/* Header spacing */}
        <div style={{ height: '80px' }} />

        {/* Project Content */}
        <div style={{ paddingBottom: '40px' }}>
          <ErrorBoundary>
            <ImageCarousel 
              images={project.gallery || []}
              mainImage={project.image}
              projectTitle={project.title}
              projectYear={project.year}
              projectDescription={project.detailedDescription || project.description}
              projectMaterials={project.materials}
              projectTechnique={project.technique}
              projectDimensions={project.dimensions}
            />
          </ErrorBoundary>
        </div>

        {/* Navigation back to gallery - Simple Link without event handlers */}
        <div style={{ 
          textAlign: 'center', 
          paddingBottom: '40px',
          marginTop: '40px'
        }}>
          <Link
            href="/"
            style={{
              fontSize: '14px',
              color: '#333',
              textDecoration: 'none',
              letterSpacing: '1px',
              border: '1px solid #333',
              padding: '12px 24px',
              borderRadius: '6px',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </>
  )
}
