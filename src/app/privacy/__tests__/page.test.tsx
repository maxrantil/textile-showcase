// ABOUTME: Tests for the bilingual privacy notice at /privacy (Issue #482, audit SEC-15)
// ABOUTME: English and Danish versions name the controller, each processor, retention and rights

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import PrivacyPage, { metadata } from '../page'

const english = () => screen.getByRole('region', { name: 'Privacy' })
const danish = () => screen.getByRole('region', { name: 'Privatliv' })

describe('PrivacyPage', () => {
  it('has an English and a Danish section, the Danish one marked lang="da"', () => {
    render(<PrivacyPage />)

    expect(english()).toBeInTheDocument()
    expect(danish()).toHaveAttribute('lang', 'da')
  })

  it('links between the two languages', () => {
    render(<PrivacyPage />)

    expect(screen.getByRole('link', { name: 'Dansk' })).toHaveAttribute(
      'href',
      '#dansk'
    )
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '#english'
    )
  })

  it.each([
    ['English', english, /Ida Romme/, /no cookies/i],
    ['Danish', danish, /Ida Romme/, /ingen cookies/i],
  ])(
    '%s names the controller and says there are no cookies',
    (_, section, who, cookies) => {
      render(<PrivacyPage />)

      expect(within(section()).getAllByText(who).length).toBeGreaterThan(0)
      expect(within(section()).getAllByText(cookies).length).toBeGreaterThan(0)
    }
  )

  it.each([
    ['English', english],
    ['Danish', danish],
  ])('%s names every service that handles visitor data', (_, section) => {
    render(<PrivacyPage />)
    const text = section().textContent ?? ''

    for (const service of ['Resend', 'Umami', 'Vultr', 'Sanity', 'Gmail']) {
      expect(text).toContain(service)
    }
  })

  it('says contact emails are kept until the conversation is finished', () => {
    render(<PrivacyPage />)

    expect(english().textContent).toMatch(/until the conversation is finished/i)
    expect(danish().textContent).toMatch(/indtil samtalen er afsluttet/i)
  })

  it('does not print the email address (it stays behind "Show email")', () => {
    const { container } = render(<PrivacyPage />)

    expect(container.textContent).not.toMatch(/@gmail\.com|@idaromme\.dk/)
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
  })

  it('points to the contact page for data requests', () => {
    render(<PrivacyPage />)

    for (const section of [english(), danish()]) {
      expect(
        within(section).getAllByRole('link', { name: /contact|kontakt/i })[0]
      ).toHaveAttribute('href', '/contact')
    }
  })

  it('underlines every link, so none relies on hover or color', () => {
    render(<PrivacyPage />)

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveClass('nordic-link-inline')
    }
  })

  it('has a title and canonical URL', () => {
    expect(String(metadata.title)).toMatch(/Privacy/)
    expect(metadata.alternates?.canonical).toBe('https://idaromme.dk/privacy')
  })
})
