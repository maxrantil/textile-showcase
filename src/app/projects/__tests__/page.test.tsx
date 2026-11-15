// ABOUTME: Tests for the /projects page image preloads
// The page shows the same galleries as home, so it preloads the same images the same way (Issue #395)

import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Sanity dynamic imports used inside getDesigns()
jest.mock('@/sanity/queries', () => ({
  queries: { getDesignsForHome: 'mock-query' },
}))

jest.mock('@/sanity/dataFetcher', () => ({
  resilientFetch: jest.fn(),
}))

// Stable mock so URL assertions are deterministic
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn(
    (source: { asset: { _ref: string } }, options: { height?: number }) => {
      const [, id, dimensions, format] = source.asset._ref.split('-')
      const base = `https://cdn.sanity.io/images/testproject/testdataset/${id}-${dimensions}.${format}`
      return options.height
        ? `${base}?h=700&q=75&fm=webp&fit=crop`
        : `${base}?w=800&q=80`
    }
  ),
}))

jest.mock('@/components/adaptive/Gallery', () => ({
  __esModule: true,
  default: () => <div data-testid="gallery" />,
}))

const mockDesign = {
  _id: 'design-1',
  title: 'Test Design',
  slug: { current: 'test-design' },
  image: {
    asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' as const },
    alt: 'Test Design',
  },
}

const mockSecondDesign = {
  _id: 'design-2',
  title: 'Second Design',
  slug: { current: 'second-design' },
  image: {
    asset: { _ref: 'image-def456-1200x800-jpg', _type: 'reference' as const },
    alt: 'Second Design',
  },
}

const MOBILE_MEDIA = 'not all and (min-width: 768px)'
const DESKTOP_MEDIA = '(min-width: 768px)'

const imagePreloads = () =>
  Array.from(document.querySelectorAll('link[rel="preload"][as="image"]'))

async function renderProjects(designs: unknown[]) {
  const { resilientFetch } = await import('@/sanity/dataFetcher')
  ;(resilientFetch as jest.Mock).mockResolvedValue(designs)

  const { default: ProjectsPage } = await import('../page')
  return render(await ProjectsPage())
}

describe('/projects page image preloads (Issue #395)', () => {
  it('sends no image preload in CORS mode: the image CDN allows no origin, so such a preload fails and the image is fetched twice', async () => {
    await renderProjects([mockDesign, mockSecondDesign])

    expect(imagePreloads().length).toBeGreaterThan(0)
    imagePreloads().forEach((link) => {
      expect(link.getAttribute('crossorigin')).toBeNull()
    })
  })

  it('scopes every image preload to one layout, so no viewport downloads the hidden gallery', async () => {
    await renderProjects([mockDesign, mockSecondDesign])

    expect(imagePreloads().map((link) => link.getAttribute('media'))).toEqual([
      MOBILE_MEDIA,
      DESKTOP_MEDIA,
      DESKTOP_MEDIA,
    ])
  })

  it('preloads the phone image at the URL its <img> requests', async () => {
    await renderProjects([mockDesign, mockSecondDesign])
    const { mobileGalleryImageUrl } = await import('@/utils/gallery-images')
    const link = document.querySelector(
      `link[rel="preload"][as="image"][media="${MOBILE_MEDIA}"]`
    )

    expect(link?.getAttribute('href')).toBe(mobileGalleryImageUrl(mockDesign))
    expect(link?.getAttribute('imagesrcset')).toBeNull()
    expect(link?.getAttribute('fetchpriority')).toBe('high')
  })

  it('preloads the two desktop images on screen at arrival with the srcset their <img> uses', async () => {
    await renderProjects([mockDesign, mockSecondDesign])
    const { desktopGalleryImage } = await import('@/utils/gallery-images')
    const links = document.querySelectorAll(
      `link[rel="preload"][as="image"][media="${DESKTOP_MEDIA}"]`
    )

    expect(links).toHaveLength(2)
    ;[mockDesign, mockSecondDesign].forEach((design, index) => {
      const image = desktopGalleryImage(design)
      expect(links[index].getAttribute('imagesrcset')).toBe(image.srcSet)
      expect(links[index].getAttribute('imagesizes')).toBe(image.sizes)
      expect(links[index].getAttribute('href')).toBeNull()
    })
  })

  it('renders no image preload when there are no designs', async () => {
    await renderProjects([])

    expect(imagePreloads()).toHaveLength(0)
  })
})
