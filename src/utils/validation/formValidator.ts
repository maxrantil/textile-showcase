// src/utils/validation/formValidator.ts
import { validators } from './validators'
import type {
  FormValidationRules,
  FormValidationResult,
  FormErrors,
  FieldValidationRule,
  ValidationResult,
} from './types'

/**
 * Validate a single field against its rules
 */
export function validateField(
  value: string,
  rules: FieldValidationRule,
  fieldName?: string
): ValidationResult {
  // Required validation
  if (rules.required) {
    const requiredResult = validators.required(value)
    if (!requiredResult.isValid) {
      return requiredResult
    }
  }

  // Skip other validations if field is empty and not required
  if (!rules.required && value.trim().length === 0) {
    return { isValid: true }
  }

  // Minimum length validation
  if (rules.minLength !== undefined) {
    const minLengthResult = validators.minLength(value, rules.minLength)
    if (!minLengthResult.isValid) {
      return minLengthResult
    }
  }

  // Maximum length validation
  if (rules.maxLength !== undefined) {
    const maxLengthResult = validators.maxLength(value, rules.maxLength)
    if (!maxLengthResult.isValid) {
      return maxLengthResult
    }
  }

  // Email validation (special case)
  if (fieldName === 'email') {
    const emailResult = validators.email(value)
    if (!emailResult.isValid) {
      return emailResult
    }
  }

  // Phone validation (special case)
  if (fieldName === 'phone') {
    const phoneResult = validators.phone(value)
    if (!phoneResult.isValid) {
      return phoneResult
    }
  }

  // Pattern validation
  if (rules.pattern) {
    const patternResult = validators.pattern(
      value,
      rules.pattern,
      `Please enter a valid ${fieldName || 'value'}`
    )
    if (!patternResult.isValid) {
      return patternResult
    }
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(value)
    if (!customResult.isValid) {
      return customResult
    }
  }

  return { isValid: true }
}

/**
 * Validate entire form against validation rules
 */
export function validateForm(
  formData: Record<string, string>,
  validationRules: FormValidationRules
): FormValidationResult {
  const errors: FormErrors = {}
  let isValid = true

  // Validate each field
  for (const [fieldName, fieldRules] of Object.entries(validationRules)) {
    const fieldValue = formData[fieldName] || ''
    const fieldResult = validateField(fieldValue, fieldRules, fieldName)

    if (!fieldResult.isValid && fieldResult.error) {
      errors[fieldName] = fieldResult.error
      isValid = false
    }
  }

  return { isValid, errors }
}

/**
 * Debounced field validation for real-time feedback
 */
export function createDebouncedValidator(
  validationRules: FormValidationRules,
  onValidation: (fieldName: string, result: ValidationResult) => void,
  debounceMs: number = 300
) {
  const timeouts: Record<string, NodeJS.Timeout> = {}

  return function debouncedValidate(fieldName: string, value: string) {
    // Clear existing timeout
    if (timeouts[fieldName]) {
      clearTimeout(timeouts[fieldName])
    }

    // Set new timeout
    timeouts[fieldName] = setTimeout(() => {
      const rules = validationRules[fieldName]
      if (rules) {
        const result = validateField(value, rules, fieldName)
        onValidation(fieldName, result)
      }
    }, debounceMs)
  }
}

/**
 * Form validation hooks for React components
 */
export class FormValidator<
  T extends Record<string, string> = Record<string, string>,
> {
  private rules: FormValidationRules
  private errors: FormErrors = {}
  private isValid: boolean = true

  constructor(rules: FormValidationRules) {
    this.rules = rules
  }

  validateField(fieldName: string, value: string): ValidationResult {
    const rules = this.rules[fieldName]
    if (!rules) return { isValid: true }

    const result = validateField(value, rules, fieldName)

    // Update internal state
    if (result.error) {
      this.errors[fieldName] = result.error
    } else {
      delete this.errors[fieldName]
    }

    this.isValid = Object.keys(this.errors).length === 0
    return result
  }

  validateForm(formData: T): FormValidationResult {
    // Convert formData to Record<string, string> for validation
    const stringFormData: Record<string, string> = {}
    for (const [key, value] of Object.entries(formData)) {
      stringFormData[key] = String(value)
    }

    const result = validateForm(stringFormData, this.rules)
    this.errors = result.errors
    this.isValid = result.isValid
    return result
  }

  getErrors(): FormErrors {
    return { ...this.errors }
  }

  getFieldError(fieldName: string): string | undefined {
    return this.errors[fieldName]
  }

  isFormValid(): boolean {
    return this.isValid
  }

  reset(): void {
    this.errors = {}
    this.isValid = true
  }
}
