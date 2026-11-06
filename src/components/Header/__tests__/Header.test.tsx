// ABOUTME: Behaviour tests for the site Header mobile menu
// Menu closes on route change and locks body scroll while open

import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Header } from '../Header'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))
const mockPathname = usePathname as jest.Mock

describe('Header mobile menu', () => {
  beforeEach(() => mockPathname.mockReturnValue('/'))

  const menuButton = () => screen.getByRole('button', { name: /menu/i })

  it('opens the menu and locks body scroll', () => {
    render(<Header />)
    fireEvent.click(menuButton())
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes the menu when the route changes', () => {
    const { rerender } = render(<Header />)
    fireEvent.click(menuButton())
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')

    mockPathname.mockReturnValue('/about')
    rerender(<Header />)

    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps the menu open when re-rendered on the same route', () => {
    const { rerender } = render(<Header />)
    fireEvent.click(menuButton())
    rerender(<Header />)
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
  })
})
