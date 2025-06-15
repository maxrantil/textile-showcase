import { TextileDesign } from '@/sanity/types'
import ProjectView from '@/components/adaptive/Project'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { generateProjectStructuredData } from '../utils/project-helpers'

interface ProjectContentProps {
  project: TextileDesign
  slug: string
}

export function ProjectContent({ project, slug }: ProjectContentProps) {
  const structuredData = generateProjectStructuredData(project, slug)

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <div className="project-content-wrapper">
        {/* Header spacing */}
        <div className="project-header-spacer" />

        {/* Project Content */}
        <div className="project-content-container">
          <ErrorBoundary>
            <ProjectView project={project} />
          </ErrorBoundary>
        </div>
      </div>
    </>
  )
}
