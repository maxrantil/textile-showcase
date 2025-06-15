// src/components/desktop/Project/DesktopProjectView.tsx - Updated
'use client'

import { useState } from 'react'
import { DesktopImageCarousel } from './DesktopImageCarousel'
import { DesktopProjectDetails } from './DesktopProjectDetails'
import { NavigationArrows } from '@/components/ui/NavigationArrows'
import { TextileDesign } from '@/sanity/types'

interface DesktopProjectViewProps {
  project: TextileDesign
}

export function DesktopProjectView({ project }: DesktopProjectViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Combine main image with gallery images
  const allImages = [
    project.image,
    ...(project.gallery?.map((img) => img.asset) || []),
  ]

  return (
    <div className="desktop-project">
      <NavigationArrows
        canScrollLeft={currentIndex > 0}
        canScrollRight={currentIndex < allImages.length - 1}
        onScrollLeft={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
        onScrollRight={() =>
          setCurrentIndex((prev) => Math.min(allImages.length - 1, prev + 1))
        }
        showOnMobile={false}
      />

      <div className="desktop-project-content">
        <DesktopImageCarousel
          images={allImages}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          projectTitle={project.title}
        />

        <DesktopProjectDetails project={project} />
      </div>
    </div>
  )
}
