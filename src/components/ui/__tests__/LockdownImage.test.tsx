// ABOUTME: Unit tests for LockdownImage component - CORS security (Issue #266)
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LockdownImage } from '../LockdownImage'
import type { ImageSource } from '@/types/textile'
import * as imageHelpers from '@/utils/image-helpers'

// Mock image helpers
jest.mock('@/utils/image-helpers', () => ({
  getSimpleImageUrl: jest.fn(
    (src: ImageSource | string) =>
      `https://cdn.sanity.io/images/test/simple.jpg`
  ),
}))

const mockImageSource: ImageSource = {
  asset: {
    _ref: 'image-test-123',
    _type: 'reference',
  },
  _type: 'image',
}

describe('LockdownImage Component - Issue #266', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ========================================
  // Core Rendering Tests
  // ========================================

  describe('Core Rendering', () => {
    it('renders with required props', () => {
      render(<LockdownImage src={mockImageSource} alt="Test image" />)
      expect(screen.getByAltText('Test image')).toBeInTheDocument()
    })

    it('renders null when src is null', () => {
      const { container } = render(<LockdownImage src={null} alt="Test image" />)
      expect(container.firstChild).toBeNull()
    })

    it('renders null when src is undefined', () => {
      const { container } = render(
        <LockdownImage src={undefined} alt="Test image" />
      )
      expect(container.firstChild).toBeNull()
    })

    it('uses native img element instead of Next.js Image', () => {
      render(<LockdownImage src={mockImageSource} alt="Test image" />)
      const img = screen.getByAltText('Test image')
      expect(img.tagName).toBe('IMG')
    })

    it('applies loading="lazy" for deferred loading', () => {
      render(<LockdownImage src={mockImageSource} alt="Test image" />)
      const img = screen.getByAltText('Test image')
      expect(img).toHaveAttribute('loading', 'lazy')
    })

    it('applies decoding="async" for non-blocking decode', () => {
      render(<LockdownImage src={mockImageSource} alt="Test image" />)
      const img = screen.getByAltText('Test image')
      expect(img).toHaveAttribute('decoding', 'async')
    })
  })

  // ========================================
  // CORS Security Tests - Issue #266
  // ========================================

  describe('CORS Security - crossOrigin attribute', () => {
    it('applies crossorigin="anonymous" to native img element for CDN compatibility', () => {
      render(<LockdownImage src={mockImageSource} alt="Test image" />)

      const img = screen.getByAltText('Test image')
      expect(img).toHaveAttribute('crossorigin', 'anonymous')
    })

    it('uses lowercase "crossorigin" attribute for HTML compliance', () => {
      render(<LockdownImage src={mockImageSource} alt="Test image" />)

      const img = screen.getByAltText('Test image') as HTMLImageElement
      // Check DOM attribute (lowercase for HTML)
      expect(img.getAttribute('crossorigin')).toBe('anonymous')
    })
  })

  // ========================================
  // Accessibility Tests
  // ========================================

  describe('Accessibility', () => {
    it('applies role="button" when onClick is provided', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <LockdownImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('role', 'button')
    })

    it('applies tabIndex={0} when onClick is provided', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <LockdownImage
          src={mockImageSource}
          alt="Clickable image"
          onClick={handleClick}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('tabIndex', '0')
    })

    it('does not apply interactive attributes when onClick is not provided', () => {
      const { container } = render(
        <LockdownImage src={mockImageSource} alt="Static image" />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).not.toHaveAttribute('role')
      expect(wrapper).not.toHaveAttribute('tabIndex')
    })
  })
})
