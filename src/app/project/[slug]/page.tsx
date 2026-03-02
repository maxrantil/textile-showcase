import { notFound } from 'next/navigation'
import { generateProjectMetadata } from './components/project-metadata'
import { generateProjectBreadcrumbs } from '@/app/metadata/breadcrumb-schema'
import { generateProjectStructuredData } from './utils/project-helpers'
import { getProjectWithNavigation } from './hooks/use-project-data'
import { ProjectContent } from './components/project-content'
import { getOptimizedImageUrl } from '@/utils/image-helpers'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

// Disable static generation - fully dynamic routing with server-side data fetching
export const dynamic = 'force-dynamic'

// Generate enhanced metadata with OG images and SEO optimization
export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params
  return generateProjectMetadata({ slug })
}

// Main page component — fetches all data server-side so images are in the initial HTML
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  const { project, nextProject, previousProject } =
    await getProjectWithNavigation(slug)

  if (!project) {
    notFound()
  }

  // Generate structured data schemas
  const breadcrumbSchema = generateProjectBreadcrumbs(project.title, slug)
  const projectSchema = generateProjectStructuredData(project, slug)

  // Build LCP preload URL for the main project image
  const imageSource = project.image || project.images?.[0]?.asset
  const preloadUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        width: 800,
        quality: 80,
        format: 'avif',
      })
    : null

  return (
    <>
      {/* Preconnect to Sanity CDN for faster image loading */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* Preload LCP image so the browser discovers it from the initial HTML */}
      {preloadUrl && (
        <link
          rel="preload"
          as="image"
          href={preloadUrl}
          type="image/avif"
          fetchPriority="high"
          crossOrigin="anonymous"
        />
      )}

      {/* Breadcrumb structured data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Project/CreativeWork structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectSchema),
        }}
      />

      <ProjectContent
        project={project}
        slug={slug}
        nextProject={nextProject}
        previousProject={previousProject}
      />
    </>
  )
}
