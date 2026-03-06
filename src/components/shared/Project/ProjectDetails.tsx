// ABOUTME: Shared project details component displaying title, description, materials, and technical specifications
'use client'

import { TextileDesign } from '@/types/textile'

interface ProjectDetailsProps {
  project: TextileDesign
  classPrefix: 'mobile' | 'desktop'
}

export function ProjectDetails({ project, classPrefix: p }: ProjectDetailsProps) {
  // Resolve CSS class naming inconsistencies between mobile and desktop
  const detailGridClass = p === 'mobile' ? 'mobile-detail-grid' : 'desktop-project-info'
  const detailItemClass = p === 'mobile' ? 'mobile-detail-item' : 'desktop-info-item'

  const formatDimensions = (
    d: string | { width?: number; height?: number; unit?: string }
  ) =>
    typeof d === 'string'
      ? d
      : `${d.width}${d.unit || ''} × ${d.height}${d.unit || ''}`

  return (
    <div className={`${p}-project-details`}>
      <header className={`${p}-project-header`}>
        <h1 className={`${p}-project-title`}>{project.title}</h1>
        {project.year && <p className={`${p}-project-year`}>{project.year}</p>}
      </header>

      {project.description && (
        <section className={`${p}-project-section`}>
          <p className={`${p}-project-description`}>{project.description}</p>
        </section>
      )}

      {/* Technical Details */}
      {(project.materials || project.technique || project.dimensions) && (
        <section className={`${p}-project-section`}>
          <h2 className={`${p}-section-title`}>Details</h2>
          <div className={detailGridClass}>
            {project.materials && (
              <div className={detailItemClass}>
                <h3>Materials</h3>
                <p>{project.materials.join(', ')}</p>
              </div>
            )}
            {project.technique && (
              <div className={detailItemClass}>
                <h3>Technique</h3>
                <p>{project.technique}</p>
              </div>
            )}
            {project.dimensions && (
              <div className={detailItemClass}>
                <h3>Dimensions</h3>
                <p>{formatDimensions(project.dimensions)}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Extended Description */}
      {project.detailedDescription && (
        <section className={`${p}-project-section`}>
          <h2 className={`${p}-section-title`}>About This Piece</h2>
          <p className={`${p}-project-description`}>
            {project.detailedDescription}
          </p>
        </section>
      )}

      {/* Additional Information */}
      {(project.exhibitions || project.credits || project.availability) && (
        <section className={`${p}-project-section`}>
          <h2 className={`${p}-section-title`}>Additional Information</h2>
          <div className={`${p}-info-list`}>
            {project.exhibitions && (
              <div className={`${p}-info-item`}>
                <h3>Exhibition History</h3>
                <p>{project.exhibitions}</p>
              </div>
            )}
            {project.credits && (
              <div className={`${p}-info-item`}>
                <h3>Credits</h3>
                <p>{project.credits}</p>
              </div>
            )}
            {project.availability && (
              <div className={`${p}-info-item`}>
                <h3>Availability</h3>
                <p>{project.availability}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Care Instructions */}
      {project.careInstructions && (
        <section className={`${p}-project-section`}>
          <h2 className={`${p}-section-title`}>Care Instructions</h2>
          <p className={`${p}-care-instructions`}>{project.careInstructions}</p>
        </section>
      )}
    </div>
  )
}
