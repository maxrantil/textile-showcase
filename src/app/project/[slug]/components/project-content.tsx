// Update src/app/project/[slug]/components/project-content.tsx

import { TextileDesign } from '@/types/textile'
import ProjectView from '@/components/adaptive/Project'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { generateProjectStructuredData } from '../utils/project-helpers'
import { safeJsonLd } from '@/lib/safeJsonLd'

interface ProjectContentProps {
  project: TextileDesign
  slug: string
  nextProject?: { slug: string; title: string }
  previousProject?: { slug: string; title: string }
  initialDeviceType?: 'mobile' | 'desktop'
}

export function ProjectContent({
  project,
  slug,
  nextProject,
  previousProject,
  initialDeviceType,
}: ProjectContentProps) {
  const structuredData = generateProjectStructuredData(project, slug)

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(structuredData),
        }}
      />

      <div className="project-content-wrapper">
        {/* Header spacing */}
        <div className="project-header-spacer" />

        {/* Project Content */}
        <div className="project-content-container">
          <ErrorBoundary>
            <ProjectView
              project={project}
              nextProject={nextProject}
              previousProject={previousProject}
              initialDeviceType={initialDeviceType}
            />
          </ErrorBoundary>
        </div>
      </div>
    </>
  )
}
