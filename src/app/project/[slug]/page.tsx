import { ClientProjectContent } from '@/components/ClientProjectContent'
import { generateProjectMetadata } from './components/project-metadata'
import { generateProjectBreadcrumbs } from '@/app/metadata/breadcrumb-schema'
import { generateProjectStructuredData } from './utils/project-helpers'
import { getProject } from './hooks/use-project-data'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

// Disable static generation - fully dynamic routing with client-side data fetching
export const dynamic = 'force-dynamic'

// Generate enhanced metadata with OG images and SEO optimization
export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params
  return generateProjectMetadata({ slug })
}

// Main page component with structured data for SEO
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  // Fetch project data for structured data schemas
  const project = await getProject(slug)

  // Generate structured data schemas
  const breadcrumbSchema = project
    ? generateProjectBreadcrumbs(project.title, slug)
    : null
  const projectSchema = project
    ? generateProjectStructuredData(project, slug)
    : null

  return (
    <>
      {/* Breadcrumb structured data for rich snippets */}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema),
          }}
        />
      )}

      {/* Project/CreativeWork structured data */}
      {projectSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(projectSchema),
          }}
        />
      )}

      <ClientProjectContent slug={slug} />
    </>
  )
}
