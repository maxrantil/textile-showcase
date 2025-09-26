// Update src/components/desktop/Project/DesktopProjectView.tsx

'use client'
import { useState } from 'react'
import { DesktopImageCarousel } from './DesktopImageCarousel'
import { DesktopProjectDetails } from './DesktopProjectDetails'
import { DesktopProjectNavigation } from './DesktopProjectNavigation'
import { TextileDesign } from '@/types/textile'

interface DesktopProjectViewProps {
  project: TextileDesign
  nextProject?: { slug: string; title: string }
  previousProject?: { slug: string; title: string }
}

export function DesktopProjectView({
  project,
  nextProject,
  previousProject,
}: DesktopProjectViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Convert gallery images to proper format and combine with main image
  const galleryImages =
    project.gallery?.map((img, index) => ({
      _key: img._key || `gallery-${index}`,
      asset: img.asset,
      caption: img.caption,
    })) || []

  return (
    <div className="desktop-project">
      <div className="desktop-project-content">
        {project.image && (
          <DesktopImageCarousel
            images={galleryImages}
            mainImage={project.image}
            projectTitle={project.title}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
          />
        )}
        <DesktopProjectDetails project={project} />

        {/* Add navigation */}
        <DesktopProjectNavigation
          nextProject={nextProject}
          previousProject={previousProject}
        />
      </div>
    </div>
  )
}
