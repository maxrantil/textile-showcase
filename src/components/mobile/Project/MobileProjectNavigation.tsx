// src/components/mobile/Project/MobileProjectNavigation.tsx
'use client'

import { useRouter } from 'next/navigation'
import { UmamiEvents } from '@/utils/analytics'
import { scrollManager } from '@/lib/scrollManager'
import { MobileButton } from '@/components/mobile/UI/MobileButton'

interface MobileProjectNavigationProps {
  nextProject?: {
    slug: string
    title: string
  }
  previousProject?: {
    slug: string
    title: string
  }
}

export function MobileProjectNavigation({
  nextProject,
  previousProject,
}: MobileProjectNavigationProps) {
  const router = useRouter()

  const handleBackToGallery = () => {
    scrollManager.triggerNavigationStart()
    // router.push('/')
    window.dispatchEvent(new Event('navigate-back-to-gallery'))
  }

  const handleNextProject = () => {
    if (!nextProject) return

    UmamiEvents.trackEvent('mobile-project-navigation', {
      direction: 'next',
      project: nextProject.slug,
    })
    scrollManager.triggerNavigationStart()
    router.push(`/project/${nextProject.slug}`)
  }

  const handlePreviousProject = () => {
    if (!previousProject) return

    UmamiEvents.trackEvent('mobile-project-navigation', {
      direction: 'previous',
      project: previousProject.slug,
    })
    scrollManager.triggerNavigationStart()
    router.push(`/project/${previousProject.slug}`)
  }

  return (
    <nav className="mobile-project-navigation">
      <div className="mobile-nav-buttons">
        {/* Previous Project Button */}
        {previousProject ? (
          <MobileButton
            onClick={handlePreviousProject}
            variant="secondary"
            className="mobile-nav-previous"
          >
            &lt; Previous
          </MobileButton>
        ) : (
          <div className="mobile-nav-spacer" />
        )}

        {/* Back to Gallery Button */}
        <MobileButton
          onClick={handleBackToGallery}
          variant="ghost"
          className="mobile-nav-back"
        >
          Gallery
        </MobileButton>

        {/* Next Project Button */}
        {nextProject ? (
          <MobileButton
            onClick={handleNextProject}
            variant="secondary"
            className="mobile-nav-next"
          >
            Next &gt;
          </MobileButton>
        ) : (
          <div className="mobile-nav-spacer" />
        )}
      </div>
    </nav>
  )
}
