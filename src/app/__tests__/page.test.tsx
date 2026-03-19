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
    asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
    alt: 'Test Design',
  },
}

jest.mock('@/sanity/dataFetcher', () => ({
  resilientFetch: jest.fn(),
}))

// Stable mock so URL assertions are deterministic
jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest
    .fn()
    .mockReturnValue(
      'https://cdn.sanity.io/images/testproject/testdataset/abc123-800x600.jpg?w=800&q=80'
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

async function renderHome() {
  // Reset the resilientFetch mock for each render
  const { resilientFetch } = await import('@/sanity/dataFetcher')
  ;(resilientFetch as jest.Mock).mockResolvedValue([mockDesign])

  const { default: Home } = await import('../page')
  return render(await Home())
}

describe('Home page — direct CDN preload (Issue #363)', () => {
  it('renders a preload link for the LCP image', async () => {
    const { container } = await renderHome()
    const link = document.head.querySelector('link[rel="preload"][as="image"]')
    expect(link).toBeInTheDocument()
  })

  it('preload href is the direct Sanity CDN URL — no /_next/image proxy', async () => {
    const { container } = await renderHome()
    const link = document.head.querySelector('link[rel="preload"][as="image"]')
    const href = link?.getAttribute('href') ?? ''
    expect(href).toContain('cdn.sanity.io')
    expect(href).not.toContain('/_next/image')
  })

  it('preload href matches the exact URL MobileGalleryItem unoptimized <img> will fetch', async () => {
    const { container } = await renderHome()
    const link = document.head.querySelector('link[rel="preload"][as="image"]')
    expect(link?.getAttribute('href')).toBe(SANITY_BASE)
  })

  it('preload has no imageSrcSet — single URL matches unoptimized <img> src', async () => {
    const { container } = await renderHome()
    const link = document.head.querySelector('link[rel="preload"][as="image"]')
    expect(link?.getAttribute('imagesrcset')).toBeNull()
  })

  it('preload has fetchPriority="high"', async () => {
    const { container } = await renderHome()
    const link = document.head.querySelector('link[rel="preload"][as="image"]')
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

  it('does not render FirstImage overlay — removed in Issue #366 (redundant after #363)', async () => {
    const { container } = await renderHome()
    expect(container.querySelector('[data-first-image]')).not.toBeInTheDocument()
  })
})
