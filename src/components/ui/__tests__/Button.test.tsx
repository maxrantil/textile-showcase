// src/components/ui/__tests__/Button.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BaseButton } from '../BaseButton'

// Create a wrapper component for testing
const Button = BaseButton

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state correctly', () => {
    render(<Button loading>Submit</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Sending...')
  })

  it('applies primary variant class correctly', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('nordic-btn')
    expect(button).toHaveClass('nordic-btn-primary')
  })

  it('applies secondary variant class correctly', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('nordic-btn')
    expect(button).toHaveClass('nordic-btn-secondary')
  })

  it('applies ghost variant class correctly', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('nordic-btn')
    expect(button).toHaveClass('nordic-btn-ghost')
  })

  it('applies submit variant class correctly', () => {
    render(<Button variant="submit">Submit</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('nordic-btn')
    expect(button).toHaveClass('nordic-btn-submit')
  })

  it('applies common button classes', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')

    // Test for classes that are always present
    expect(button).toHaveClass('nordic-btn')
    expect(button).toHaveClass('nordic-btn-secondary') // default variant
  })

  it('applies fullWidth when specified', () => {
    render(<Button fullWidth>Full Width</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveStyle({ width: '100%' })
  })

  it('handles disabled state correctly', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
  })

  it('prevents interaction when loading', () => {
    const handleClick = jest.fn()
    render(
      <Button loading onClick={handleClick}>
        Loading
      </Button>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it('applies custom styles correctly', () => {
    const customStyle = { marginTop: '10px' }
    render(<Button style={customStyle}>Styled</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveStyle(customStyle)
  })

  it('maintains accessibility attributes', () => {
    render(<Button aria-label="Custom label">Button</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('aria-label', 'Custom label')
  })

  it('applies small size class correctly', () => {
    render(<Button size="small">Small</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('nordic-btn-sm')
  })

  it('applies large size class correctly', () => {
    render(<Button size="large">Large</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('nordic-btn-lg')
  })
})
