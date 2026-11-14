// ABOUTME: Tests for Home page preload link — verifies direct Sanity CDN href (Issue #363)

import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Sanity dynamic imports used inside getDesigns()
jest.mock('@/sanity/queries', () => ({
  queries: { getDesignsForHome: 'mock-query' },
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

jest.mock('@/sanity/dataFetcher', () => ({
  resilientFetch: jest.fn(),
}))

// Stable mock so URL assertions are deterministic
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn(
    (source: { asset: { _ref: string } }, options: { height?: number }) => {
      const [, id, dimensions, format] = source.asset._ref.split('-')
      const base = `https://cdn.sanity.io/images/testproject/testdataset/${id}-${dimensions}.${format}`
      return options.height ? `${base}?h=700&q=75&fm=webp&fit=crop` : `${base}?w=800&q=80`
    }
  ),
}))

jest.mock('@/app/metadata/faq-schema', () => ({
  generatePortfolioFAQSchema: jest.fn().mockReturnValue({}),
}))

// Lightweight stubs for child components
jest.mock('@/components/adaptive/Gallery', () => ({
  __esModule: true,
  default: () => <div data-testid="gallery" />,
}))

jest.mock('@/components/server/FirstImage', () => ({
  FirstImage: () => <div data-testid="first-image" data-first-image="true" />,
}))

const SANITY_BASE =
  'https://cdn.sanity.io/images/testproject/testdataset/abc123-800x600.jpg?w=800&q=80'

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

const mobilePreload = () =>
  document.head.querySelector(
    `link[rel="preload"][as="image"][media="${MOBILE_MEDIA}"]`
  )

async function renderHome() {
  // Reset the resilientFetch mock for each render
  const { resilientFetch } = await import('@/sanity/dataFetcher')
  ;(resilientFetch as jest.Mock).mockResolvedValue([
    mockDesign,
    mockSecondDesign,
  ])

  const { default: Home } = await import('../page')
  return render(await Home())
}

describe('Home page — direct CDN preload (Issue #363)', () => {
  it('renders a preload link for the LCP image', async () => {
    const { container } = await renderHome()
    const link = mobilePreload()
    expect(link).toBeInTheDocument()
  })

  it('preload href is the direct Sanity CDN URL — no /_next/image proxy', async () => {
    const { container } = await renderHome()
    const link = mobilePreload()
    const href = link?.getAttribute('href') ?? ''
    expect(href).toContain('cdn.sanity.io')
    expect(href).not.toContain('/_next/image')
  })

  it('preload href matches the exact URL MobileGalleryItem unoptimized <img> will fetch', async () => {
    const { container } = await renderHome()
    const link = mobilePreload()
    expect(link?.getAttribute('href')).toBe(SANITY_BASE)
  })

  it('preload has no imageSrcSet — single URL matches unoptimized <img> src', async () => {
    const { container } = await renderHome()
    const link = mobilePreload()
    expect(link?.getAttribute('imagesrcset')).toBeNull()
  })

  it('preload has fetchPriority="high"', async () => {
    const { container } = await renderHome()
    const link = mobilePreload()
    expect(link?.getAttribute('fetchpriority')).toBe('high')
  })

  it('renders no preload link when there are no designs', async () => {
    const { resilientFetch } = await import('@/sanity/dataFetcher')
    ;(resilientFetch as jest.Mock).mockResolvedValueOnce([])

    const { default: Home } = await import('../page')
    const { container } = render(await Home())
    const link = document.head.querySelector('link[rel="preload"][as="image"]')
    expect(link).not.toBeInTheDocument()
  })

  it('scopes every image preload to one layout, so no viewport downloads the hidden gallery (Issue #429)', async () => {
    await renderHome()
    // React hoists the href preload to <head>; the srcset preloads stay in place
    const media = Array.from(
      document.querySelectorAll('link[rel="preload"][as="image"]')
    ).map((link) => link.getAttribute('media'))

    expect(media).toEqual([MOBILE_MEDIA, DESKTOP_MEDIA, DESKTOP_MEDIA])
  })

  it('preloads the two desktop images on screen at arrival with the srcset their <img> uses (Issue #429)', async () => {
    await renderHome()
    const { desktopGalleryImage } = await import('@/utils/gallery-images')
    const links = Array.from(
      document.querySelectorAll(
        `link[rel="preload"][as="image"][media="${DESKTOP_MEDIA}"]`
      )
    )

    expect(links).toHaveLength(2)
    ;[mockDesign, mockSecondDesign].forEach((design, index) => {
      const image = desktopGalleryImage(design)
      expect(image?.srcSet).toContain('/_next/image')
      expect(links[index].getAttribute('imagesrcset')).toBe(image?.srcSet)
      expect(links[index].getAttribute('imagesizes')).toBe(image?.sizes)
      expect(links[index].getAttribute('href')).toBeNull()
    })
  })

  it('does not render FirstImage overlay — removed in Issue #366 (redundant after #363)', async () => {
    const { container } = await renderHome()
    expect(container.querySelector('[data-first-image]')).not.toBeInTheDocument()
  })
})
