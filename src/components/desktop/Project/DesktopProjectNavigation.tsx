// src/components/desktop/Project/DesktopProjectNavigation.tsx
'use client'

import { useRouter } from 'next/navigation'
import { UmamiEvents } from '@/utils/analytics'
import { scrollManager } from '@/lib/scrollManager'
import { DesktopButton } from '@/components/desktop/UI/DesktopButton'

interface DesktopProjectNavigationProps {
  nextProject?: {
    slug: string
    title: string
  }
  previousProject?: {
    slug: string
    title: string
  }
}

export function DesktopProjectNavigation({
  nextProject,
  previousProject,
}: DesktopProjectNavigationProps) {
  const router = useRouter()

  const handleBackToGallery = () => {
    UmamiEvents.backToGallery()
    scrollManager.triggerNavigationStart()
    router.push('/')
  }

  const handleNextProject = () => {
    if (!nextProject) return

    UmamiEvents.trackEvent('desktop-project-navigation', {
      direction: 'next',
      project: nextProject.slug,
    })
    scrollManager.triggerNavigationStart()
    router.push(`/project/${nextProject.slug}`)
  }

  const handlePreviousProject = () => {
    if (!previousProject) return

    UmamiEvents.trackEvent('desktop-project-navigation', {
      direction: 'previous',
      project: previousProject.slug,
    })
    scrollManager.triggerNavigationStart()
    router.push(`/project/${previousProject.slug}`)
  }

  return (
    <nav className="desktop-project-navigation">
      <div className="desktop-nav-buttons">
        {/* Previous Project Button */}
        {previousProject ? (
          <DesktopButton
            onClick={handlePreviousProject}
            variant="secondary"
            size="small"
            className="desktop-nav-previous"
          >
            ← Previous
          </DesktopButton>
        ) : (
          <div className="desktop-nav-spacer" />
        )}

        {/* Back to Gallery Button - Center */}
        <DesktopButton
          onClick={handleBackToGallery}
          variant="ghost"
          size="small"
          className="desktop-nav-back"
        >
          Back to Gallery
        </DesktopButton>

        {/* Next Project Button */}
        {nextProject ? (
          <DesktopButton
            onClick={handleNextProject}
            variant="secondary"
            size="small"
            className="desktop-nav-next"
          >
            Next →
          </DesktopButton>
        ) : (
          <div className="desktop-nav-spacer" />
        )}
      </div>

      {/* Optional: Project titles below buttons */}
      <div className="desktop-nav-titles">
        <div className="desktop-nav-title-previous">
          {previousProject && (
            <span className="desktop-nav-project-title">
              {previousProject.title}
            </span>
          )}
        </div>
        <div className="desktop-nav-title-spacer" />
        <div className="desktop-nav-title-next">
          {nextProject && (
            <span className="desktop-nav-project-title">
              {nextProject.title}
            </span>
          )}
        </div>
      </div>
    </nav>
  )
}
