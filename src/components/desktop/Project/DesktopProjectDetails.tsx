// src/components/desktop/Project/DesktopProjectDetails.tsx
'use client'

import { TextileDesign } from '@/sanity/types'

interface DesktopProjectDetailsProps {
  project: TextileDesign
}

export function DesktopProjectDetails({ project }: DesktopProjectDetailsProps) {
  return (
    <div className="desktop-project-details">
      <h1>{project.title}</h1>
      {project.year && <p className="desktop-project-year">{project.year}</p>}

      {project.description && (
        <p className="desktop-project-description">{project.description}</p>
      )}

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
    </div>
  )
}
