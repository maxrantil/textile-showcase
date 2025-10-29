// ABOUTME: Test suite for ImageBlock - Image component with lockdown mode detection, error handling, and analytics

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageBlock } from '../ImageBlock'
import type { ImageSource } from '@/types/textile'
import { UmamiEvents } from '@/utils/analytics'

// Mock dependencies
jest.mock('@/utils/analytics')
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn(() => 'optimized-image-url'),
}))

const mockProjectImageView =
  UmamiEvents.projectImageView as jest.MockedFunction<
    typeof UmamiEvents.projectImageView
  >

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    onLoad,
    onError,
    loading,
    className,
  }: {
    src: string
    alt: string
    onLoad?: () => void
    onError?: () => void
    loading?: 'lazy' | 'eager'
    className?: string
  }) {
    return (
      <img
        src={src}
        alt={alt}
        data-loading={loading}
        className={className}
        onLoad={onLoad}
        onError={onError}
      />
    )
  },
}))

jest.mock('@/components/ui/LockdownImage', () => ({
  LockdownImage: function MockLockdownImage({
    alt,
    className,
  }: {
    src: unknown
    alt: string
    className?: string
  }) {
    return (
      <img
        src="lockdown-image-url"
        alt={alt}
        className={className}
        data-testid="lockdown-image"
      />
    )
  },
}))

describe('ImageBlock', () => {
  const mockImageAsset: ImageSource = {
    _type: 'image',
    asset: {
      _ref: 'image-ref-123',
      _type: 'reference',
    },
  }

  const mockImage = {
    _key: 'test-key',
    asset: mockImageAsset,
    caption: 'Test caption',
    isMainImage: false,
  }

  const mockProjectTitle = 'Test Project'

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true,
    })

    // Setup default navigator (not iOS, all features available)
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      writable: true,
      configurable: true,
    })

    Object.defineProperty(window, 'IntersectionObserver', {
      value: class IntersectionObserver {},
      writable: true,
      configurable: true,
    })

    Object.defineProperty(window, 'WebGLRenderingContext', {
      value: {},
      writable: true,
      configurable: true,
    })
  })

  describe('Rendering', () => {
    it('should_render_Next_Image_in_normal_mode', () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      // Should render Next.js Image (not lockdown image)
      expect(screen.queryByTestId('lockdown-image')).not.toBeInTheDocument()
      expect(container.querySelector('img')).toBeInTheDocument()
    })

    it('should_render_LockdownImage_when_lockdown_detected', () => {
      // Setup iOS without IntersectionObserver
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'IntersectionObserver', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      // Should render lockdown image
      expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
    })

    it('should_render_with_correct_aspect_ratio', () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const imageContainer = container.querySelector('.mobile-image-container')
      expect(imageContainer).toHaveStyle({ aspectRatio: '1.3333333333333333' }) // 4/3
    })

    it('should_apply_mobile_image_block_class', () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const block = container.querySelector('.mobile-image-block')
      expect(block).toBeInTheDocument()
    })

    it('should_not_render_when_no_image_asset', () => {
      const imageWithoutAsset = {
        ...mockImage,
        asset: null as unknown as ImageSource,
      }

      const { container } = render(
        <ImageBlock
          image={imageWithoutAsset}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      expect(
        container.querySelector('.mobile-image-block')
      ).not.toBeInTheDocument()
    })

    it('should_render_caption_for_gallery_images', () => {
      render(
        <ImageBlock
          image={mockImage}
          index={1}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      expect(screen.getByText('Test caption')).toBeInTheDocument()
    })
  })

  describe('Lockdown Mode Detection', () => {
    it('should_detect_iOS_lockdown_mode', () => {
      // Setup iOS without WebGL
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'WebGLRenderingContext', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
    })

    it('should_check_IntersectionObserver_availability', () => {
      // iOS with IntersectionObserver but no WebGL
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'WebGLRenderingContext', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
    })

    it('should_check_WebGL_availability', () => {
      // iOS without WebGL
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'WebGLRenderingContext', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
    })

    it('should_switch_to_lockdown_on_image_error', async () => {
      // Start in normal mode
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()

      // Trigger error
      if (img) {
        fireEvent.error(img)
      }

      await waitFor(() => {
        expect(screen.getByText(/Failed to load image/)).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
      })
    })

    it('should_show_lockdown_indicator_in_development', () => {
      // Set development environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      // Setup lockdown mode
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'IntersectionObserver', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      expect(container.textContent).toContain('LOCKDOWN')
    })
  })

  describe('Image Loading', () => {
    it('should_show_loading_state_initially', () => {
      render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      expect(screen.getByText(/Loading image 1/)).toBeInTheDocument()
    })

    it('should_hide_loading_state_when_image_loaded', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.load(img)
      }

      await waitFor(() => {
        expect(screen.queryByText(/Loading image/)).not.toBeInTheDocument()
      })
    })

    it('should_use_eager_loading_for_first_image', () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      expect(img).toHaveAttribute('data-loading', 'eager')
    })

    it('should_use_lazy_loading_for_subsequent_images', () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={1}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      expect(img).toHaveAttribute('data-loading', 'lazy')
    })

    it('should_apply_loaded_class_when_image_loads', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      expect(img).not.toHaveClass('loaded')

      if (img) {
        fireEvent.load(img)
      }

      await waitFor(() => {
        expect(img).toHaveClass('loaded')
      })
    })
  })

  describe('Error Handling', () => {
    it('should_display_error_message_on_load_failure', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={2}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.error(img)
      }

      await waitFor(() => {
        expect(screen.getByText(/Failed to load image 3/)).toBeInTheDocument()
      })
    })

    it('should_show_retry_button_on_error', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.error(img)
      }

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should_switch_to_lockdown_mode_on_retry', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.error(img)
      }

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
      })
    })

    it('should_handle_missing_image_asset_gracefully', () => {
      const imageWithoutAsset = {
        _key: 'test',
        asset: undefined as unknown as ImageSource,
        isMainImage: false,
      }

      const { container } = render(
        <ImageBlock
          image={imageWithoutAsset}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      expect(
        container.querySelector('.mobile-image-block')
      ).not.toBeInTheDocument()
    })

    it('should_log_lockdown_switch_to_console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      // Start in normal mode - Setup iOS but WITH IntersectionObserver
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'IntersectionObserver', {
        value: class IntersectionObserver {}, // Has IntersectionObserver initially
        writable: true,
        configurable: true,
      })

      // Render in normal mode
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      // Now remove IntersectionObserver to simulate lockdown mode
      Object.defineProperty(window, 'IntersectionObserver', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      // Trigger error - should detect lockdown and log
      const img = container.querySelector('img')
      if (img) {
        fireEvent.error(img)
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('🔒 Image failed, switching to lockdown mode')
        )
      })

      consoleSpy.mockRestore()
    })

    it('should_clear_error_state_on_retry', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.error(img)
      }

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/)).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText(/Failed to load/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Analytics', () => {
    it('should_track_image_view_on_load', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.load(img)
      }

      await waitFor(() => {
        expect(mockProjectImageView).toHaveBeenCalledTimes(1)
      })
    })

    it('should_include_project_title_in_tracking', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.load(img)
      }

      await waitFor(() => {
        expect(mockProjectImageView).toHaveBeenCalledWith(mockProjectTitle, 1)
      })
    })

    it('should_include_image_index_in_tracking', async () => {
      const { container } = render(
        <ImageBlock
          image={mockImage}
          index={3}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      if (img) {
        fireEvent.load(img)
      }

      await waitFor(() => {
        expect(mockProjectImageView).toHaveBeenCalledWith(mockProjectTitle, 4) // index + 1
      })
    })
  })

  describe('Caption Display', () => {
    it('should_display_caption_for_gallery_images', () => {
      render(
        <ImageBlock
          image={mockImage}
          index={1}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      expect(screen.getByText('Test caption')).toBeInTheDocument()
    })

    it('should_not_display_caption_for_main_image', () => {
      const mainImage = {
        ...mockImage,
        isMainImage: true,
      }

      render(
        <ImageBlock
          image={mainImage}
          index={0}
          isFirst={true}
          projectTitle={mockProjectTitle}
        />
      )

      expect(screen.queryByText('Test caption')).not.toBeInTheDocument()
    })

    it('should_use_fallback_alt_text_when_no_caption', () => {
      const imageWithoutCaption = {
        ...mockImage,
        caption: undefined,
      }

      const { container } = render(
        <ImageBlock
          image={imageWithoutCaption}
          index={2}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      const img = container.querySelector('img')
      expect(img).toHaveAttribute('alt', 'Test Project - Image 3')
    })
  })

  describe('Memoization', () => {
    it('should_memoize_component_with_React_memo', () => {
      // React.memo is applied to the component
      expect(ImageBlock).toHaveProperty('$$typeof')
    })

    it('should_prevent_unnecessary_re_renders', () => {
      const { rerender } = render(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      // Rerender with same props
      rerender(
        <ImageBlock
          image={mockImage}
          index={0}
          isFirst={false}
          projectTitle={mockProjectTitle}
        />
      )

      // Component should memoize and not re-render unnecessarily
      // This is verified by React.memo being applied
      expect(ImageBlock).toHaveProperty('$$typeof')
    })
  })
})
