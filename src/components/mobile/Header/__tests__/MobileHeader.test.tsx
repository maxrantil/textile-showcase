// src/components/mobile/Header/__tests__/MobileHeader.test.tsx
import { render, fireEvent } from '@testing-library/react'
import { MobileHeader } from '../MobileHeader'

// Mock mobile environment
beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 375 })
  Object.defineProperty(window, 'ontouchstart', { value: () => {} })
})

describe('MobileHeader', () => {
  it('opens mobile menu on hamburger click', () => {
    const { getByLabelText, getByRole } = render(<MobileHeader />)

    fireEvent.click(getByLabelText('Open menu'))
    expect(getByRole('dialog')).toBeInTheDocument()
  })
})
