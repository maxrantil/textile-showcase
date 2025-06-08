import { TextileDesign } from '@/sanity/types'
import ImageCarousel from '@/components/project/ImageCarousel/index'
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
              projectDescription={
                project.detailedDescription || project.description
              }
              projectMaterials={project.materials}
              projectTechnique={project.technique}
              projectDimensions={project.dimensions}
            />
          </ErrorBoundary>
        </div>
      </div>
    </>
  )
}
