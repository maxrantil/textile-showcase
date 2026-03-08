// ABOUTME: Unit tests for core field validators and commonValidationRules

import { validators, commonValidationRules } from '../validators'

describe('validators', () => {
  describe('required', () => {
    it('returns valid for non-empty string', () => {
      expect(validators.required('hello').isValid).toBe(true)
    })

    it('returns invalid for empty string', () => {
      const result = validators.required('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This field is required')
    })

    it('returns invalid for whitespace-only string', () => {
      const result = validators.required('   ')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This field is required')
    })

    it('returns valid for string with surrounding whitespace and content', () => {
      expect(validators.required('  a  ').isValid).toBe(true)
    })

    it('returns no error when valid', () => {
      expect(validators.required('hello').error).toBeUndefined()
    })
  })

  describe('minLength', () => {
    it('returns valid when length equals minimum', () => {
      expect(validators.minLength('abc', 3).isValid).toBe(true)
    })

    it('returns valid when length exceeds minimum', () => {
      expect(validators.minLength('abcdef', 3).isValid).toBe(true)
    })

    it('returns invalid when trimmed length is below minimum', () => {
      const result = validators.minLength('ab', 3)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be at least 3 characters')
    })

    it('trims value before length check', () => {
      // '  a  ' trims to 'a' (length 1), which is < 3
      expect(validators.minLength('  a  ', 3).isValid).toBe(false)
    })

    it('error message includes minLength value', () => {
      expect(validators.minLength('x', 10).error).toBe(
        'Must be at least 10 characters'
      )
    })
  })

  describe('maxLength', () => {
    it('returns valid when length equals maximum', () => {
      expect(validators.maxLength('abc', 3).isValid).toBe(true)
    })

    it('returns valid when length is below maximum', () => {
      expect(validators.maxLength('ab', 3).isValid).toBe(true)
    })

    it('returns invalid when length exceeds maximum', () => {
      const result = validators.maxLength('abcd', 3)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Must be no more than 3 characters')
    })

    it('does not trim before length check', () => {
      // '  a  ' is length 5, max 3 → invalid
      expect(validators.maxLength('  a  ', 3).isValid).toBe(false)
    })
  })

  describe('email', () => {
    it('returns valid for standard email', () => {
      expect(validators.email('user@example.com').isValid).toBe(true)
    })

    it('returns valid for email with subdomain', () => {
      expect(validators.email('user@mail.example.co.uk').isValid).toBe(true)
    })

    it('returns invalid when missing @', () => {
      const result = validators.email('userexample.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please enter a valid email address')
    })

    it('returns invalid when missing domain', () => {
      expect(validators.email('user@').isValid).toBe(false)
    })

    it('returns invalid when missing TLD', () => {
      expect(validators.email('user@example').isValid).toBe(false)
    })

    it('trims value before validation', () => {
      expect(validators.email('  user@example.com  ').isValid).toBe(true)
    })

    it('returns no error when valid', () => {
      expect(validators.email('a@b.c').error).toBeUndefined()
    })
  })

  describe('pattern', () => {
    it('returns valid when value matches pattern', () => {
      expect(validators.pattern('abc123', /^[a-z0-9]+$/, 'Invalid').isValid).toBe(true)
    })

    it('returns invalid when value does not match pattern', () => {
      const result = validators.pattern('ABC', /^[a-z]+$/, 'Lowercase only')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Lowercase only')
    })

    it('uses provided error message', () => {
      const msg = 'Custom error message'
      expect(validators.pattern('!', /^[a-z]+$/, msg).error).toBe(msg)
    })

    it('returns no error when valid', () => {
      expect(validators.pattern('abc', /^[a-z]+$/, 'err').error).toBeUndefined()
    })
  })

  describe('phone', () => {
    it('returns valid for empty string (optional field)', () => {
      expect(validators.phone('').isValid).toBe(true)
    })

    it('returns valid for whitespace-only (optional)', () => {
      expect(validators.phone('   ').isValid).toBe(true)
    })

    it('returns valid for digits-only phone', () => {
      expect(validators.phone('12345678901').isValid).toBe(true)
    })

    it('returns valid for phone with +, spaces, dashes, parens', () => {
      expect(validators.phone('+1 (555) 123-4567').isValid).toBe(true)
    })

    it('returns invalid for phone with letters', () => {
      const result = validators.phone('abc123')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please enter a valid phone number')
    })

    it('returns no error when valid non-empty phone', () => {
      expect(validators.phone('12345').error).toBeUndefined()
    })
  })

  describe('url', () => {
    it('returns valid for http URL', () => {
      expect(validators.url('http://example.com').isValid).toBe(true)
    })

    it('returns valid for https URL', () => {
      expect(validators.url('https://example.com/path?q=1').isValid).toBe(true)
    })

    it('returns invalid for plain string', () => {
      const result = validators.url('not-a-url')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please enter a valid URL')
    })

    it('returns invalid for empty string', () => {
      expect(validators.url('').isValid).toBe(false)
    })

    it('returns no error for valid URL', () => {
      expect(validators.url('https://example.com').error).toBeUndefined()
    })
  })

  describe('custom', () => {
    it('delegates to the provided validator function', () => {
      const fn = jest.fn(() => ({ isValid: true }))
      validators.custom('value', fn)
      expect(fn).toHaveBeenCalledWith('value')
    })

    it('returns the result of the validator function', () => {
      const fn = () => ({ isValid: false, error: 'Custom error' })
      expect(validators.custom('x', fn)).toEqual({ isValid: false, error: 'Custom error' })
    })
  })
})

describe('commonValidationRules', () => {
  it('name is required with minLength 2 and maxLength 100', () => {
    expect(commonValidationRules.name.required).toBe(true)
    expect(commonValidationRules.name.minLength).toBe(2)
    expect(commonValidationRules.name.maxLength).toBe(100)
  })

  it('email is required with maxLength 254', () => {
    expect(commonValidationRules.email.required).toBe(true)
    expect(commonValidationRules.email.maxLength).toBe(254)
  })

  it('message is required with minLength 10 and maxLength 2000', () => {
    expect(commonValidationRules.message.required).toBe(true)
    expect(commonValidationRules.message.minLength).toBe(10)
    expect(commonValidationRules.message.maxLength).toBe(2000)
  })

  it('phone is not required', () => {
    expect(commonValidationRules.phone.required).toBeFalsy()
  })

  it('company is not required with maxLength 100', () => {
    expect(commonValidationRules.company.required).toBeFalsy()
    expect(commonValidationRules.company.maxLength).toBe(100)
  })

  it('subject is not required with maxLength 200', () => {
    expect(commonValidationRules.subject.required).toBeFalsy()
    expect(commonValidationRules.subject.maxLength).toBe(200)
  })
})
