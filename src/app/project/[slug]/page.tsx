// Update src/app/project/[slug]/page.tsx

import { notFound } from 'next/navigation'
import {
  getProjectWithNavigation,
  getAllProjectSlugs,
} from './hooks/use-project-data'
import { generateProjectMetadata } from './components/project-metadata'
import { ProjectContent } from './components/project-content'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600

// Generate static params
export async function generateStaticParams() {
  return getAllProjectSlugs()
}

// Generate metadata
export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params
  return generateProjectMetadata({ slug })
}

// Main page component
export default async function ProjectPage({ params }: ProjectPageProps) {
  try {
    const { slug } = await params
    const { project, nextProject, previousProject } =
      await getProjectWithNavigation(slug)

    if (!project) {
      console.log(`🚫 Project not found, showing 404: ${slug}`)
      notFound()
    }

    return (
      <>
        <ProjectContent
          project={project}
          slug={slug}
          nextProject={nextProject}
          previousProject={previousProject}
        />
      </>
    )
  } catch (error) {
    console.error('❌ Error in ProjectPage:', error)
    notFound()
  }
}
