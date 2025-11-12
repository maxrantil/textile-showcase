// ABOUTME: Comprehensive test suite for EmailRevealButton - accessibility, progressive disclosure, clipboard functionality

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailRevealButton } from '../EmailRevealButton'
import { UmamiEvents } from '@/utils/analytics'

// Mock analytics
jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    emailRevealClicked: jest.fn(),
    emailCopied: jest.fn(),
    emailHidden: jest.fn(),
  },
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})

describe('EmailRevealButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_reveal_button_in_normal_state', () => {
      render(<EmailRevealButton />)

      expect(
        screen.getByRole('button', { name: /prefer email.*show address/i })
      ).toBeInTheDocument()
    })

    it('should_render_reveal_button_in_error_state_with_prominent_text', () => {
      render(<EmailRevealButton hasError={true} />)

      expect(
        screen.getByRole('button', {
          name: /having trouble.*show email address/i,
        })
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

  describe('ARIA Attributes - Accessibility', () => {
    it('should_have_aria_expanded_false_when_collapsed', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('should_have_aria_controls_pointing_to_email_content', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      expect(button).toHaveAttribute('aria-controls', 'email-content')
    })

    it('should_have_aria_describedby_with_help_text', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      expect(button).toHaveAttribute('aria-describedby')

      const describedById = button.getAttribute('aria-describedby')
      expect(describedById).toBeTruthy()

      const helpText = document.getElementById(describedById!)
      expect(helpText).toHaveTextContent(/alternative contact method/i)
    })

    it('should_have_type_button_attribute', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should_have_region_role_for_revealed_content', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('id', 'email-content')
      expect(region).toHaveAttribute('aria-label', 'Email address revealed')
    })

    it('should_update_aria_expanded_to_true_when_revealed', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const hideButton = screen.getByRole('button', { name: /hide email/i })
      expect(hideButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('should_announce_copy_success_to_screen_readers', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        const status = screen.getByRole('status')
        expect(status).toHaveTextContent(/email address copied to clipboard/i)
      })
    })

    it('should_have_sr_only_class_for_screen_reader_text', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      const describedById = button.getAttribute('aria-describedby')
      const helpText = document.getElementById(describedById!)

      expect(helpText).toHaveClass('sr-only')
    })
  })

  describe('Progressive Disclosure - State Changes', () => {
    it('should_reveal_email_when_button_clicked', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      expect(screen.getByText(/idaromme@gmail\.com/i)).toBeInTheDocument()
    })

    it('should_hide_reveal_button_when_email_shown', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      expect(
        screen.queryByRole('button', { name: /prefer email.*show address/i })
      ).not.toBeInTheDocument()
    })

    it('should_show_copy_button_when_email_revealed', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      expect(
        screen.getByRole('button', { name: /copy/i })
      ).toBeInTheDocument()
    })

    it('should_show_hide_button_when_email_revealed', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      expect(
        screen.getByRole('button', { name: /hide email/i })
      ).toBeInTheDocument()
    })

    it('should_hide_email_when_hide_button_clicked', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const hideButton = screen.getByRole('button', { name: /hide email/i })
      fireEvent.click(hideButton)

      expect(
        screen.queryByText(/idaromme@gmail\.com/i)
      ).not.toBeInTheDocument()
    })

    it('should_restore_reveal_button_after_hiding', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const hideButton = screen.getByRole('button', { name: /hide email/i })
      fireEvent.click(hideButton)

      expect(
        screen.getByRole('button', { name: /prefer email.*show address/i })
      ).toBeInTheDocument()
    })
  })

  describe('Copy to Clipboard Functionality', () => {
    it('should_copy_email_to_clipboard_when_copy_button_clicked', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'idaromme@gmail.com'
        )
      })
    })

    it('should_show_copied_confirmation_after_successful_copy', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /email copied to clipboard/i })
        ).toBeInTheDocument()
      })
    })

    it('should_change_copy_button_text_to_copied', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/✓ Copied!/i)).toBeInTheDocument()
      })
    })

    it('should_reset_copy_button_text_after_2_seconds', async () => {
      jest.useFakeTimers()
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/✓ Copied!/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.queryByText(/✓ Copied!/i)).not.toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /copy email to clipboard/i })
        ).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should_disable_copy_button_during_copied_state', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        const copiedButton = screen.getByRole('button', {
          name: /email copied to clipboard/i,
        })
        expect(copiedButton).toBeDisabled()
      })
    })

    it('should_handle_clipboard_copy_failure_gracefully', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      ;(navigator.clipboard.writeText as jest.Mock).mockRejectedValue(
        new Error('Clipboard denied')
      )

      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Copy failed:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should_be_keyboard_accessible_with_tab', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })

      await userEvent.tab()
      expect(revealButton).toHaveFocus()
    })

    it('should_activate_reveal_on_enter_key', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })

      revealButton.focus()
      await userEvent.keyboard('{Enter}')

      expect(screen.getByText(/idaromme@gmail\.com/i)).toBeInTheDocument()
    })

    it('should_activate_reveal_on_space_key', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })

      revealButton.focus()
      await userEvent.keyboard(' ')

      expect(screen.getByText(/idaromme@gmail\.com/i)).toBeInTheDocument()
    })

    it('should_allow_tabbing_through_revealed_elements', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const emailLink = screen.getByRole('link', { name: /idaromme/i })
      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      const hideButton = screen.getByRole('button', { name: /hide email/i })

      await userEvent.tab()
      expect(emailLink).toHaveFocus()

      await userEvent.tab()
      expect(copyButton).toHaveFocus()

      await userEvent.tab()
      expect(hideButton).toHaveFocus()
    })
  })

  describe('Analytics Integration', () => {
    it('should_track_email_reveal_clicked_in_normal_state', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      expect(UmamiEvents.emailRevealClicked).toHaveBeenCalledWith('normal')
    })

    it('should_track_email_reveal_clicked_in_error_state', () => {
      render(<EmailRevealButton hasError={true} />)

      const revealButton = screen.getByRole('button', {
        name: /having trouble.*show email address/i,
      })
      fireEvent.click(revealButton)

      expect(UmamiEvents.emailRevealClicked).toHaveBeenCalledWith('error')
    })

    it('should_track_email_copied_success', async () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(UmamiEvents.emailCopied).toHaveBeenCalledWith('success')
      })
    })

    it('should_track_email_copied_error_on_failure', async () => {
      ;(navigator.clipboard.writeText as jest.Mock).mockRejectedValue(
        new Error('Clipboard denied')
      )

      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(UmamiEvents.emailCopied).toHaveBeenCalledWith('error')
      })
    })

    it('should_track_email_hidden', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const hideButton = screen.getByRole('button', { name: /hide email/i })
      fireEvent.click(hideButton)

      expect(UmamiEvents.emailHidden).toHaveBeenCalled()
    })
  })

  describe('Error State Styling', () => {
    it('should_apply_normal_state_class_when_no_error', () => {
      render(<EmailRevealButton />)

      const button = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      expect(button).toHaveClass('email-reveal-button')
      expect(button).toHaveClass('normal-state')
    })

    it('should_apply_error_state_class_when_hasError_true', () => {
      render(<EmailRevealButton hasError={true} />)

      const button = screen.getByRole('button', {
        name: /having trouble.*show email address/i,
      })
      expect(button).toHaveClass('email-reveal-button')
      expect(button).toHaveClass('error-state')
    })
  })

  describe('Email Link', () => {
    it('should_render_email_as_mailto_link', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const emailLink = screen.getByRole('link', { name: /idaromme/i })
      expect(emailLink).toHaveAttribute('href', 'mailto:idaromme@gmail.com')
    })

    it('should_have_accessible_email_label', () => {
      render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const emailLink = screen.getByRole('link', { name: /idaromme/i })
      expect(emailLink).toHaveAttribute(
        'aria-label',
        'Email address: idaromme at gmail dot com'
      )
    })
  })

  describe('Component Cleanup', () => {
    it('should_cleanup_timers_on_unmount', async () => {
      jest.useFakeTimers()
      const { unmount } = render(<EmailRevealButton />)

      const revealButton = screen.getByRole('button', {
        name: /prefer email.*show address/i,
      })
      fireEvent.click(revealButton)

      const copyButton = screen.getByRole('button', {
        name: /copy email to clipboard/i,
      })
      fireEvent.click(copyButton)

      unmount()

      // Should not throw error
      jest.advanceTimersByTime(2000)

      jest.useRealTimers()
    })
  })
})
