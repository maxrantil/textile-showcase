// src/components/mobile/Project/MobileProjectView.tsx
'use client'

import { MobileImageStack } from './MobileImageStack'
import { MobileProjectDetails } from './MobileProjectDetails'
import { MobileProjectNavigation } from './MobileProjectNavigation'
import { TextileDesign } from '@/sanity/types'
import { useEffect } from 'react'
import { UmamiEvents } from '@/utils/analytics'

interface MobileProjectViewProps {
  project: TextileDesign
  nextProject?: {
    slug: string
    title: string
  }
  previousProject?: {
    slug: string
    title: string
  }
}

export function MobileProjectView({
  project,
  nextProject,
  previousProject,
}: MobileProjectViewProps) {
  // Track project view
  useEffect(() => {
    UmamiEvents.viewProject(project.title, project.year)
  }, [project.title, project.year])

  return (
    <div className="mobile-project">
      <div className="mobile-project-content">
        <MobileProjectDetails project={project} />

        <MobileImageStack
          mainImage={project.image}
          images={project.gallery}
          projectTitle={project.title}
        />

        <MobileProjectNavigation
          nextProject={nextProject}
          previousProject={previousProject}
        />
      </div>
    </div>
  )
}
