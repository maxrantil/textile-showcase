// ABOUTME: Mock form data for testing contact forms and other form components

export const mockValidFormData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  message:
    'I would like to inquire about your textile designs. They are absolutely beautiful!',
}

export const mockInvalidFormData = {
  empty: {
    name: '',
    email: '',
    message: '',
  },
  invalidEmail: {
    name: 'John Doe',
    email: 'not-an-email',
    message: 'This has an invalid email address',
  },
  invalidEmailFormats: [
    'plaintext',
    '@example.com',
    'user@',
    'user@domain',
    'user name@example.com',
    'user@domain..com',
  ],
  shortMessage: {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hi', // Too short (< 10 characters)
  },
  longMessage: {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'A'.repeat(5001), // Too long (> 5000 characters)
  },
  longName: {
    name: 'A'.repeat(101), // Too long (> 100 characters)
    email: 'john@example.com',
    message: 'This is a valid message',
  },
  longEmail: {
    name: 'John Doe',
    email: 'a'.repeat(245) + '@example.com', // Too long (> 254 characters)
    message: 'This is a valid message',
  },
}

export const mockFormValidationErrors = {
  name: {
    required: 'Name is required',
    tooLong: 'Name must be less than 100 characters',
  },
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
    tooLong: 'Email must be less than 254 characters',
  },
  message: {
    required: 'Message is required',
    tooShort: 'Message must be at least 10 characters',
    tooLong: 'Message must be less than 5000 characters',
  },
}

export const mockFormSuccessResponse = {
  success: true,
  message: 'Your message has been sent successfully!',
}

export const mockFormErrorResponses = {
  serverError: {
    ok: false,
    status: 500,
    json: async () => ({ error: 'Internal server error' }),
  },
  validationError: {
    ok: false,
    status: 400,
    json: async () => ({ error: 'Validation failed', fields: ['email'] }),
  },
  rateLimitError: {
    ok: false,
    status: 429,
    json: async () => ({ error: 'Too many requests' }),
  },
  networkError: new Error('Network request failed'),
}

export const mockFormWithHtml = {
  name: '<script>alert("xss")</script>John',
  email: 'john@example.com',
  message: '<b>Bold text</b> and <script>malicious code</script>',
}

export const mockFormWithWhitespace = {
  name: '  John Doe  ',
  email: '  john@example.com  ',
  message: '  This message has leading and trailing whitespace  ',
}

export const mockFormTrimmedExpected = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'This message has leading and trailing whitespace',
}
