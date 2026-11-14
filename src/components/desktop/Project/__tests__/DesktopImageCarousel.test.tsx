// ABOUTME: Tests for how the desktop project carousel loads its images: the main image is the page's LCP element
// Covers its fetch priority, intrinsic size, sizes attribute and when the neighbouring images are fetched

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DesktopImageCarousel } from '../DesktopImageCarousel'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))
jest.mock('@/utils/analytics')
jest.mock('@/lib/scrollManager', () => ({
  scrollManager: { triggerNavigationStart: jest.fn() },
}))

const image = (id: string, dimensions: string) => ({
  _key: id,
  asset: {
    asset: {
      _ref: `image-${id}-${dimensions}-jpg`,
      _type: 'reference' as const,
    },
  },
})

const portrait = image('portrait1', '4000x6000')
const landscape = image('landscape2', '4032x3024')
const third = image('third3', '3000x3000')
const mainImage = {
  asset: { _ref: 'image-cover-873x1188-jpg', _type: 'reference' as const },
}

function renderCarousel(images = [portrait, landscape, third]) {
  return render(
    <DesktopImageCarousel
      images={images}
      mainImage={mainImage}
      projectTitle="Composing Tones"
    />
  )
}

// The thumbnail of the same image carries the same alt text
const mainImg = () =>
  document.querySelector('img.desktop-project-img') as HTMLImageElement

describe('DesktopImageCarousel image loading', () => {
  it('fetches the main image at high priority', () => {
    renderCarousel()

    expect(mainImg()).toHaveAttribute('fetchpriority', 'high')
    expect(mainImg()).toHaveAttribute('loading', 'eager')
  })

  it("gives the main image the asset's own width and height", () => {
    renderCarousel()

    expect(mainImg()).toHaveAttribute('width', '4000')
    expect(mainImg()).toHaveAttribute('height', '6000')
  })

  it('sizes the main image from its shape: the height of the window less 200px, no wider than the window less 280px', () => {
    renderCarousel()

    expect(mainImg()).toHaveAttribute(
      'sizes',
      'min(calc(100vw - 280px), calc((100vh - 200px) * 0.6667))'
    )
  })

  it('uses the shape of a landscape image for its sizes', () => {
    renderCarousel([landscape, portrait])

    expect(mainImg()).toHaveAttribute(
      'sizes',
      'min(calc(100vw - 280px), calc((100vh - 200px) * 1.3333))'
    )
  })

  it('does not fetch the neighbouring image before the main image has loaded', () => {
    renderCarousel()

    expect(screen.queryByAltText('Next image prefetch')).not.toBeInTheDocument()
  })

  it('fetches the neighbouring image once the main image has loaded', async () => {
    renderCarousel()

    fireEvent.load(mainImg())

    await waitFor(() =>
      expect(screen.getByAltText('Next image prefetch')).toBeInTheDocument()
    )
  })

  it('prefetches the neighbouring image with the sizes it will be shown at', async () => {
    renderCarousel()

    fireEvent.load(mainImg())

    const prefetched = await screen.findByAltText('Next image prefetch')
    expect(prefetched).toHaveAttribute(
      'sizes',
      'min(calc(100vw - 280px), calc((100vh - 200px) * 1.3333))'
    )
    expect(prefetched).toHaveAttribute('width', '4032')
    expect(prefetched).toHaveAttribute('height', '3024')
  })
})
