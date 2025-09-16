// ABOUTME: Certificate template management for different trust levels
// Implements certificate templates with constraints for CRITICAL, HIGH, and MEDIUM trust agents

import {
  TrustLevel,
  CertificateTemplate,
  PKIConfiguration,
  ValidationLevel,
} from '../types/pki-types'

export class CertificateTemplateManager {
  private templates: Map<TrustLevel, CertificateTemplate>

  constructor(private config: PKIConfiguration) {
    this.templates = new Map()
    this.initializeTemplates()
  }

  public getTemplate(trustLevel: TrustLevel): CertificateTemplate {
    if (trustLevel === 'LOW') {
      throw new Error('LOW trust level agents do not require certificates')
    }

    const template = this.templates.get(trustLevel)
    if (!template) {
      throw new Error(
        `No certificate template found for trust level: ${trustLevel}`
      )
    }

    return template
  }

  public getAllTemplates(): Map<TrustLevel, CertificateTemplate> {
    return new Map(this.templates)
  }

  public updateTemplate(
    trustLevel: TrustLevel,
    template: CertificateTemplate
  ): void {
    if (trustLevel === 'LOW') {
      throw new Error('Cannot create template for LOW trust level')
    }

    this.templates.set(trustLevel, template)
  }

  private initializeTemplates(): void {
    // CRITICAL trust level template - highest security
    this.templates.set('CRITICAL', {
      trustLevel: 'CRITICAL',
      keyUsage: ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT'],
      extendedKeyUsage: ['CLIENT_AUTH', 'CODE_SIGNING'],
      validityPeriod: 365, // 1 year for critical
      keySize: 4096,
      subjectAltNames: [],
      constraints: {
        allowedCapabilities: [
          'SYSTEM_ADMIN',
          'KEY_MANAGEMENT',
          'SECURITY_AUDIT',
          'CERTIFICATE_SIGNING',
          'CRITICAL_OPERATIONS',
        ],
        requiredValidation: 'STRICT',
        maxPathLength: 0, // End entity only
      },
    })

    // HIGH trust level template - enhanced security
    this.templates.set('HIGH', {
      trustLevel: 'HIGH',
      keyUsage: ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT'],
      extendedKeyUsage: ['CLIENT_AUTH'],
      validityPeriod: 730, // 2 years for high
      keySize: 2048,
      subjectAltNames: [],
      constraints: {
        allowedCapabilities: [
          'DATA_PROCESSING',
          'SECURE_COMMUNICATION',
          'MONITORING',
          'PERFORMANCE_ANALYSIS',
          'CERTIFICATE_SIGNING', // For intermediate CA
          'TESTING',
          'INTEGRATION_TESTING',
          'PERFORMANCE_TESTING',
        ],
        requiredValidation: 'ENHANCED',
        maxPathLength: 1, // Can sign certificates for others
      },
    })

    // MEDIUM trust level template - standard security
    this.templates.set('MEDIUM', {
      trustLevel: 'MEDIUM',
      keyUsage: ['DIGITAL_SIGNATURE'],
      extendedKeyUsage: ['CLIENT_AUTH'],
      validityPeriod: 1095, // 3 years for medium
      keySize: 2048,
      subjectAltNames: [],
      constraints: {
        allowedCapabilities: [
          'BASIC_OPERATIONS',
          'STANDARD_COMMUNICATION',
          'READ_ONLY_ACCESS',
          'REPORTING',
          'TESTING',
          'PARALLEL_TESTING',
        ],
        requiredValidation: 'STANDARD',
        maxPathLength: 0, // End entity only
      },
    })
  }

  public validateCapabilities(
    requestedCapabilities: string[],
    trustLevel: TrustLevel
  ): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(trustLevel)
    const errors: string[] = []

    for (const capability of requestedCapabilities) {
      if (!template.constraints.allowedCapabilities.includes(capability)) {
        errors.push(
          `Capability '${capability}' not allowed for trust level '${trustLevel}'`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  public getValidityPeriodDays(trustLevel: TrustLevel): number {
    return this.getTemplate(trustLevel).validityPeriod
  }

  public getRequiredKeySize(trustLevel: TrustLevel): number {
    return this.getTemplate(trustLevel).keySize
  }

  public getValidationLevel(trustLevel: TrustLevel): ValidationLevel {
    return this.getTemplate(trustLevel).constraints.requiredValidation
  }
}
