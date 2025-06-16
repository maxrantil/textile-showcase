'use client'

import { TextileDesign } from '@/sanity/types'

interface MobileProjectDetailsProps {
  project: TextileDesign
}

export function MobileProjectDetails({ project }: MobileProjectDetailsProps) {
  return (
    <div className="mobile-project-details">
      <header className="mobile-project-header">
        <h1 className="mobile-project-title">{project.title}</h1>
        {project.year && <p className="mobile-project-year">{project.year}</p>}
      </header>

      {project.description && (
        <section className="mobile-project-section">
          <p className="mobile-project-description">{project.description}</p>
        </section>
      )}

      {/* Technical Details */}
      {(project.materials || project.technique || project.dimensions) && (
        <section className="mobile-project-section">
          <h2 className="mobile-section-title">Details</h2>
          <div className="mobile-detail-grid">
            {project.materials && (
              <div className="mobile-detail-item">
                <h3>Materials</h3>
                <p>{project.materials}</p>
              </div>
            )}
            {project.technique && (
              <div className="mobile-detail-item">
                <h3>Technique</h3>
                <p>{project.technique}</p>
              </div>
            )}
            {project.dimensions && (
              <div className="mobile-detail-item">
                <h3>Dimensions</h3>
                <p>{project.dimensions}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Extended Description */}
      {project.detailedDescription && (
        <section className="mobile-project-section">
          <h2 className="mobile-section-title">About This Piece</h2>
          <p className="mobile-project-description">
            {project.detailedDescription}
          </p>
        </section>
      )}

      {/* Additional Information */}
      {(project.exhibitions || project.credits || project.availability) && (
        <section className="mobile-project-section">
          <h2 className="mobile-section-title">Additional Information</h2>
          <div className="mobile-info-list">
            {project.exhibitions && (
              <div className="mobile-info-item">
                <h3>Exhibition History</h3>
                <p>{project.exhibitions}</p>
              </div>
            )}
            {project.credits && (
              <div className="mobile-info-item">
                <h3>Credits</h3>
                <p>{project.credits}</p>
              </div>
            )}
            {project.availability && (
              <div className="mobile-info-item">
                <h3>Availability</h3>
                <p>{project.availability}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Care Instructions */}
      {project.careInstructions && (
        <section className="mobile-project-section">
          <h2 className="mobile-section-title">Care Instructions</h2>
          <p className="mobile-care-instructions">{project.careInstructions}</p>
        </section>
      )}
    </div>
  )
}
