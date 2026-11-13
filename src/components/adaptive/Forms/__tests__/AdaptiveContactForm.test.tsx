// ABOUTME: Tests that the adaptive contact form keeps typed text and focus when
// ABOUTME: the desktop form is replaced by the mobile one, and adopts text typed before hydration

import React, { act } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import ContactForm from '../index'

// Like the real hook: the server and the hydration render report 'desktop',
// and the client value takes over straight after hydration
let mockDeviceType: 'mobile' | 'desktop' = 'desktop'
const mockListeners = new Set<() => void>()

jest.mock('@/hooks/shared/useDeviceType', () => ({
  useDeviceType: () =>
    jest.requireActual<typeof React>('react').useSyncExternalStore(
      (onChange: () => void) => {
        mockListeners.add(onChange)
        return () => mockListeners.delete(onChange)
      },
      () => mockDeviceType,
      () => 'desktop'
    ),
}))

const switchToMobile = () =>
  act(() => {
    mockDeviceType = 'mobile'
    mockListeners.forEach((notify) => notify())
  })

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    contactFormSubmit: jest.fn(),
    contactFormSuccess: jest.fn(),
    contactFormError: jest.fn(),
  },
}))

const nameField = () => screen.getByLabelText(/name/i) as HTMLInputElement
const emailField = () => screen.getByLabelText(/email/i) as HTMLInputElement
const messageField = () =>
  screen.getByLabelText(/message/i) as HTMLTextAreaElement

describe('Adaptive ContactForm', () => {
  beforeEach(() => {
    mockDeviceType = 'desktop'
  })

  describe('desktop form replaced by the mobile form', () => {
    it('keeps the text typed into every field', async () => {
      const user = userEvent.setup()
      const { container } = render(<ContactForm />)
      expect(container.querySelector('form.desktop-contact-form')).toBeTruthy()

      await user.type(nameField(), 'Ida Romme')
      await user.type(emailField(), 'ida@example.com')
      await user.type(messageField(), 'A message typed before the swap.')

      switchToMobile()

      expect(container.querySelector('form.mobile-contact-form')).toBeTruthy()
      expect(nameField()).toHaveValue('Ida Romme')
      expect(emailField()).toHaveValue('ida@example.com')
      expect(messageField()).toHaveValue('A message typed before the swap.')
    })

    it('keeps validation errors', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      await user.type(emailField(), 'not-an-email')
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()

      switchToMobile()

      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })

    it('keeps focus and the caret in the field being typed into', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      await user.type(messageField(), 'Hello there')
      messageField().setSelectionRange(5, 5)
      const desktopField = messageField()

      switchToMobile()

      expect(messageField()).not.toBe(desktopField)
      expect(messageField()).toHaveFocus()
      expect(messageField().selectionStart).toBe(5)
      expect(messageField().selectionEnd).toBe(5)

      await user.keyboard(' you')
      expect(messageField()).toHaveValue('Hello you there')
    })

    it('does not move focus into the form when no field had it', () => {
      render(<ContactForm />)

      switchToMobile()

      expect(document.body).toHaveFocus()
    })
  })

  describe('text typed before hydration', () => {
    let container: HTMLDivElement

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
      // The server always renders the desktop form
      container.innerHTML = renderToString(<ContactForm />)
    })

    afterEach(() => {
      container.remove()
    })

    const typeIntoServerHtml = () => {
      const name = container.querySelector<HTMLInputElement>('#field-name')!
      name.focus()
      name.value = 'Early Bird'
    }

    it('is kept on desktop when another field changes afterwards', async () => {
      typeIntoServerHtml()

      let root: ReturnType<typeof hydrateRoot>
      await act(async () => {
        root = hydrateRoot(container, <ContactForm />)
      })

      const user = userEvent.setup()
      await user.type(emailField(), 'early@example.com')

      expect(nameField()).toHaveValue('Early Bird')
      await act(async () => root.unmount())
    })

    it('is kept, with focus, when the mobile form mounts on a phone', async () => {
      typeIntoServerHtml()

      mockDeviceType = 'mobile'
      let root: ReturnType<typeof hydrateRoot>
      await act(async () => {
        root = hydrateRoot(container, <ContactForm />)
      })

      expect(container.querySelector('form.mobile-contact-form')).toBeTruthy()
      expect(nameField()).toHaveValue('Early Bird')
      expect(nameField()).toHaveFocus()
      await act(async () => root.unmount())
    })
  })
})
