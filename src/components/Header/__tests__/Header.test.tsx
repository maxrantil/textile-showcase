// ABOUTME: Tests for Header - mobile menu toggling, closing the menu on
// ABOUTME: route change, and locking body scroll while the menu is open
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Header } from '../Header'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

const mockUsePathname = usePathname as jest.Mock

describe('Header', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('toggles the mobile menu and locks body scroll while open', () => {
    render(<Header />)
    const button = screen.getByRole('button', { name: 'Open menu' })

    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
  })

  it('closes the mobile menu when the route changes', () => {
    const { rerender } = render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )

    mockUsePathname.mockReturnValue('/about')
    rerender(<Header />)

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps the menu open when re-rendered on the same route', () => {
    const { rerender } = render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    rerender(<Header />)

    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
})
