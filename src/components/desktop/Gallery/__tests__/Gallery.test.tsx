// ABOUTME: Test suite for the desktop Gallery captions - title and year under each image

import { render, screen } from '@testing-library/react'
import { mockDesigns, mockMinimalDesign } from '../../../../../tests/fixtures/designs'
import Gallery from '../Gallery'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn((source) =>
    source ? 'https://cdn.example.com/optimized-image.webp' : ''
  ),
}))

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    viewProject: jest.fn(),
  },
}))

jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    save: jest.fn(),
    saveImmediate: jest.fn(),
    restore: jest.fn().mockResolvedValue(0),
    triggerNavigationStart: jest.fn(),
    clearPosition: jest.fn(),
  },
}))

describe('Desktop Gallery captions', () => {
  it('shows the year after the title, as a catalogue entry', () => {
    const design = mockDesigns[0]
    render(<Gallery designs={[design]} />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveClass('desktop-gallery-title')
    expect(heading).toHaveTextContent(`${design.title}, ${design.year}`)
  })

  it('shows the title alone when the design has no year', () => {
    render(<Gallery designs={[mockMinimalDesign]} />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toBe(mockMinimalDesign.title)
  })
})

describe('Desktop Gallery image loading', () => {
  it('loads the two images on screen at arrival eagerly and the rest lazily', () => {
    render(<Gallery designs={mockDesigns} />)

    const loading = screen
      .getAllByRole('img')
      .map((img) => img.getAttribute('loading'))

    expect(loading.slice(0, 2)).toEqual(['eager', 'eager'])
    expect(loading.slice(2).every((value) => value === 'lazy')).toBe(true)
    expect(loading.length).toBeGreaterThan(2)
  })
})
