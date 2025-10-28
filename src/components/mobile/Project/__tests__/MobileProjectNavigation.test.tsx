// ABOUTME: Test suite for MobileProjectNavigation - Navigation component for moving between projects and back to gallery

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileProjectNavigation } from '../MobileProjectNavigation'
import { UmamiEvents } from '@/utils/analytics'
import { scrollManager } from '@/lib/scrollManager'

// Mock dependencies
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/utils/analytics')

const mockTrackEvent = UmamiEvents.trackEvent as jest.MockedFunction<
  typeof UmamiEvents.trackEvent
>

jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    triggerNavigationStart: jest.fn(),
  },
}))

const mockTriggerNavigationStart =
  scrollManager.triggerNavigationStart as jest.MockedFunction<
    typeof scrollManager.triggerNavigationStart
  >

interface MockButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: string
  className?: string
}

jest.mock('@/components/mobile/UI/MobileButton', () => ({
  MobileButton: ({
    children,
    onClick,
    variant,
    className,
  }: MockButtonProps) => (
    <button onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}))

describe('MobileProjectNavigation', () => {
  const mockNextProject = {
    slug: 'next-project-slug',
    title: 'Next Project Title',
  }

  const mockPreviousProject = {
    slug: 'previous-project-slug',
    title: 'Previous Project Title',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_navigation_container', () => {
      const { container } = render(<MobileProjectNavigation />)

      const nav = container.querySelector('.mobile-project-navigation')
      expect(nav).toBeInTheDocument()
    })

    it('should_render_previous_button_when_previousProject_provided', () => {
      render(<MobileProjectNavigation previousProject={mockPreviousProject} />)

      const prevButton = screen.getByText('< Prev')
      expect(prevButton).toBeInTheDocument()
    })

    it('should_render_next_button_when_nextProject_provided', () => {
      render(<MobileProjectNavigation nextProject={mockNextProject} />)

      const nextButton = screen.getByText('Next >')
      expect(nextButton).toBeInTheDocument()
    })

    it('should_render_back_to_gallery_button_always', () => {
      render(<MobileProjectNavigation />)

      const galleryButton = screen.getByText('Gallery')
      expect(galleryButton).toBeInTheDocument()
    })

    it('should_render_spacer_when_no_previousProject', () => {
      const { container } = render(<MobileProjectNavigation />)

      // Should have a spacer div instead of previous button
      const spacers = container.querySelectorAll('.mobile-nav-spacer')
      expect(spacers.length).toBeGreaterThanOrEqual(1)
    })

    it('should_render_spacer_when_no_nextProject', () => {
      const { container } = render(<MobileProjectNavigation />)

      // Should have spacers when no next/previous projects
      const spacers = container.querySelectorAll('.mobile-nav-spacer')
      expect(spacers.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Navigation Actions', () => {
    it('should_navigate_to_previous_project_on_prev_click', () => {
      render(<MobileProjectNavigation previousProject={mockPreviousProject} />)

      const prevButton = screen.getByText('< Prev')
      fireEvent.click(prevButton)

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith(
        `/project/${mockPreviousProject.slug}`
      )
    })

    it('should_navigate_to_next_project_on_next_click', () => {
      render(<MobileProjectNavigation nextProject={mockNextProject} />)

      const nextButton = screen.getByText('Next >')
      fireEvent.click(nextButton)

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith(`/project/${mockNextProject.slug}`)
    })

    it('should_dispatch_navigate_back_to_gallery_event_on_gallery_click', () => {
      render(<MobileProjectNavigation />)

      // Mock window.dispatchEvent
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')

      const galleryButton = screen.getByText('Gallery')
      fireEvent.click(galleryButton)

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigate-back-to-gallery',
        })
      )

      dispatchEventSpy.mockRestore()
    })

    it('should_trigger_scroll_manager_on_previous_navigation', () => {
      render(<MobileProjectNavigation previousProject={mockPreviousProject} />)

      const prevButton = screen.getByText('< Prev')
      fireEvent.click(prevButton)

      expect(mockTriggerNavigationStart).toHaveBeenCalledTimes(1)
    })

    it('should_trigger_scroll_manager_on_next_navigation', () => {
      render(<MobileProjectNavigation nextProject={mockNextProject} />)

      const nextButton = screen.getByText('Next >')
      fireEvent.click(nextButton)

      expect(mockTriggerNavigationStart).toHaveBeenCalledTimes(1)
    })

    it('should_trigger_scroll_manager_on_gallery_navigation', () => {
      render(<MobileProjectNavigation />)

      const galleryButton = screen.getByText('Gallery')
      fireEvent.click(galleryButton)

      expect(mockTriggerNavigationStart).toHaveBeenCalledTimes(1)
    })
  })

  describe('Analytics Tracking', () => {
    it('should_track_previous_navigation_event', () => {
      render(<MobileProjectNavigation previousProject={mockPreviousProject} />)

      const prevButton = screen.getByText('< Prev')
      fireEvent.click(prevButton)

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith('mobile-project-navigation', {
        direction: 'previous',
        project: mockPreviousProject.slug,
      })
    })

    it('should_track_next_navigation_event', () => {
      render(<MobileProjectNavigation nextProject={mockNextProject} />)

      const nextButton = screen.getByText('Next >')
      fireEvent.click(nextButton)

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith('mobile-project-navigation', {
        direction: 'next',
        project: mockNextProject.slug,
      })
    })

    it('should_include_project_slug_in_analytics', () => {
      render(<MobileProjectNavigation nextProject={mockNextProject} />)

      const nextButton = screen.getByText('Next >')
      fireEvent.click(nextButton)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'mobile-project-navigation',
        expect.objectContaining({
          project: mockNextProject.slug,
        })
      )
    })

    it('should_include_direction_in_analytics', () => {
      render(<MobileProjectNavigation previousProject={mockPreviousProject} />)

      const prevButton = screen.getByText('< Prev')
      fireEvent.click(prevButton)

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'mobile-project-navigation',
        expect.objectContaining({
          direction: 'previous',
        })
      )
    })
  })

  describe('Button States', () => {
    it('should_display_correct_previous_button_text', () => {
      render(<MobileProjectNavigation previousProject={mockPreviousProject} />)

      expect(screen.getByText('< Prev')).toBeInTheDocument()
    })

    it('should_display_correct_next_button_text', () => {
      render(<MobileProjectNavigation nextProject={mockNextProject} />)

      expect(screen.getByText('Next >')).toBeInTheDocument()
    })

    it('should_apply_correct_variant_to_navigation_buttons', () => {
      render(
        <MobileProjectNavigation
          previousProject={mockPreviousProject}
          nextProject={mockNextProject}
        />
      )

      const prevButton = screen.getByText('< Prev')
      const nextButton = screen.getByText('Next >')
      const galleryButton = screen.getByText('Gallery')

      expect(prevButton).toHaveAttribute('data-variant', 'secondary')
      expect(nextButton).toHaveAttribute('data-variant', 'secondary')
      expect(galleryButton).toHaveAttribute('data-variant', 'ghost')
    })

    it('should_apply_correct_CSS_classes_to_buttons', () => {
      render(
        <MobileProjectNavigation
          previousProject={mockPreviousProject}
          nextProject={mockNextProject}
        />
      )

      const prevButton = screen.getByText('< Prev')
      const nextButton = screen.getByText('Next >')
      const galleryButton = screen.getByText('Gallery')

      expect(prevButton).toHaveClass('mobile-nav-previous')
      expect(nextButton).toHaveClass('mobile-nav-next')
      expect(galleryButton).toHaveClass('mobile-nav-back')
    })
  })
})
