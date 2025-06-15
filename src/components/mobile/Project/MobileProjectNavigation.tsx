// src/components/mobile/Project/MobileProjectNavigation.tsx
'use client'

import { useRouter } from 'next/navigation'
import { MobileButton } from '../UI/MobileButton'
import { UmamiEvents } from '@/utils/analytics'

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
    UmamiEvents.backToGallery()
    router.push('/')
  }

  const handleNavigateToProject = (
    slug: string,
    direction: 'next' | 'previous'
  ) => {
    UmamiEvents.trackEvent('mobile-project-navigation', { direction })
    router.push(`/project/${slug}`)
  }

  return (
    <nav className="mobile-project-navigation">
      {/* Back to Gallery Button */}
      <div className="mobile-nav-primary">
        <MobileButton
          onClick={handleBackToGallery}
          variant="secondary"
          fullWidth
        >
          ← Back to Gallery
        </MobileButton>
      </div>

      {/* Previous/Next Navigation */}
      {(previousProject || nextProject) && (
        <div className="mobile-nav-secondary">
          {previousProject && (
            <button
              className="mobile-nav-button mobile-nav-prev"
              onClick={() =>
                handleNavigateToProject(previousProject.slug, 'previous')
              }
              aria-label={`Previous project: ${previousProject.title}`}
            >
              <span className="mobile-nav-label">Previous</span>
              <span className="mobile-nav-title">{previousProject.title}</span>
            </button>
          )}

          {nextProject && (
            <button
              className="mobile-nav-button mobile-nav-next"
              onClick={() => handleNavigateToProject(nextProject.slug, 'next')}
              aria-label={`Next project: ${nextProject.title}`}
            >
              <span className="mobile-nav-label">Next</span>
              <span className="mobile-nav-title">{nextProject.title}</span>
            </button>
          )}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mobile-nav-cta">
        <p className="mobile-cta-text">Interested in this piece?</p>
        <MobileButton
          onClick={() => {
            UmamiEvents.navigateToContact()
            router.push('/contact')
          }}
          variant="primary"
          size="small"
        >
          Get in Touch
        </MobileButton>
      </div>
    </nav>
  )
}
