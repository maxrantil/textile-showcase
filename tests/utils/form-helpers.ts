// ABOUTME: Form interaction testing utilities

import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Fills a form field by its label text
 */
export const fillFormField = async (label: string, value: string) => {
  const input = screen.getByLabelText(label)
  await userEvent.clear(input)
  await userEvent.type(input, value)
  return input
}

/**
 * Fills a form field and triggers blur event
 */
export const fillAndBlurFormField = async (label: string, value: string) => {
  const input = await fillFormField(label, value)
  fireEvent.blur(input)
  return input
}

/**
 * Submits a form by clicking the submit button
 * Uses userEvent for realistic async interaction
 */
export const submitForm = async (buttonText: string = 'Submit') => {
  const user = userEvent.setup()
  const button = screen.getByRole('button', {
    name: new RegExp(buttonText, 'i'),
  })
  await user.click(button)
}

/**
 * Submits a form by pressing Enter key
 */
export const submitFormByEnter = (formElement: HTMLElement) => {
  fireEvent.submit(formElement)
}

/**
 * Expects a validation error to be displayed
 */
export const expectValidationError = async (errorMessage: string | RegExp) => {
  await waitFor(() => {
    const error = screen.getByRole('alert')
    if (typeof errorMessage === 'string') {
      expect(error).toHaveTextContent(errorMessage)
    } else {
      expect(error.textContent).toMatch(errorMessage)
    }
  })
}

/**
 * Expects no validation errors to be present
 */
export const expectNoValidationErrors = () => {
  const errors = screen.queryAllByRole('alert')
  expect(errors).toHaveLength(0)
}

/**
 * Checks if a form field has an error
 */
export const expectFieldHasError = (label: string) => {
  const input = screen.getByLabelText(label)

  // Check for aria-invalid attribute
  expect(input).toHaveAttribute('aria-invalid', 'true')
}

/**
 * Checks if a form field does not have an error
 */
export const expectFieldHasNoError = (label: string) => {
  const input = screen.getByLabelText(label)

  // Check that aria-invalid is false or not present
  const ariaInvalid = input.getAttribute('aria-invalid')
  expect(ariaInvalid === 'false' || ariaInvalid === null).toBe(true)
}

/**
 * Fills an entire form with provided data
 */
export const fillForm = async (formData: Record<string, string>) => {
  for (const [label, value] of Object.entries(formData)) {
    await fillFormField(label, value)
  }
}

/**
 * Checks if a submit button is disabled
 */
export const expectSubmitDisabled = (buttonText: string = 'Submit') => {
  const button = screen.getByRole('button', {
    name: new RegExp(buttonText, 'i'),
  })
  expect(button).toBeDisabled()
}

/**
 * Checks if a submit button is enabled
 */
export const expectSubmitEnabled = (buttonText: string = 'Submit') => {
  const button = screen.getByRole('button', {
    name: new RegExp(buttonText, 'i'),
  })
  expect(button).toBeEnabled()
}

/**
 * Waits for a form to be in loading state
 */
export const waitForLoadingState = async () => {
  await waitFor(() => {
    const loadingIndicator = screen.queryByText(/loading|sending|submitting/i)
    expect(loadingIndicator).toBeInTheDocument()
  })
}

/**
 * Waits for a success message to appear
 */
export const waitForSuccessMessage = async (message?: string | RegExp) => {
  await waitFor(() => {
    if (message) {
      if (typeof message === 'string') {
        expect(screen.getByText(message)).toBeInTheDocument()
      } else {
        expect(screen.getByText(message)).toBeInTheDocument()
      }
    } else {
      const successElement = screen.getByText(/success|sent|submitted/i)
      expect(successElement).toBeInTheDocument()
    }
  })
}

/**
 * Checks if form fields are cleared
 */
export const expectFormCleared = (labels: string[]) => {
  labels.forEach((label) => {
    const input = screen.getByLabelText(label) as HTMLInputElement
    expect(input.value).toBe('')
  })
}

/**
 * Simulates rapid form field changes
 */
export const rapidlyChangeField = async (label: string, values: string[]) => {
  const input = screen.getByLabelText(label)

  for (const value of values) {
    fireEvent.change(input, { target: { value } })
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

/**
 * Tests form field character limit
 */
export const testCharacterLimit = async (
  label: string,
  maxLength: number,
  overflowText: string
) => {
  const input = screen.getByLabelText(label) as HTMLInputElement
  await userEvent.type(input, overflowText)

  expect(input.value.length).toBeLessThanOrEqual(maxLength)
}

/**
 * Mocks a successful form submission
 */
export const mockSuccessfulSubmission = () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
  } as Response)
}

/**
 * Mocks a failed form submission
 */
export const mockFailedSubmission = (
  status: number = 500,
  message?: string
) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: message || 'Submission failed' }),
  } as Response)
}

/**
 * Mocks a network error
 */
export const mockNetworkError = () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
}
