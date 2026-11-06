// ABOUTME: Tests the desktop carousel for projects without gallery images
// Without a gallery it shows the project's main image, like the mobile view

import { render, screen } from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import { DesktopImageCarousel } from '../DesktopImageCarousel'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/project/test',
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}))

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: new Proxy({}, { get: () => jest.fn() }),
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

const mainImage = { asset: { _ref: 'image-mainimg-1200x900-jpg' } } as never

describe('DesktopImageCarousel without gallery images', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}))
  afterEach(() => jest.restoreAllMocks())

  it.each([
    ['empty gallery', []],
    ['missing gallery', undefined],
  ])('shows the main image (%s)', (_, images) => {
    render(
      <DesktopImageCarousel
        images={images}
        mainImage={mainImage}
        projectTitle="Salt"
      />
    )

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toContain('mainimg-1200x900')
    expect(
      screen.queryByText('No gallery images available')
    ).not.toBeInTheDocument()
  })

  it('shows no previous/next navigation for a single image', () => {
    render(
      <DesktopImageCarousel
        images={[]}
        mainImage={mainImage}
        projectTitle="Salt"
      />
    )
    expect(
      screen.queryByRole('button', { name: /next|previous/i })
    ).not.toBeInTheDocument()
  })

  it('still shows the placeholder when there is no image at all', () => {
    render(
      <DesktopImageCarousel
        images={[]}
        mainImage={undefined as never}
        projectTitle="Salt"
      />
    )
    expect(screen.getByText('No gallery images available')).toBeInTheDocument()
  })
})
