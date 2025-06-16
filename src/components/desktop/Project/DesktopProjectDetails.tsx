'use client'

import { TextileDesign } from '@/sanity/types'

interface DesktopProjectDetailsProps {
  project: TextileDesign
}

export function DesktopProjectDetails({ project }: DesktopProjectDetailsProps) {
  return (
    <div className="desktop-project-details">
      <header className="desktop-project-header">
        <h1 className="desktop-project-title">{project.title}</h1>
        {project.year && <p className="desktop-project-year">{project.year}</p>}
      </header>

      {project.description && (
        <section className="desktop-project-section">
          <p className="desktop-project-description">{project.description}</p>
        </section>
      )}

      {/* Technical Details */}
      {(project.materials || project.technique || project.dimensions) && (
        <section className="desktop-project-section">
          <h2 className="desktop-section-title">Details</h2>
          <div className="desktop-project-info">
            {project.materials && (
              <div className="desktop-info-item">
                <h3>Materials</h3>
                <p>{project.materials}</p>
              </div>
            )}

            {project.technique && (
              <div className="desktop-info-item">
                <h3>Technique</h3>
                <p>{project.technique}</p>
              </div>
            )}

            {project.dimensions && (
              <div className="desktop-info-item">
                <h3>Dimensions</h3>
                <p>{project.dimensions}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Extended Description */}
      {project.detailedDescription && (
        <section className="desktop-project-section">
          <h2 className="desktop-section-title">About This Piece</h2>
          <p className="desktop-project-description">
            {project.detailedDescription}
          </p>
        </section>
      )}

      {/* Additional Information */}
      {(project.exhibitions || project.credits || project.availability) && (
        <section className="desktop-project-section">
          <h2 className="desktop-section-title">Additional Information</h2>
          <div className="desktop-info-list">
            {project.exhibitions && (
              <div className="desktop-info-item">
                <h3>Exhibition History</h3>
                <p>{project.exhibitions}</p>
              </div>
            )}
            {project.credits && (
              <div className="desktop-info-item">
                <h3>Credits</h3>
                <p>{project.credits}</p>
              </div>
            )}
            {project.availability && (
              <div className="desktop-info-item">
                <h3>Availability</h3>
                <p>{project.availability}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Care Instructions */}
      {project.careInstructions && (
        <section className="desktop-project-section">
          <h2 className="desktop-section-title">Care Instructions</h2>
          <p className="desktop-care-instructions">
            {project.careInstructions}
          </p>
        </section>
      )}
    </div>
  )
}
