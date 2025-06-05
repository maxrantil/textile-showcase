// src/utils/validation/validators.ts
import type { ValidationResult } from './types'

/**
 * Core field validators
 */
export const validators = {
  /**
   * Required field validator
   */
  required: (value: string): ValidationResult => {
    const trimmed = value.trim()
    return {
      isValid: trimmed.length > 0,
      error: trimmed.length === 0 ? 'This field is required' : undefined
    }
  },

  /**
   * Minimum length validator
   */
  minLength: (value: string, minLength: number): ValidationResult => {
    const trimmed = value.trim()
    return {
      isValid: trimmed.length >= minLength,
      error: trimmed.length < minLength ? `Must be at least ${minLength} characters` : undefined
    }
  },

  /**
   * Maximum length validator
   */
  maxLength: (value: string, maxLength: number): ValidationResult => {
    return {
      isValid: value.length <= maxLength,
      error: value.length > maxLength ? `Must be no more than ${maxLength} characters` : undefined
    }
  },

  /**
   * Email validator
   */
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmed = value.trim()
    return {
      isValid: emailRegex.test(trimmed),
      error: !emailRegex.test(trimmed) ? 'Please enter a valid email address' : undefined
    }
  },

  /**
   * Pattern validator
   */
  pattern: (value: string, pattern: RegExp, errorMessage: string): ValidationResult => {
    return {
      isValid: pattern.test(value),
      error: !pattern.test(value) ? errorMessage : undefined
    }
  },

  /**
   * Phone number validator
   */
  phone: (value: string): ValidationResult => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/
    const trimmed = value.trim()
    return {
      isValid: trimmed.length === 0 || phoneRegex.test(trimmed), // Optional field
      error: trimmed.length > 0 && !phoneRegex.test(trimmed) ? 'Please enter a valid phone number' : undefined
    }
  },

  /**
   * URL validator
   */
  url: (value: string): ValidationResult => {
    try {
      new URL(value)
      return { isValid: true }
    } catch {
      return {
        isValid: false,
        error: 'Please enter a valid URL'
      }
    }
  },

  /**
   * Custom validator wrapper
   */
  custom: (value: string, validatorFn: (value: string) => ValidationResult): ValidationResult => {
    return validatorFn(value)
  }
}

/**
 * Predefined validation rules for common form fields
 */
export const commonValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    required: true,
    maxLength: 254
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 2000
  },
  phone: {
    required: false,
    minLength: 10,
    maxLength: 20
  },
  company: {
    required: false,
    maxLength: 100
  },
  subject: {
    required: false,
    maxLength: 200
  }
}
