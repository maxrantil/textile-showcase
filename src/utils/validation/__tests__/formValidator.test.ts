// ABOUTME: Unit tests for validateField, validateForm, createDebouncedValidator, and FormValidator class

import {
  validateField,
  validateForm,
  createDebouncedValidator,
  FormValidator,
} from '../formValidator'
import type { FormValidationRules } from '../types'

const contactRules: FormValidationRules = {
  name: { required: true, minLength: 2, maxLength: 100 },
  email: { required: true, maxLength: 254 },
  message: { required: true, minLength: 10, maxLength: 2000 },
}

describe('validateField', () => {
  describe('required validation', () => {
    it('returns invalid for empty required field', () => {
      const result = validateField('', { required: true })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This field is required')
    })

    it('returns valid for non-empty required field', () => {
      expect(validateField('hello', { required: true }).isValid).toBe(true)
    })

    it('skips further validation when required fails', () => {
      // minLength 10 — but required fails first
      const result = validateField('', { required: true, minLength: 10 })
      expect(result.error).toBe('This field is required')
    })
  })

  describe('optional empty field', () => {
    it('returns valid for empty optional field', () => {
      expect(validateField('', { required: false }).isValid).toBe(true)
    })

    it('skips length/email/pattern checks for empty optional field', () => {
      // Would fail email format if checked
      const result = validateField('', { required: false, minLength: 5 })
      expect(result.isValid).toBe(true)
    })
  })

  describe('minLength validation', () => {
    it('returns invalid when value is too short', () => {
      const result = validateField('a', { minLength: 2 })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be at least 2 characters')
    })

    it('returns valid when value meets minimum length', () => {
      expect(validateField('ab', { minLength: 2 }).isValid).toBe(true)
    })
  })

  describe('maxLength validation', () => {
    it('returns invalid when value is too long', () => {
      const result = validateField('abcde', { maxLength: 3 })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be no more than 3 characters')
    })

    it('returns valid when value is within max length', () => {
      expect(validateField('ab', { maxLength: 5 }).isValid).toBe(true)
    })
  })

  describe('email validation (fieldName="email")', () => {
    it('returns invalid for bad email when fieldName is email', () => {
      const result = validateField('notanemail', {}, 'email')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please enter a valid email address')
    })

    it('returns valid for correct email when fieldName is email', () => {
      expect(validateField('user@example.com', {}, 'email').isValid).toBe(true)
    })

    it('does not apply email validation for other field names', () => {
      // 'notanemail' is not validated as email for fieldName='name'
      expect(validateField('notanemail', {}, 'name').isValid).toBe(true)
    })
  })

  describe('phone validation (fieldName="phone")', () => {
    it('returns invalid for bad phone when fieldName is phone', () => {
      const result = validateField('not-a-phone-number-letters', {}, 'phone')
      expect(result.isValid).toBe(false)
    })

    it('returns valid for digits-only phone', () => {
      expect(validateField('12345678901', {}, 'phone').isValid).toBe(true)
    })
  })

  describe('pattern validation', () => {
    it('returns invalid when pattern does not match', () => {
      const result = validateField('ABC', { pattern: /^[a-z]+$/ }, 'code')
      expect(result.isValid).toBe(false)
    })

    it('returns valid when pattern matches', () => {
      expect(validateField('abc', { pattern: /^[a-z]+$/ }, 'code').isValid).toBe(true)
    })
  })

  describe('custom validation', () => {
    it('applies custom validator', () => {
      const custom = (v: string) =>
        v === 'secret'
          ? { isValid: true }
          : { isValid: false, error: 'Wrong value' }

      expect(validateField('secret', { custom }).isValid).toBe(true)
      const result = validateField('other', { custom })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Wrong value')
    })
  })

  describe('valid field returns no error', () => {
    it('returns { isValid: true } with no error for fully valid input', () => {
      const result = validateField('John', { required: true, minLength: 2, maxLength: 100 })
      expect(result).toEqual({ isValid: true })
    })
  })
})

describe('validateForm', () => {
  it('returns isValid true when all fields are valid', () => {
    const result = validateForm(
      { name: 'John', email: 'john@example.com', message: 'Hello world this is my message' },
      contactRules
    )
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('returns isValid false when name is missing', () => {
    const result = validateForm(
      { name: '', email: 'john@example.com', message: 'Valid message content here' },
      contactRules
    )
    expect(result.isValid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })

  it('returns isValid false when email is invalid', () => {
    const result = validateForm(
      { name: 'John', email: 'notanemail', message: 'Valid message content here' },
      contactRules
    )
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeDefined()
  })

  it('returns isValid false when message is too short', () => {
    const result = validateForm(
      { name: 'John', email: 'john@example.com', message: 'Short' },
      contactRules
    )
    expect(result.isValid).toBe(false)
    expect(result.errors.message).toBeDefined()
  })

  it('collects all errors from multiple invalid fields', () => {
    const result = validateForm(
      { name: '', email: 'bad', message: '' },
      contactRules
    )
    expect(result.isValid).toBe(false)
    expect(Object.keys(result.errors).length).toBeGreaterThan(1)
  })

  it('treats missing field as empty string', () => {
    const result = validateForm({}, contactRules)
    expect(result.isValid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })
})

describe('createDebouncedValidator', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('calls onValidation after debounce delay', () => {
    const onValidation = jest.fn()
    const debouncedValidate = createDebouncedValidator(contactRules, onValidation, 300)

    debouncedValidate('name', 'John')
    expect(onValidation).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)
    expect(onValidation).toHaveBeenCalledWith('name', expect.objectContaining({ isValid: true }))
  })

  it('debounces multiple rapid calls — only fires once', () => {
    const onValidation = jest.fn()
    const debouncedValidate = createDebouncedValidator(contactRules, onValidation, 300)

    debouncedValidate('name', 'J')
    debouncedValidate('name', 'Jo')
    debouncedValidate('name', 'John')

    jest.advanceTimersByTime(300)
    expect(onValidation).toHaveBeenCalledTimes(1)
    expect(onValidation).toHaveBeenCalledWith('name', expect.anything())
  })

  it('does not call onValidation for unknown field', () => {
    const onValidation = jest.fn()
    const debouncedValidate = createDebouncedValidator(contactRules, onValidation)

    debouncedValidate('unknownField', 'value')
    jest.advanceTimersByTime(500)
    expect(onValidation).not.toHaveBeenCalled()
  })

  it('uses 300ms default debounce when not specified', () => {
    const onValidation = jest.fn()
    const debouncedValidate = createDebouncedValidator(contactRules, onValidation)

    debouncedValidate('name', 'John')
    jest.advanceTimersByTime(299)
    expect(onValidation).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(onValidation).toHaveBeenCalledTimes(1)
  })
})

describe('FormValidator class', () => {
  let validator: FormValidator

  beforeEach(() => {
    validator = new FormValidator(contactRules)
  })

  describe('validateField', () => {
    it('returns valid result for valid field value', () => {
      const result = validator.validateField('name', 'John')
      expect(result.isValid).toBe(true)
    })

    it('returns invalid result for invalid field value', () => {
      const result = validator.validateField('name', '')
      expect(result.isValid).toBe(false)
    })

    it('stores error in internal state when field is invalid', () => {
      validator.validateField('name', '')
      expect(validator.getFieldError('name')).toBeDefined()
    })

    it('clears error from internal state when field becomes valid', () => {
      validator.validateField('name', '')
      validator.validateField('name', 'John')
      expect(validator.getFieldError('name')).toBeUndefined()
    })

    it('returns { isValid: true } for unknown field', () => {
      const result = validator.validateField('nonexistent', 'value')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateForm', () => {
    it('returns isValid true for all-valid form data', () => {
      const result = validator.validateForm({
        name: 'John',
        email: 'john@example.com',
        message: 'Hello world this is a valid message',
      })
      expect(result.isValid).toBe(true)
    })

    it('returns isValid false for invalid form data', () => {
      const result = validator.validateForm({ name: '', email: '', message: '' })
      expect(result.isValid).toBe(false)
    })

    it('updates internal errors state', () => {
      validator.validateForm({ name: '', email: '', message: '' })
      expect(validator.getErrors()).not.toEqual({})
    })
  })

  describe('isFormValid', () => {
    it('returns true initially (no validation run)', () => {
      expect(validator.isFormValid()).toBe(true)
    })

    it('returns false after invalid field is set', () => {
      validator.validateField('name', '')
      expect(validator.isFormValid()).toBe(false)
    })

    it('returns true after all errors are resolved', () => {
      validator.validateField('name', '')
      validator.validateField('name', 'John')
      expect(validator.isFormValid()).toBe(true)
    })
  })

  describe('getErrors', () => {
    it('returns empty object initially', () => {
      expect(validator.getErrors()).toEqual({})
    })

    it('returns copy of errors (not reference)', () => {
      validator.validateField('name', '')
      const errors = validator.getErrors()
      errors.name = 'mutated'
      expect(validator.getFieldError('name')).not.toBe('mutated')
    })
  })

  describe('getFieldError', () => {
    it('returns undefined for field with no error', () => {
      expect(validator.getFieldError('name')).toBeUndefined()
    })

    it('returns error message for invalid field', () => {
      validator.validateField('email', 'notanemail')
      expect(validator.getFieldError('email')).toBe('Please enter a valid email address')
    })
  })

  describe('reset', () => {
    it('clears all errors', () => {
      validator.validateField('name', '')
      validator.reset()
      expect(validator.getErrors()).toEqual({})
    })

    it('resets isFormValid to true', () => {
      validator.validateField('name', '')
      validator.reset()
      expect(validator.isFormValid()).toBe(true)
    })
  })
})
