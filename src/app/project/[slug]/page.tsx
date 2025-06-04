// src/app/project/[slug]/page.tsx - Fixed with better timeouts and error handling

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resilientFetch, queries, getOptimizedImageUrl } from '@/sanity/lib'
import { TextileDesign } from '@/sanity/types'
import ImageCarousel from '@/components/project/ImageCarousel'
import BackButton from '@/components/layout/BackButton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600

// FIXED: Generate static params with better error handling and timeouts
export async function generateStaticParams() {
  try {
    console.log('🏗️ Generating static params...')
    
    const designs = await resilientFetch<Array<{ slug: string; _updatedAt: string }>>(
      queries.getAllSlugs,
      {},
      { 
        retries: 2, 
        timeout: 20000, // Increased to 20 seconds
        cache: true,
        cacheTTL: 300000 // 5 minutes cache
      }
    )
    
    if (!designs || designs.length === 0) {
      console.warn('⚠️ No designs found for static generation')
      return []
    }
    
    console.log(`✅ Found ${designs.length} designs for static generation`)
    
    return designs
      .filter(design => design.slug)
      .map((design) => ({
        slug: design.slug,
      }))
  } catch (error) {
    console.error('❌ Failed to generate static params:', error)
    return [] // Return empty array instead of failing the build
  }
}

async function getProject(slug: string): Promise<TextileDesign | null> {
  try {
    console.log(`🔍 Fetching project: ${slug}`)
    
    const project = await resilientFetch<TextileDesign>(
      queries.getProjectBySlug,
      { slug },
      { 
        retries: 3, 
        timeout: 15000, // 15 seconds timeout
        cache: true, 
        cacheTTL: 600000 // 10 minutes cache
      }
    )
    
    if (project) {
      console.log(`✅ Project found: ${project.title}`)
    } else {
      console.warn(`⚠️ Project not found: ${slug}`)
    }
    
    return project
  } catch (error) {
    console.error(`❌ Failed to fetch project ${slug}:`, error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  try {
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
  } catch (error) {
    console.error('❌ Failed to generate metadata:', error)
    return {
      title: 'Project - Ida Romme',
      description: 'Contemporary textile design by Ida Romme.',
    }
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  try {
    const { slug } = await params
    const project = await getProject(slug)
    
    if (!project) {
      console.log(`🚫 Project not found, showing 404: ${slug}`)
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

          {/* Navigation back to gallery */}
          <div style={{ 
            textAlign: 'center', 
            paddingBottom: '40px',
            marginTop: '40px'
          }}>
            <BackButton />
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error('❌ Error in ProjectPage:', error)
    notFound()
  }
}
