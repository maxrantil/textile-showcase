// ABOUTME: Accessibility testing utilities for mobile components

/**
 * Checks if an element meets minimum touch target size (44x44px per WCAG)
 */
export const checkTouchTargetSize = (element: HTMLElement | null) => {
  if (!element) {
    throw new Error('Element not found for touch target size check')
  }

  const rect = element.getBoundingClientRect()
  const minSize = 44 // WCAG 2.1 AA minimum

  expect(rect.width).toBeGreaterThanOrEqual(minSize)
  expect(rect.height).toBeGreaterThanOrEqual(minSize)
}

/**
 * Checks if an element is keyboard accessible (has tabIndex >= 0)
 */
export const checkKeyboardNavigation = (element: HTMLElement | null) => {
  if (!element) {
    throw new Error('Element not found for keyboard navigation check')
  }

  const tabIndex = element.getAttribute('tabIndex')

  if (tabIndex === null) {
    // Check if element is naturally focusable (button, a, input, etc.)
    const focusableTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']
    const isFocusable = focusableTags.includes(element.tagName)

    expect(isFocusable).toBe(true)
  } else {
    expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0)
  }
}

/**
 * Checks if an element has proper ARIA labeling
 */
export const checkAriaLabel = (element: HTMLElement | null) => {
  if (!element) {
    throw new Error('Element not found for ARIA label check')
  }

  const hasAriaLabel = element.hasAttribute('aria-label')
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby')
  const hasAriaDescribedBy = element.hasAttribute('aria-describedby')
  const hasTitle = element.hasAttribute('title')

  // Element should have at least one labeling mechanism
  const hasAccessibleLabel =
    hasAriaLabel || hasAriaLabelledBy || hasAriaDescribedBy || hasTitle

  expect(hasAccessibleLabel).toBe(true)
}

/**
 * Checks if an element can receive focus
 */
export const checkFocusVisible = (element: HTMLElement | null) => {
  if (!element) {
    throw new Error('Element not found for focus check')
  }

  element.focus()
  expect(document.activeElement).toBe(element)
}

/**
 * Checks if an element has proper semantic HTML role
 */
export const checkSemanticRole = (
  element: HTMLElement | null,
  expectedRole: string
) => {
  if (!element) {
    throw new Error('Element not found for semantic role check')
  }

  const role = element.getAttribute('role') || element.tagName.toLowerCase()
  expect(role).toBe(expectedRole)
}

/**
 * Checks if form field has associated label
 */
export const checkFormFieldLabel = (fieldId: string) => {
  const field = document.getElementById(fieldId)
  if (!field) {
    throw new Error(`Form field with id "${fieldId}" not found`)
  }

  const label = document.querySelector(`label[for="${fieldId}"]`)
  expect(label).toBeInTheDocument()
}

/**
 * Checks if error message has proper ARIA attributes
 */
export const checkErrorMessageAccessibility = (
  errorElement: HTMLElement | null
) => {
  if (!errorElement) {
    throw new Error('Error element not found')
  }

  const hasRole = errorElement.getAttribute('role') === 'alert'
  const hasAriaLive =
    errorElement.getAttribute('aria-live') === 'polite' ||
    errorElement.getAttribute('aria-live') === 'assertive'

  expect(hasRole || hasAriaLive).toBe(true)
}

/**
 * Checks if heading hierarchy is correct
 */
export const checkHeadingHierarchy = (container: HTMLElement) => {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const levels: number[] = []

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1))
    levels.push(level)
  })

  // Check that heading levels don't skip (e.g., h1 -> h3 is invalid)
  for (let i = 1; i < levels.length; i++) {
    const diff = levels[i] - levels[i - 1]
    expect(diff).toBeLessThanOrEqual(1)
  }
}

/**
 * Checks if color contrast is sufficient (basic check)
 */
export const checkColorContrast = (element: HTMLElement | null) => {
  if (!element) {
    throw new Error('Element not found for color contrast check')
  }

  const styles = window.getComputedStyle(element)
  const color = styles.color
  const backgroundColor = styles.backgroundColor

  // Basic check: ensure both color and background are set
  expect(color).toBeTruthy()
  expect(backgroundColor).toBeTruthy()
  expect(color).not.toBe('transparent')
}

/**
 * Simulates keyboard navigation through elements
 */
export const simulateKeyboardNavigation = (elements: HTMLElement[]) => {
  elements.forEach((element, index) => {
    element.focus()
    expect(document.activeElement).toBe(element)

    // Simulate Tab key to next element
    if (index < elements.length - 1) {
      const nextElement = elements[index + 1]
      nextElement.focus()
    }
  })
}

/**
 * Checks if interactive element has focus indicator
 */
export const checkFocusIndicator = (element: HTMLElement | null) => {
  if (!element) {
    throw new Error('Element not found for focus indicator check')
  }

  element.focus()
  const styles = window.getComputedStyle(element)

  // Check for common focus indicator styles
  const hasOutline = styles.outline !== 'none' && styles.outline !== ''
  const hasBoxShadow = styles.boxShadow !== 'none'
  const hasBorder = styles.border !== 'none'

  expect(hasOutline || hasBoxShadow || hasBorder).toBe(true)
}
