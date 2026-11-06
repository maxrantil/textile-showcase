import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { deviceTypeFromHeaders } from '@/lib/deviceHint'
import { generateProjectMetadata } from './components/project-metadata'
import { generateProjectBreadcrumbs } from '@/app/metadata/breadcrumb-schema'
import { generateProjectStructuredData } from './utils/project-helpers'
import { getProjectWithNavigation } from './hooks/use-project-data'
import { ProjectContent } from './components/project-content'
import { safeJsonLd } from '@/lib/safeJsonLd'

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

  // Render the view matching the requesting device so phones get the mobile
  // layout and its LCP image in the initial HTML (the client still re-checks)
  const initialDeviceType = deviceTypeFromHeaders(await headers())

  // Generate structured data schemas
  const breadcrumbSchema = generateProjectBreadcrumbs(project.title, slug)
  const projectSchema = generateProjectStructuredData(project, slug)

  return (
    <>
      {/* Preconnect to Sanity CDN for faster image loading */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* No page-level LCP preload: the desktop carousel's first image uses
          next/image priority, which preloads its exact responsive srcset. The old
          hand-written preload (main image, w=800, webp, crossOrigin) matched
          neither view's <img>, so every visit downloaded an unused image. */}

      {/* Breadcrumb structured data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbSchema),
        }}
      />

      {/* Project/CreativeWork structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(projectSchema),
        }}
      />

      <ProjectContent
        project={project}
        slug={slug}
        initialDeviceType={initialDeviceType}
        nextProject={nextProject}
        previousProject={previousProject}
      />
    </>
  )
}
