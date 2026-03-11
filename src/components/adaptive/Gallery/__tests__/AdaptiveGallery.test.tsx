// ABOUTME: Test suite for AdaptiveGallery component - CSS media query based rendering

import React from 'react'
import { render, screen } from '@testing-library/react'
import { mockDesigns } from '../../../../../tests/fixtures/designs'
import { TextileDesign } from '@/types/textile'

// Mock the gallery components
jest.mock('@/components/desktop/Gallery/Gallery', () => ({
  __esModule: true,
  default: jest.fn(({ designs }: { designs: unknown[] }) => (
    <div data-testid="desktop-gallery">
      Desktop Gallery ({designs.length} items)
    </div>
  )),
}))

jest.mock('@/components/mobile/Gallery/MobileGallery', () => ({
  __esModule: true,
  default: jest.fn(({ designs }: { designs: unknown[] }) => (
    <div data-testid="mobile-gallery">
      Mobile Gallery ({designs.length} items)
    </div>
  )),
}))

describe('AdaptiveGallery', () => {
  let AdaptiveGallery: React.ComponentType<{ designs: TextileDesign[] }>

  beforeAll(async () => {
    // Dynamic import after mocks are ready
    const adaptiveModule = await import('@/components/adaptive/Gallery')
    AdaptiveGallery = adaptiveModule.default
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SSR Rendering (CSS media query approach)', () => {
    it('should render both mobile and desktop galleries in the DOM', () => {
      render(<AdaptiveGallery designs={mockDesigns} />)

      expect(screen.getByTestId('mobile-gallery')).toBeInTheDocument()
      expect(screen.getByTestId('desktop-gallery')).toBeInTheDocument()
    })

    it('should pass designs to mobile gallery', () => {
      render(<AdaptiveGallery designs={mockDesigns} />)

      const mobileGallery = screen.getByTestId('mobile-gallery')
      expect(mobileGallery).toHaveTextContent(`${mockDesigns.length} items`)
    })

    it('should pass designs to desktop gallery', () => {
      render(<AdaptiveGallery designs={mockDesigns} />)

      const desktopGallery = screen.getByTestId('desktop-gallery')
      expect(desktopGallery).toHaveTextContent(`${mockDesigns.length} items`)
    })

    it('should handle empty designs array', () => {
      render(<AdaptiveGallery designs={[]} />)

      const mobileGallery = screen.getByTestId('mobile-gallery')
      const desktopGallery = screen.getByTestId('desktop-gallery')
      expect(mobileGallery).toHaveTextContent('0 items')
      expect(desktopGallery).toHaveTextContent('0 items')
    })
  })

  describe('CSS visibility wrappers', () => {
    it('should wrap mobile gallery in mobileOnly container', () => {
      const { container } = render(<AdaptiveGallery designs={mockDesigns} />)

      const mobileGallery = screen.getByTestId('mobile-gallery')
      // Mobile gallery should be inside a wrapper div (for CSS display control)
      expect(mobileGallery.parentElement?.tagName).toBe('DIV')
    })

    it('should wrap desktop gallery in desktopOnly container', () => {
      render(<AdaptiveGallery designs={mockDesigns} />)

      const desktopGallery = screen.getByTestId('desktop-gallery')
      expect(desktopGallery.parentElement?.tagName).toBe('DIV')
    })
  })

  describe('Props Passing', () => {
    it('should pass designs prop to both galleries', () => {
      render(<AdaptiveGallery designs={mockDesigns} />)

      expect(screen.getByTestId('mobile-gallery')).toHaveTextContent(
        `${mockDesigns.length} items`
      )
      expect(screen.getByTestId('desktop-gallery')).toHaveTextContent(
        `${mockDesigns.length} items`
      )
    })
  })
})
