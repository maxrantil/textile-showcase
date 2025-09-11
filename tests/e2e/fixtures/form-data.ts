// ABOUTME: Contact form test data and validation scenarios for E2E testing
export interface ContactFormData {
  name: string
  email: string
  message: string
  subject?: string
}

export const validFormData: ContactFormData = {
  name: 'E2E Test User',
  email: 'e2e.test@example.com',
  message:
    'This is a test message from the E2E test suite for the textile portfolio contact form. Testing comprehensive form submission workflow.',
  subject: 'E2E Test Inquiry',
}

export const invalidFormData = {
  emptyFields: {
    name: '',
    email: '',
    message: '',
  },
  invalidEmail: {
    name: 'Test User',
    email: 'invalid-email-format',
    message: 'Test message with invalid email',
  },
  shortMessage: {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Too short',
  },
  longMessage: {
    name: 'Test User',
    email: 'test@example.com',
    message: 'A'.repeat(5001), // Exceeds typical message length limits
  },
}

export const specialCharacterData: ContactFormData = {
  name: 'Åse Müller-Øland',
  email: 'ase.muller@textile-design.co.uk',
  message:
    'Interested in your sustainable textile collection. Can we discuss collaboration opportunities? Looking forward to your response! 🧵✨',
}

export const formValidationScenarios = [
  {
    name: 'Valid submission',
    data: validFormData,
    shouldSucceed: true,
    expectedResult: 'success',
  },
  {
    name: 'Empty fields validation',
    data: invalidFormData.emptyFields,
    shouldSucceed: false,
    expectedResult: 'validation-error',
  },
  {
    name: 'Invalid email format',
    data: invalidFormData.invalidEmail,
    shouldSucceed: false,
    expectedResult: 'email-validation-error',
  },
  {
    name: 'Special characters support',
    data: specialCharacterData,
    shouldSucceed: true,
    expectedResult: 'success',
  },
]
