// ABOUTME: Tests for the contact page - direct contact details come before the form

import React from 'react'
import { render, screen } from '@testing-library/react'
import ContactPage from '../page'

jest.mock('@/components/adaptive/Forms', () => ({
  __esModule: true,
  default: () => <form data-testid="contact-form" />,
}))

jest.mock('@/components/shared/EmailReveal/EmailRevealButton', () => ({
  EmailRevealButton: () => (
    <button data-testid="email-reveal">Show email</button>
  ),
}))

jest.mock('@/components/KeyboardScrollHandler', () => ({
  __esModule: true,
  default: () => null,
}))

describe('ContactPage', () => {
  it('should_render_email_reveal_and_instagram_before_the_form', () => {
    render(<ContactPage />)

    const reveal = screen.getByTestId('email-reveal')
    const instagram = screen.getByRole('link', { name: /instagram/i })
    const form = screen.getByTestId('contact-form')

    expect(instagram).toHaveAttribute(
      'href',
      'https://www.instagram.com/idaromme'
    )
    expect(
      reveal.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      instagram.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('should_keep_a_single_page_heading', () => {
    render(<ContactPage />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Contact'
    )
  })
})
