'use client'

import { useState } from 'react'
import { DesktopImageCarousel } from './DesktopImageCarousel'
import { DesktopProjectDetails } from './DesktopProjectDetails'
import { TextileDesign } from '@/sanity/types'

interface DesktopProjectViewProps {
  project: TextileDesign
}

export function DesktopProjectView({ project }: DesktopProjectViewProps) {
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
        <DesktopImageCarousel
          images={galleryImages}
          mainImage={project.image}
          projectTitle={project.title}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
        />
        <DesktopProjectDetails project={project} />
      </div>
    </div>
  )
}
