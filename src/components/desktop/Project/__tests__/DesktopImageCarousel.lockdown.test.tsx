// ABOUTME: Tests iOS lockdown-mode handling in DesktopImageCarousel
// Covers detection on mount and the switch to lockdown mode after an iOS image error

import { render, screen, fireEvent } from '@testing-library/react'
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

jest.mock('@/components/ui/LockdownImage', () => ({
  LockdownImage: () => <div data-testid="lockdown-image" />,
}))

jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn(() => 'https://cdn.example.com/img.webp'),
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

const asset = { _type: 'image', asset: { _ref: 'image-abc-800x600-jpg' } }
const images = [
  { _key: '1', asset, caption: 'First' },
  { _key: '2', asset, caption: 'Second' },
] as never

const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130'

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  })
}

function renderCarousel() {
  return render(
    <DesktopImageCarousel
      images={images}
      mainImage={asset as never}
      projectTitle="Test"
    />
  )
}

describe('DesktopImageCarousel lockdown mode', () => {
  const originalWebGL = window.WebGLRenderingContext
  const originalIO = window.IntersectionObserver

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    // Normal (non-lockdown) capabilities
    Object.defineProperty(window, 'IntersectionObserver', {
      value: class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window, 'WebGLRenderingContext', {
      value: function WebGL() {},
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      value: originalIO,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window, 'WebGLRenderingContext', {
      value: originalWebGL,
      configurable: true,
    })
    setUserAgent(DESKTOP_UA)
    jest.restoreAllMocks()
  })

  it('uses the regular image on a normal desktop browser', () => {
    setUserAgent(DESKTOP_UA)
    renderCarousel()
    expect(screen.queryByTestId('lockdown-image')).not.toBeInTheDocument()
  })

  it('detects lockdown mode on iPad when WebGL is unavailable', () => {
    setUserAgent(IPAD_UA)
    Object.defineProperty(window, 'WebGLRenderingContext', {
      value: undefined,
      configurable: true,
    })
    renderCarousel()
    expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
  })

  it('switches to lockdown mode when an image fails to load on iOS', () => {
    setUserAgent(IPAD_UA)
    renderCarousel()
    expect(screen.queryByTestId('lockdown-image')).not.toBeInTheDocument()

    fireEvent.error(screen.getByAltText('First'))

    expect(screen.getByTestId('lockdown-image')).toBeInTheDocument()
  })

  it('does not switch to lockdown mode on image error outside iOS', () => {
    setUserAgent(DESKTOP_UA)
    renderCarousel()
    fireEvent.error(screen.getByAltText('First'))
    expect(screen.queryByTestId('lockdown-image')).not.toBeInTheDocument()
  })
})
