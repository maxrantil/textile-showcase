// ABOUTME: Tests for Home page preload link — verifies /_next/image srcset (Issue #345)

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
  FirstImage: () => <div data-testid="first-image" />,
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

describe('Home page — /_next/image preload (Issue #345)', () => {
  it('renders a preload link for the LCP image', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    expect(link).toBeInTheDocument()
  })

  it('preload imageSrcSet uses /_next/image proxy URLs, not Sanity CDN directly', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    const srcset = link?.getAttribute('imagesrcset') ?? ''
    expect(srcset).toContain('/_next/image')
    // Should NOT have a bare Sanity CDN URL as the start of an entry
    expect(srcset).not.toMatch(/(^|,\s*)https:\/\/cdn\.sanity\.io/)
  })

  it('preload imageSrcSet contains the Sanity CDN URL encoded inside /_next/image', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    const srcset = link?.getAttribute('imagesrcset') ?? ''
    expect(srcset).toContain(encodeURIComponent(SANITY_BASE))
  })

  it('preload imageSrcSet includes mobile-critical breakpoints 750w and 828w', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    const srcset = link?.getAttribute('imagesrcset') ?? ''
    expect(srcset).toContain('750w')
    expect(srcset).toContain('828w')
  })

  it('preload imageSrcSet includes desktop breakpoints 1080w and 1200w', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    const srcset = link?.getAttribute('imagesrcset') ?? ''
    expect(srcset).toContain('1080w')
    expect(srcset).toContain('1200w')
  })

  it('preload uses q=75 (Next.js default quality)', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    const srcset = link?.getAttribute('imagesrcset') ?? ''
    expect(srcset).toContain('q=75')
  })

  it('preload imageSizes is "100vw" matching MobileGalleryItem sizes prop', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    expect(link?.getAttribute('imagesizes')).toBe('100vw')
  })

  it('preload has fetchPriority="high"', async () => {
    const { container } = await renderHome()
    const link = container.querySelector('link[rel="preload"][as="image"]')
    expect(link?.getAttribute('fetchpriority')).toBe('high')
  })

  it('renders no preload link when there are no designs', async () => {
    const { resilientFetch } = await import('@/sanity/dataFetcher')
    ;(resilientFetch as jest.Mock).mockResolvedValueOnce([])

    const { default: Home } = await import('../page')
    const { container } = render(await Home())
    const link = container.querySelector('link[rel="preload"][as="image"]')
    expect(link).not.toBeInTheDocument()
  })
})
