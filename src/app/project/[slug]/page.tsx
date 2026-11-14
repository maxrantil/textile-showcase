import { notFound } from 'next/navigation'
import { generateProjectMetadata } from './components/project-metadata'
import { generateProjectBreadcrumbs } from '@/app/metadata/breadcrumb-schema'
import { generateProjectStructuredData } from './utils/project-helpers'
import { getProjectWithNavigation } from './hooks/use-project-data'
import { ProjectContent } from './components/project-content'

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

  return (
    <>
      {/* Preconnect to Sanity CDN for faster image loading */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="dns-prefetch" href="https://cdn.sanity.io" />

      {/* No image preload here: the desktop carousel preloads its own first
          image, and the cover image is not the first thing either layout shows */}

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
