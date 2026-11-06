// ABOUTME: Tests that desktop gallery scroll snapping starts only after first paint
// Snapping at initial layout scrolls the track before paint, so Chrome records no LCP on /

import { render, act } from '@testing-library/react'
import Gallery from '../Gallery'
import type { TextileDesign } from '@/types/textile'

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

describe('Desktop gallery scroll snap timing', () => {
  let rafQueue: FrameRequestCallback[]

  beforeEach(() => {
    rafQueue = []
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        rafQueue.push(cb)
        return rafQueue.length
      })
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  const flushFrames = (n: number) => {
    for (let i = 0; i < n; i++) {
      const queued = rafQueue
      rafQueue = []
      act(() => queued.forEach((cb) => cb(performance.now())))
    }
  }

  const track = (container: HTMLElement) =>
    container.querySelector('.desktop-gallery-track') as HTMLElement

  it('renders the track without snapping so the first paint is not scrolled', () => {
    const { container } = render(<Gallery designs={designs} />)
    expect(track(container)).not.toHaveClass('snap-ready')
  })

  it('enables snapping after two animation frames', () => {
    const { container } = render(<Gallery designs={designs} />)
    flushFrames(1)
    expect(track(container)).not.toHaveClass('snap-ready')
    flushFrames(1)
    expect(track(container)).toHaveClass('snap-ready')
  })
})
