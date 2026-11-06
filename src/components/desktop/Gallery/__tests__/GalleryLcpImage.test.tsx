// ABOUTME: Tests the desktop gallery's first (LCP) image matches the home page desktop preload
// The page preloads desktopGalleryPreload(); the <img> must request exactly that srcset

import { render } from '@testing-library/react'
import Gallery from '../Gallery'
import type { TextileDesign } from '@/types/textile'
import { desktopGalleryPreload } from '@/utils/lcp-images'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}))

jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    save: jest.fn(),
    saveImmediate: jest.fn(),
    restore: jest.fn().mockResolvedValue(null),
    triggerNavigationStart: jest.fn(),
    clearPosition: jest.fn(),
  },
}))

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: new Proxy({}, { get: () => jest.fn() }),
}))

const designs = [0, 1, 2].map((i) => ({
  _id: `d${i}`,
  title: `Design ${i}`,
  slug: { current: `design-${i}` },
  image: { _type: 'image', asset: { _ref: `image-abc${i}-1200x900-jpg` } },
})) as unknown as TextileDesign[]

describe('Desktop gallery LCP image', () => {
  it('first image requests exactly the srcset the home page preloads', () => {
    const { container } = render(<Gallery designs={designs} />)
    const first = container.querySelector(
      '.desktop-gallery-img'
    ) as HTMLImageElement
    const preload = desktopGalleryPreload(designs[0])

    expect(preload).not.toBeNull()
    expect(first.getAttribute('srcset')).toBe(preload!.imageSrcSet)
    expect(first.getAttribute('sizes')).toBe(preload!.imageSizes)
  })

  it('first image is lazy so phones (gallery hidden) never download it', () => {
    // The desktop-only preload starts the download early on desktop
    const { container } = render(<Gallery designs={designs} />)
    const first = container.querySelector(
      '.desktop-gallery-img'
    ) as HTMLImageElement
    expect(first.getAttribute('loading')).toBe('lazy')
  })

  it('later images stay lazy', () => {
    const { container } = render(<Gallery designs={designs} />)
    const second = container.querySelectorAll('.desktop-gallery-img')[1]
    expect(second.getAttribute('loading')).toBe('lazy')
  })
})
