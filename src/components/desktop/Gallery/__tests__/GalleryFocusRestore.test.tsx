// ABOUTME: Test suite for the desktop Gallery's focus restoration after back navigation
// Covers which saved focus index a mounting gallery may use: the one from before it mounted, not one saved by a click after

import { render, screen, act, fireEvent } from '@testing-library/react'
import { mockDesigns } from '../../../../../tests/fixtures/designs'
import Gallery from '../Gallery'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}))

// jsdom cannot follow links; the gallery's own click handler still runs
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event)
        event.preventDefault()
      }}
    >
      {children}
    </a>
  ),
}))

jest.mock('@/utils/image-helpers', () => ({
  getOptimizedImageUrl: jest.fn(() => 'https://cdn.example.com/image.webp'),
}))

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: { viewProject: jest.fn() },
}))

jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    saveImmediate: jest.fn(),
    restore: jest.fn().mockResolvedValue(null),
  },
}))

describe('Desktop Gallery focus restoration', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    sessionStorage.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('focuses the item saved before the gallery mounted and clears the saved index', async () => {
    sessionStorage.setItem('galleryFocusIndex', '1')
    render(<Gallery designs={mockDesigns} />)

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000)
    })

    expect(screen.getByTestId('gallery-item-1')).toHaveFocus()
    expect(sessionStorage.getItem('galleryFocusIndex')).toBeNull()
  })

  it('leaves an index saved by a click right after mounting for the return visit', async () => {
    render(<Gallery designs={mockDesigns} />)

    // A visitor clicks before the restore routine has finished
    fireEvent.click(screen.getByTestId('gallery-item-1'))
    expect(sessionStorage.getItem('galleryFocusIndex')).toBe('1')

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000)
    })

    expect(sessionStorage.getItem('galleryFocusIndex')).toBe('1')
  })
})
