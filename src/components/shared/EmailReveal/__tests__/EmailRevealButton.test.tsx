// ABOUTME: Minimal test suite for EmailRevealButton - rendering, interaction, accessibility, analytics

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailRevealButton } from '../EmailRevealButton'
import { UmamiEvents } from '@/utils/analytics'

// Mock analytics
jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    emailRevealClicked: jest.fn(),
  },
}))

describe('EmailRevealButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_reveal_button_initially', () => {
      render(<EmailRevealButton />)

      expect(
        screen.getByRole('button', { name: /show email/i })
      ).toBeInTheDocument()
    })

    it('should_not_show_email_content_initially', () => {
      render(<EmailRevealButton />)

      expect(screen.queryByText(/idaromme@gmail\.com/i)).not.toBeInTheDocument()
    })

    it('should_render_email_reveal_container_with_testid', () => {
      render(<EmailRevealButton />)

      expect(screen.getByTestId('email-reveal')).toBeInTheDocument()
    })
  })

  describe('Email Reveal Interaction', () => {
    it('should_reveal_email_when_button_clicked', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      fireEvent.click(button)

      expect(screen.getByText(/idaromme@gmail\.com/i)).toBeInTheDocument()
    })

    it('should_hide_reveal_button_after_email_shown', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      fireEvent.click(button)

      expect(
        screen.queryByRole('button', { name: /show email/i })
      ).not.toBeInTheDocument()
    })

    it('should_render_email_as_mailto_link', () => {
      render(<EmailRevealButton />)

      fireEvent.click(screen.getByRole('button', { name: /show email/i }))

      const emailLink = screen.getByRole('link', {
        name: /idaromme at gmail dot com/i,
      })
      expect(emailLink).toHaveAttribute('href', 'mailto:idaromme@gmail.com')
    })

    it('should_email_remain_visible_after_reveal', () => {
      render(<EmailRevealButton />)

      fireEvent.click(screen.getByRole('button', { name: /show email/i }))

      const emailContent = screen.getByTestId('email-content')
      expect(emailContent).toBeInTheDocument()
      expect(emailContent).toBeVisible()
    })
  })

  describe('ARIA Attributes', () => {
    it('should_have_aria_expanded_false_when_collapsed', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('should_have_aria_controls_pointing_to_email_content', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      expect(button).toHaveAttribute('aria-controls', 'email-content')
    })

    it('should_email_link_have_descriptive_aria_label', () => {
      render(<EmailRevealButton />)

      fireEvent.click(screen.getByRole('button', { name: /show email/i }))

      const emailLink = screen.getByRole('link')
      expect(emailLink).toHaveAttribute(
        'aria-label',
        'Email address: idaromme at gmail dot com'
      )
    })
  })

  describe('Keyboard Navigation', () => {
    it('should_reveal_email_with_Enter_key', async () => {
      const user = userEvent.setup()
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      await user.type(button, '{Enter}')

      expect(screen.getByText(/idaromme@gmail\.com/i)).toBeInTheDocument()
    })

    it('should_reveal_email_with_Space_key', async () => {
      const user = userEvent.setup()
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      await user.type(button, ' ')

      expect(screen.getByText(/idaromme@gmail\.com/i)).toBeInTheDocument()
    })

    it('should_email_link_be_keyboard_accessible', async () => {
      const user = userEvent.setup()
      render(<EmailRevealButton />)

      fireEvent.click(screen.getByRole('button', { name: /show email/i }))

      const emailLink = screen.getByRole('link')
      await user.tab()
      expect(emailLink).toHaveFocus()
    })
  })

  describe('Analytics Tracking', () => {
    it('should_track_email_reveal_click_event', () => {
      render(<EmailRevealButton />)

      fireEvent.click(screen.getByRole('button', { name: /show email/i }))

      expect(UmamiEvents.emailRevealClicked).toHaveBeenCalledWith('normal')
      expect(UmamiEvents.emailRevealClicked).toHaveBeenCalledTimes(1)
    })

    it('should_not_track_event_until_button_clicked', () => {
      render(<EmailRevealButton />)

      expect(UmamiEvents.emailRevealClicked).not.toHaveBeenCalled()
    })

    it('should_track_event_only_once_per_reveal', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      fireEvent.click(button)
      // Button disappears after click, so can't click again

      expect(UmamiEvents.emailRevealClicked).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility Best Practices', () => {
    it('should_render_valid_html_structure', () => {
      const { container } = render(<EmailRevealButton />)

      expect(container.querySelector('.email-reveal-container')).toBeInTheDocument()
      expect(container.querySelector('button')).toBeInTheDocument()
    })

    it('should_email_link_have_valid_mailto_href', () => {
      render(<EmailRevealButton />)

      fireEvent.click(screen.getByRole('button', { name: /show email/i }))

      const emailLink = screen.getByRole('link')
      expect(emailLink.getAttribute('href')).toMatch(/^mailto:/)
    })

    it('should_reveal_button_be_keyboard_focusable', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', { name: /show email/i })
      button.focus()

      expect(button).toHaveFocus()
    })
  })
})
