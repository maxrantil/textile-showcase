// src/utils/validation/types.ts

export interface ValidationResult {
    isValid: boolean
    error?: string
  }
  
  export interface FieldValidationRule {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: string) => ValidationResult
  }
  
  export interface FormValidationRules {
    [fieldName: string]: FieldValidationRule
  }
  
  export interface FormErrors {
    [fieldName: string]: string
  }
  
  export interface FormValidationResult {
    isValid: boolean
    errors: FormErrors
  }
  
  export type ValidatorFunction = (value: string, rule?: FieldValidationRule) => ValidationResult
