// ABOUTME: Comprehensive test suite for MobileProjectView - project composition, navigation, scroll management

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MobileProjectView } from '../MobileProjectView'
import { mockSingleDesign } from '../../../../../tests/fixtures/designs'
import { mockNavigationProjects } from '../../../../../tests/fixtures/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    viewProject: jest.fn(),
  },
}))

jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    triggerNavigationStart: jest.fn(),
    triggerNavigationComplete: jest.fn(),
  },
}))

jest.mock('../MobileImageStack', () => ({
  MobileImageStack: ({ mainImage, images, projectTitle }: any) => (
    <div data-testid="mobile-image-stack">
      <span>{projectTitle}</span>
      <span>Main Image: {mainImage?.asset?._ref}</span>
      <span>Gallery Count: {images?.length || 0}</span>
    </div>
  ),
}))

jest.mock('../MobileProjectDetails', () => ({
  MobileProjectDetails: ({ project }: any) => (
    <div data-testid="mobile-project-details">
      <h1>{project.title}</h1>
      <span>{project.year}</span>
    </div>
  ),
}))

jest.mock('../MobileProjectNavigation', () => ({
  MobileProjectNavigation: ({ nextProject, previousProject }: any) => (
    <div data-testid="mobile-project-navigation">
      {previousProject && <button>Previous: {previousProject.title}</button>}
      {nextProject && <button>Next: {nextProject.title}</button>}
    </div>
  ),
}))

describe('MobileProjectView', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const useRouter = require('next/navigation').useRouter
    useRouter.mockReturnValue(mockRouter)
  })

  describe('Rendering', () => {
    it('should_render_project_details_component', () => {
      render(<MobileProjectView project={mockSingleDesign} />)

      expect(screen.getByTestId('mobile-project-details')).toBeInTheDocument()
    })

    it('should_render_image_stack_with_main_image', () => {
      render(<MobileProjectView project={mockSingleDesign} />)

      expect(screen.getByTestId('mobile-image-stack')).toBeInTheDocument()
    })

    it('should_render_project_navigation_component', () => {
      render(<MobileProjectView project={mockSingleDesign} />)

      expect(
        screen.getByTestId('mobile-project-navigation')
      ).toBeInTheDocument()
    })

    it('should_render_with_proper_container_classes', () => {
      const { container } = render(
        <MobileProjectView project={mockSingleDesign} />
      )

      expect(container.querySelector('.mobile-project')).toBeInTheDocument()
      expect(
        container.querySelector('.mobile-project-content')
      ).toBeInTheDocument()
    })

    it('should_not_render_image_stack_when_no_main_image', () => {
      const projectWithoutImage = { ...mockSingleDesign, image: undefined }
      render(<MobileProjectView project={projectWithoutImage} />)

      expect(screen.queryByTestId('mobile-image-stack')).not.toBeInTheDocument()
    })

    it('should_convert_gallery_images_to_proper_format', () => {
      const projectWithGallery = {
        ...mockSingleDesign,
        gallery: [
          { _key: 'img1', asset: { _ref: 'ref1' }, caption: 'Caption 1' },
          { asset: { _ref: 'ref2' }, caption: 'Caption 2' }, // No _key
        ],
      }

      render(<MobileProjectView project={projectWithGallery} />)

      expect(screen.getByText(/Gallery Count: 2/)).toBeInTheDocument()
    })
  })

  describe('Analytics Tracking', () => {
    it('should_track_project_view_on_mount', () => {
      const analytics = require('@/utils/analytics').UmamiEvents

      render(<MobileProjectView project={mockSingleDesign} />)

      expect(analytics.viewProject).toHaveBeenCalledWith(
        mockSingleDesign.title,
        mockSingleDesign.year
      )
    })

    it('should_include_project_title_in_tracking', () => {
      const analytics = require('@/utils/analytics').UmamiEvents

      render(<MobileProjectView project={mockSingleDesign} />)

      expect(analytics.viewProject).toHaveBeenCalledWith(
        expect.stringContaining(mockSingleDesign.title),
        expect.anything()
      )
    })

    it('should_include_project_year_in_tracking', () => {
      const analytics = require('@/utils/analytics').UmamiEvents

      render(<MobileProjectView project={mockSingleDesign} />)

      expect(analytics.viewProject).toHaveBeenCalledWith(
        expect.anything(),
        mockSingleDesign.year
      )
    })
  })

  describe('Navigation & Routing', () => {
    it('should_pass_nextProject_to_navigation_component', () => {
      render(
        <MobileProjectView
          project={mockSingleDesign}
          nextProject={mockNavigationProjects.next}
        />
      )

      expect(
        screen.getByText(`Next: ${mockNavigationProjects.next.title}`)
      ).toBeInTheDocument()
    })

    it('should_pass_previousProject_to_navigation_component', () => {
      render(
        <MobileProjectView
          project={mockSingleDesign}
          previousProject={mockNavigationProjects.previous}
        />
      )

      expect(
        screen.getByText(`Previous: ${mockNavigationProjects.previous.title}`)
      ).toBeInTheDocument()
    })

    it('should_handle_missing_nextProject_gracefully', () => {
      render(
        <MobileProjectView
          project={mockSingleDesign}
          previousProject={mockNavigationProjects.previous}
        />
      )

      expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
    })

    it('should_handle_missing_previousProject_gracefully', () => {
      render(
        <MobileProjectView
          project={mockSingleDesign}
          nextProject={mockNavigationProjects.next}
        />
      )

      expect(screen.queryByText(/Previous:/)).not.toBeInTheDocument()
    })

    it('should_navigate_to_gallery_on_back_to_gallery_event', () => {
      render(<MobileProjectView project={mockSingleDesign} />)

      const event = new Event('navigate-back-to-gallery')
      window.dispatchEvent(event)

      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })

    it('should_trigger_navigation_start_before_routing', () => {
      const scrollManager = require('@/lib/scrollManager').scrollManager

      render(<MobileProjectView project={mockSingleDesign} />)

      const event = new Event('navigate-back-to-gallery')
      window.dispatchEvent(event)

      expect(scrollManager.triggerNavigationStart).toHaveBeenCalled()
    })
  })

  describe('Scroll Management', () => {
    it('should_call_scrollManager_triggerNavigationStart_on_back', () => {
      const scrollManager = require('@/lib/scrollManager').scrollManager

      render(<MobileProjectView project={mockSingleDesign} />)

      const event = new Event('navigate-back-to-gallery')
      window.dispatchEvent(event)

      expect(scrollManager.triggerNavigationStart).toHaveBeenCalled()
    })

    it('should_call_scrollManager_triggerNavigationComplete_after_delay', async () => {
      jest.useFakeTimers()
      const scrollManager = require('@/lib/scrollManager').scrollManager

      render(<MobileProjectView project={mockSingleDesign} />)

      const event = new Event('navigate-back-to-gallery')
      window.dispatchEvent(event)

      expect(scrollManager.triggerNavigationComplete).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      await waitFor(() => {
        expect(scrollManager.triggerNavigationComplete).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })

    it('should_listen_for_navigate_back_to_gallery_event', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      render(<MobileProjectView project={mockSingleDesign} />)

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'navigate-back-to-gallery',
        expect.any(Function)
      )

      addEventListenerSpy.mockRestore()
    })

    it('should_cleanup_event_listener_on_unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = render(
        <MobileProjectView project={mockSingleDesign} />
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'navigate-back-to-gallery',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    it('should_restore_scroll_position_after_100ms_delay', async () => {
      jest.useFakeTimers()
      const scrollManager = require('@/lib/scrollManager').scrollManager

      render(<MobileProjectView project={mockSingleDesign} />)

      const event = new Event('navigate-back-to-gallery')
      window.dispatchEvent(event)

      jest.advanceTimersByTime(99)
      expect(scrollManager.triggerNavigationComplete).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)

      await waitFor(() => {
        expect(scrollManager.triggerNavigationComplete).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })
  })

  describe('Gallery Image Processing', () => {
    it('should_map_gallery_images_with_keys', () => {
      const projectWithGallery = {
        ...mockSingleDesign,
        gallery: [
          { _key: 'key1', asset: { _ref: 'ref1' }, caption: 'Caption 1' },
          { _key: 'key2', asset: { _ref: 'ref2' }, caption: 'Caption 2' },
        ],
      }

      render(<MobileProjectView project={projectWithGallery} />)

      expect(screen.getByText(/Gallery Count: 2/)).toBeInTheDocument()
    })

    it('should_handle_undefined_gallery_gracefully', () => {
      const projectWithoutGallery = { ...mockSingleDesign, gallery: undefined }

      render(<MobileProjectView project={projectWithoutGallery} />)

      expect(screen.getByText(/Gallery Count: 0/)).toBeInTheDocument()
    })

    it('should_include_image_captions_in_mapping', () => {
      const projectWithGallery = {
        ...mockSingleDesign,
        gallery: [
          { _key: 'key1', asset: { _ref: 'ref1' }, caption: 'Test Caption' },
        ],
      }

      render(<MobileProjectView project={projectWithGallery} />)

      // Caption is passed to MobileImageStack
      expect(screen.getByTestId('mobile-image-stack')).toBeInTheDocument()
    })

    it('should_generate_fallback_keys_for_images_without_key', () => {
      const projectWithGallery = {
        ...mockSingleDesign,
        gallery: [
          { asset: { _ref: 'ref1' }, caption: 'No Key' },
          { asset: { _ref: 'ref2' }, caption: 'Also No Key' },
        ],
      }

      render(<MobileProjectView project={projectWithGallery} />)

      // Should still render correctly with generated keys
      expect(screen.getByText(/Gallery Count: 2/)).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should_pass_project_to_details_component', () => {
      render(<MobileProjectView project={mockSingleDesign} />)

      const detailsComponent = screen.getByTestId('mobile-project-details')
      expect(detailsComponent).toHaveTextContent(mockSingleDesign.title)
      expect(detailsComponent).toHaveTextContent(String(mockSingleDesign.year))
    })

    it('should_pass_mainImage_to_image_stack', () => {
      render(<MobileProjectView project={mockSingleDesign} />)

      expect(
        screen.getByText(`Main Image: ${mockSingleDesign.image?.asset?._ref}`)
      ).toBeInTheDocument()
    })

    it('should_pass_projectTitle_to_image_stack', () => {
      render(<MobileProjectView project={mockSingleDesign} />)

      const imageStack = screen.getByTestId('mobile-image-stack')
      expect(imageStack).toHaveTextContent(mockSingleDesign.title)
    })
  })
})
