// src/components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

// Mock LoadingSpinner
jest.mock('../LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => `Loading (${size})`
}))

// Helper function to normalize color values
function normalizeColor(color: string): string {
  // Convert rgb(51, 51, 51) to #333, etc.
  if (color.startsWith('rgb(')) {
    const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (matches) {
      const r = parseInt(matches[1])
      const g = parseInt(matches[2])
      const b = parseInt(matches[3])
      const toHex = (n: number) => n.toString(16).padStart(2, '0')
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }
  }
  return color
}

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state correctly', () => {
    render(<Button loading>Submit</Button>)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies primary variant correctly', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByRole('button')
    
    expect(normalizeColor(button.style.backgroundColor)).toBe('#333333')
    expect(normalizeColor(button.style.color)).toBe('#ffffff')
  })

  it('applies outline variant correctly', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    
    expect(button.style.backgroundColor).toBe('transparent')
    expect(normalizeColor(button.style.color)).toBe('#333333')
    expect(button.style.border).toContain('2px solid')
  })

  it('applies secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    
    expect(normalizeColor(button.style.backgroundColor)).toBe('#666666')
    expect(normalizeColor(button.style.color)).toBe('#ffffff')
  })

  it('applies ghost variant correctly', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button')
    
    expect(button.style.backgroundColor).toBe('transparent')
    expect(normalizeColor(button.style.color)).toBe('#333333')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Button size="small">Small</Button>)
    const button = screen.getByRole('button')
    
    expect(button.style.padding).toBe('8px 16px')
    expect(button.style.fontSize).toBe('12px')
    
    rerender(<Button size="medium">Medium</Button>)
    expect(button.style.padding).toBe('12px 24px')
    expect(button.style.fontSize).toBe('14px')
    
    rerender(<Button size="large">Large</Button>)
    expect(button.style.padding).toBe('16px 32px')
    expect(button.style.fontSize).toBe('14px')
  })

  it('applies fullWidth correctly', () => {
    render(<Button fullWidth>Full Width</Button>)
    const button = screen.getByRole('button')
    
    expect(button.style.width).toBe('100%')
  })

  it('handles disabled state correctly', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button.style.cursor).toBe('not-allowed')
    expect(button.style.opacity).toBe('0.6')
  })

  it('prevents interaction when loading', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button loading onClick={handleClick}>Loading Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(button.style.cursor).toBe('not-allowed')
    
    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom styles correctly', () => {
    render(<Button style={{ backgroundColor: 'red', fontSize: '20px' }}>Custom Style</Button>)
    const button = screen.getByRole('button')
    
    expect(button.style.backgroundColor).toBe('red')
    expect(button.style.fontSize).toBe('20px')
  })

  it('maintains accessibility attributes', () => {
    render(<Button aria-label="Custom label">Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('aria-label', 'Custom label')
  })

  it('handles hover states without errors', async () => {
    const user = userEvent.setup()
    render(<Button variant="outline">Hover me</Button>)
    const button = screen.getByRole('button')
    
    // Just test that hovering doesn't throw errors
    await user.hover(button)
    await user.unhover(button)
    
    expect(button).toBeInTheDocument()
  })
})
