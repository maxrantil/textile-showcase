'use client'
import { MobileImageStack } from './MobileImageStack'
import { MobileProjectDetails } from './MobileProjectDetails'
import { MobileProjectNavigation } from './MobileProjectNavigation'
import { TextileDesign } from '@/types/textile'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UmamiEvents } from '@/utils/analytics'
import { scrollManager } from '@/lib/scrollManager'

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
  const router = useRouter()

  // Track project view
  useEffect(() => {
    UmamiEvents.viewProject(project.title, project.year)
  }, [project.title, project.year])

  // Handle navigation back to gallery with scroll restoration
  useEffect(() => {
    const handleBackToGallery = () => {
      // Trigger navigation start to prevent scroll saving during transition
      scrollManager.triggerNavigationStart()

      // Navigate back to gallery
      router.push('/')

      // Restore scroll position after navigation
      setTimeout(() => {
        scrollManager.triggerNavigationComplete()
      }, 100)
    }

    // Listen for custom back-to-gallery event
    window.addEventListener('navigate-back-to-gallery', handleBackToGallery)

    return () => {
      window.removeEventListener(
        'navigate-back-to-gallery',
        handleBackToGallery
      )
    }
  }, [router])

  // Convert gallery images to proper format
  const galleryImages =
    project.gallery?.map((img, index) => ({
      _key: img._key || `gallery-${index}`,
      asset: img.asset,
      caption: img.caption,
    })) || []

  return (
    <div className="mobile-project">
      <div className="mobile-project-content">
        <MobileProjectDetails project={project} />
        {project.image && (
          <MobileImageStack
            mainImage={project.image}
            images={galleryImages}
            projectTitle={project.title}
          />
        )}
        <MobileProjectNavigation
          nextProject={nextProject}
          previousProject={previousProject}
        />
      </div>
    </div>
  )
}
