// src/components/desktop/Header/__tests__/DesktopHeader.test.tsx
import { render } from '@testing-library/react'
import { DesktopHeader } from '../DesktopHeader'

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1024 })
})

describe('DesktopHeader', () => {
  it('shows navigation links', () => {
    const { getByText } = render(<DesktopHeader />)

    expect(getByText('WORK')).toBeInTheDocument()
    expect(getByText('ABOUT')).toBeInTheDocument()
    expect(getByText('CONTACT')).toBeInTheDocument()
  })
})
