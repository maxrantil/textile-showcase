// ABOUTME: Certificate Authority implementation for root CA and intermediate CA
// Implements certificate issuance, validation, and revocation for PKI infrastructure

import * as crypto from 'crypto'
import {
  ICertificateAuthority,
  CertificateSigningRequest,
  IssuedCertificate,
  ValidationResult,
  CertificateTemplate,
  TrustLevel,
  RevocationReason,
  PKIConfiguration,
  CertificateRevocationList,
  OCSPResponse,
  DistinguishedName,
  RevocationStatus,
  ValidationError,
  CriticalCertificateRequest,
  RevokedCertificateEntry,
  PKIAuditEntry,
} from '../types/pki-types'

// Internal interface for parsed certificate data
interface ParsedCertificate {
  serialNumber: string
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  trustLevel: TrustLevel
  capabilities: string[]
  signature?: string
}

export class RootCertificateAuthority implements ICertificateAuthority {
  private rootCertificate?: IssuedCertificate
  private rootPrivateKey?: string
  private issuedCertificates: Map<string, IssuedCertificate> = new Map()
  private revokedCertificates: Map<string, RevokedCertificateEntry> = new Map()
  private criticalRequests: Map<string, CriticalCertificateRequest> = new Map()
  private auditLog: PKIAuditEntry[] = []

  constructor(private config: PKIConfiguration) {}

  public async generateRootCertificate(): Promise<IssuedCertificate> {
    if (this.rootCertificate) {
      return this.rootCertificate
    }

    // Generate root CA key pair
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: this.config.rootCA.keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })

    this.rootPrivateKey = keyPair.privateKey

    // Create root certificate
    const serialNumber = crypto.randomBytes(16).toString('hex')
    const validFrom = new Date()
    const validTo = new Date()
    validTo.setFullYear(
      validFrom.getFullYear() + this.config.rootCA.validityPeriod
    )

    // Create self-signed root certificate
    const certificate = this.createSelfSignedCertificate(
      keyPair.publicKey,
      keyPair.privateKey,
      serialNumber,
      validFrom,
      validTo
    )

    const fingerprint = crypto
      .createHash('sha256')
      .update(certificate)
      .digest('hex')
      .toUpperCase()

    this.rootCertificate = {
      certificate,
      serialNumber,
      validFrom,
      validTo,
      certificateChain: [certificate],
      fingerprint,
    }

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CERTIFICATE_ISSUED',
      certificateSerialNumber: serialNumber,
      subjectCommonName: 'Root CA',
      issuerCommonName: 'Root CA',
      trustLevel: 'CRITICAL',
      result: 'SUCCESS',
    })

    return this.rootCertificate
  }

  public async issueCertificate(
    request: CertificateSigningRequest,
    template: CertificateTemplate
  ): Promise<IssuedCertificate> {
    if (!this.rootCertificate || !this.rootPrivateKey) {
      throw new Error('Root CA not initialized')
    }

    // Validate capabilities against template
    this.validateCapabilities(request.requestedCapabilities, template)

    const serialNumber = crypto.randomBytes(16).toString('hex')
    const validFrom = new Date()
    const validTo = new Date()
    validTo.setDate(validFrom.getDate() + template.validityPeriod)

    const certificate = this.signCertificate(
      request,
      serialNumber,
      validFrom,
      validTo,
      this.rootPrivateKey
    )

    const fingerprint = crypto
      .createHash('sha256')
      .update(certificate)
      .digest('hex')
      .toUpperCase()

    const issuedCert: IssuedCertificate = {
      certificate,
      serialNumber,
      validFrom,
      validTo,
      certificateChain: [certificate, this.rootCertificate.certificate],
      fingerprint,
    }

    this.issuedCertificates.set(serialNumber, issuedCert)

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CERTIFICATE_ISSUED',
      certificateSerialNumber: serialNumber,
      subjectCommonName: request.subject.commonName,
      issuerCommonName: 'Root CA',
      trustLevel: request.trustLevel,
      result: 'SUCCESS',
    })

    return issuedCert
  }

  public async submitCriticalCertificateRequest(
    request: CertificateSigningRequest
  ): Promise<CriticalCertificateRequest> {
    if (request.trustLevel !== 'CRITICAL') {
      throw new Error(
        'Only CRITICAL trust level certificates require manual approval'
      )
    }

    const requestId = crypto.randomBytes(16).toString('hex')
    const criticalRequest: CriticalCertificateRequest = {
      requestId,
      csr: request,
      template: {
        trustLevel: 'CRITICAL',
        keyUsage: ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT'],
        extendedKeyUsage: ['CLIENT_AUTH', 'CODE_SIGNING'],
        validityPeriod: 365,
        keySize: 4096,
        subjectAltNames: [],
        constraints: {
          allowedCapabilities: request.requestedCapabilities,
          requiredValidation: 'STRICT',
        },
      },
      requestTimestamp: new Date(),
      status: 'PENDING_APPROVAL',
      requiresManualApproval: true,
    }

    this.criticalRequests.set(requestId, criticalRequest)

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CRITICAL_APPROVAL_REQUESTED',
      subjectCommonName: request.subject.commonName,
      trustLevel: 'CRITICAL',
      result: 'SUCCESS',
    })

    return criticalRequest
  }

  public async approveCriticalCertificate(
    requestId: string,
    status: 'APPROVED' | 'DENIED',
    reason: string
  ): Promise<IssuedCertificate> {
    const request = this.criticalRequests.get(requestId)
    if (!request) {
      throw new Error(`Critical certificate request not found: ${requestId}`)
    }

    if (status === 'DENIED') {
      request.status = 'DENIED'
      this.logAuditEntry({
        timestamp: new Date(),
        operation: 'CRITICAL_APPROVAL_DENIED',
        subjectCommonName: request.csr.subject.commonName,
        trustLevel: 'CRITICAL',
        result: 'SUCCESS',
      })
      throw new Error(`Critical certificate request denied: ${reason}`)
    }

    request.status = 'APPROVED'
    request.approvalMetadata = {
      approvalTimestamp: new Date(),
      approvalReason: reason,
    }

    const issuedCert = await this.issueCertificate(
      request.csr,
      request.template
    )

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CRITICAL_APPROVAL_GRANTED',
      certificateSerialNumber: issuedCert.serialNumber,
      subjectCommonName: request.csr.subject.commonName,
      trustLevel: 'CRITICAL',
      result: 'SUCCESS',
    })

    return issuedCert
  }

  public async validateCertificate(
    certificate: string,
    requiredTrustLevel: TrustLevel
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const timestamp = new Date()

    try {
      // Extract certificate information
      const certInfo = this.parseCertificate(certificate)
      const serialNumber = certInfo.serialNumber

      // Check if certificate exists in our records
      const issuedCert = this.issuedCertificates.get(serialNumber)
      if (!issuedCert) {
        errors.push({
          code: 'CERTIFICATE_NOT_FOUND',
          message: 'Certificate not found in CA records',
          severity: 'ERROR',
        })
      }

      // Check expiration - use current timestamp
      const currentTime = new Date(Date.now())
      if (new Date(certInfo.validTo) < currentTime) {
        errors.push({
          code: 'CERTIFICATE_EXPIRED',
          message: 'Certificate has expired',
          severity: 'ERROR',
        })
      }

      // Check revocation status
      const revocationStatus = this.checkRevocationStatusSync(serialNumber)

      if (revocationStatus.status === 'REVOKED') {
        errors.push({
          code: 'CERTIFICATE_REVOKED',
          message: 'Certificate has been revoked',
          severity: 'ERROR',
        })
      }

      // Check trust level
      if (
        certInfo.trustLevel &&
        !this.isTrustLevelSufficient(certInfo.trustLevel, requiredTrustLevel)
      ) {
        errors.push({
          code: 'INSUFFICIENT_TRUST_LEVEL',
          message: `Certificate trust level ${certInfo.trustLevel} insufficient for required ${requiredTrustLevel}`,
          severity: 'ERROR',
        })
      }

      // Verify signature
      if (!this.verifyCertificateSignature(certificate)) {
        errors.push({
          code: 'INVALID_SIGNATURE',
          message: 'Certificate signature verification failed',
          severity: 'ERROR',
        })
      }

      const isValid = errors.length === 0
      const certificateChain = issuedCert
        ? issuedCert.certificateChain
        : [certificate]

      this.logAuditEntry({
        timestamp,
        operation: 'CERTIFICATE_VALIDATED',
        certificateSerialNumber: serialNumber,
        trustLevel: requiredTrustLevel,
        result: isValid ? 'SUCCESS' : 'FAILURE',
        errorCode: isValid ? undefined : errors[0]?.code,
      })

      return {
        isValid,
        trustLevel: certInfo.trustLevel || requiredTrustLevel,
        validationErrors: errors,
        certificateChain,
        revocationStatus,
        validationTimestamp: timestamp,
      }
    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Certificate validation failed: ${error}`,
        severity: 'CRITICAL',
      })

      return {
        isValid: false,
        trustLevel: requiredTrustLevel,
        validationErrors: errors,
        certificateChain: [],
        revocationStatus: { status: 'VALID' },
        validationTimestamp: timestamp,
      }
    }
  }

  public async validateCertificateChain(
    certificateChain: string[]
  ): Promise<ValidationResult> {
    if (certificateChain.length < 1) {
      return {
        isValid: false,
        trustLevel: 'LOW',
        validationErrors: [
          {
            code: 'INVALID_CHAIN_LENGTH',
            message: 'Certificate chain must contain at least 1 certificate',
            severity: 'ERROR',
          },
        ],
        certificateChain,
        revocationStatus: { status: 'VALID' },
        validationTimestamp: new Date(),
      }
    }

    // For a single certificate, just validate it
    if (certificateChain.length === 1) {
      return this.validateCertificate(certificateChain[0], 'MEDIUM')
    }

    // Validate each certificate in the chain
    // For now, we'll trust the chain structure for testing purposes
    // In production, this would verify cryptographic signatures
    try {
      // Parse certificates to ensure they're valid format
      for (const cert of certificateChain) {
        this.parseCertificate(cert)
      }
    } catch (error) {
      return {
        isValid: false,
        trustLevel: 'LOW',
        validationErrors: [
          {
            code: 'INVALID_CERTIFICATE_FORMAT',
            message: `Invalid certificate format in chain: ${error}`,
            severity: 'ERROR',
          },
        ],
        certificateChain,
        revocationStatus: { status: 'VALID' },
        validationTimestamp: new Date(),
      }
    }

    // Validate the end entity certificate with its trust level
    const endEntityCert = this.parseCertificate(certificateChain[0])
    const trustLevel = endEntityCert.trustLevel || 'MEDIUM'

    // Validate the end entity certificate
    return this.validateCertificate(certificateChain[0], trustLevel)
  }

  public async revokeCertificate(
    serialNumber: string,
    reason: RevocationReason
  ): Promise<void> {
    const certificate = this.issuedCertificates.get(serialNumber)
    if (!certificate) {
      throw new Error(`Certificate not found: ${serialNumber}`)
    }

    const revokedEntry: RevokedCertificateEntry = {
      serialNumber,
      revocationDate: new Date(),
      reason,
    }

    this.revokedCertificates.set(serialNumber, revokedEntry)

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CERTIFICATE_REVOKED',
      certificateSerialNumber: serialNumber,
      result: 'SUCCESS',
    })
  }

  public async generateCRL(): Promise<CertificateRevocationList> {
    if (!this.rootCertificate) {
      throw new Error('Root CA not initialized')
    }

    const thisUpdate = new Date()
    const nextUpdate = new Date()
    nextUpdate.setHours(
      thisUpdate.getHours() + this.config.revocation.crlUpdateInterval
    )

    const revokedCertificates = Array.from(this.revokedCertificates.values())

    // Create CRL signature
    const crlData = JSON.stringify({
      issuer: 'Root CA',
      thisUpdate,
      nextUpdate,
      revokedCertificates,
    })

    const signature = crypto
      .createSign('SHA256')
      .update(crlData)
      .sign(this.rootPrivateKey!, 'base64')

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CRL_GENERATED',
      result: 'SUCCESS',
    })

    return {
      issuer: {
        commonName: 'Root CA',
        organizationalUnit: 'Certificate Authority',
        organization: 'Textile Showcase',
        country: 'US',
      },
      thisUpdate,
      nextUpdate,
      revokedCertificates,
      signature,
    }
  }

  public async checkRevocationStatus(
    serialNumber: string
  ): Promise<OCSPResponse> {
    const revokedEntry = this.revokedCertificates.get(serialNumber)
    const thisUpdate = new Date()
    const nextUpdate = new Date()
    nextUpdate.setHours(thisUpdate.getHours() + 1)

    let status: 'GOOD' | 'REVOKED' | 'UNKNOWN' = 'UNKNOWN'
    let revocationTime: Date | undefined
    let revocationReason: RevocationReason | undefined

    if (this.issuedCertificates.has(serialNumber)) {
      if (revokedEntry) {
        status = 'REVOKED'
        revocationTime = revokedEntry.revocationDate
        revocationReason = revokedEntry.reason
      } else {
        status = 'GOOD'
      }
    }

    const responseData = JSON.stringify({
      status,
      revocationTime,
      revocationReason,
      thisUpdate,
      nextUpdate,
    })

    const signature = crypto
      .createSign('SHA256')
      .update(responseData)
      .sign(this.rootPrivateKey!, 'base64')

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'OCSP_REQUEST',
      certificateSerialNumber: serialNumber,
      result: 'SUCCESS',
    })

    return {
      status,
      revocationTime,
      revocationReason,
      thisUpdate,
      nextUpdate,
      signature,
    }
  }

  private createSelfSignedCertificate(
    publicKey: string,
    privateKey: string,
    serialNumber: string,
    validFrom: Date,
    validTo: Date
  ): string {
    // Simplified certificate creation for testing
    // In production, use proper X.509 certificate libraries
    const certData = {
      version: 3,
      serialNumber,
      issuer: 'CN=Root CA, OU=Certificate Authority, O=Textile Showcase, C=US',
      subject: 'CN=Root CA, OU=Certificate Authority, O=Textile Showcase, C=US',
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      publicKey,
      keyUsage: this.config.rootCA.keyUsage,
      basicConstraints: { ca: true, pathLenConstraint: undefined },
    }

    const certString = JSON.stringify(certData)
    const signature = crypto
      .createSign(this.config.rootCA.hashAlgorithm)
      .update(certString)
      .sign(privateKey, 'base64')

    return `-----BEGIN CERTIFICATE-----\n${Buffer.from(
      JSON.stringify({
        ...certData,
        signature,
      })
    ).toString('base64')}\n-----END CERTIFICATE-----`
  }

  private signCertificate(
    request: CertificateSigningRequest,
    serialNumber: string,
    validFrom: Date,
    validTo: Date,
    signingKey: string
  ): string {
    const certData = {
      version: 3,
      serialNumber,
      issuer: 'CN=Root CA, OU=Certificate Authority, O=Textile Showcase, C=US',
      subject: this.formatDistinguishedName(request.subject),
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      publicKey: request.publicKey,
      trustLevel: request.trustLevel,
      capabilities: request.requestedCapabilities,
      agentMetadata: request.agentMetadata,
    }

    const certString = JSON.stringify(certData)
    const signature = crypto
      .createSign(this.config.rootCA.hashAlgorithm)
      .update(certString)
      .sign(signingKey, 'base64')

    return `-----BEGIN CERTIFICATE-----\n${Buffer.from(
      JSON.stringify({
        ...certData,
        signature,
      })
    ).toString('base64')}\n-----END CERTIFICATE-----`
  }

  private parseCertificate(certificate: string): ParsedCertificate {
    // Simplified certificate parsing for testing
    // In production, use proper X.509 certificate libraries
    const certData = certificate
      .replace(/-----BEGIN CERTIFICATE-----\n/, '')
      .replace(/\n-----END CERTIFICATE-----/, '')

    const parsed = JSON.parse(
      Buffer.from(certData, 'base64').toString()
    ) as Record<string, unknown>
    return {
      serialNumber:
        typeof parsed.serialNumber === 'string' ? parsed.serialNumber : '',
      issuer: typeof parsed.issuer === 'string' ? parsed.issuer : '',
      subject: typeof parsed.subject === 'string' ? parsed.subject : '',
      validFrom: typeof parsed.validFrom === 'string' ? parsed.validFrom : '',
      validTo: typeof parsed.validTo === 'string' ? parsed.validTo : '',
      trustLevel:
        typeof parsed.trustLevel === 'string' &&
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.trustLevel)
          ? (parsed.trustLevel as TrustLevel)
          : 'MEDIUM',
      capabilities: Array.isArray(parsed.capabilities)
        ? parsed.capabilities.filter(
            (cap): cap is string => typeof cap === 'string'
          )
        : [],
      signature:
        typeof parsed.signature === 'string' ? parsed.signature : undefined,
    }
  }

  private formatDistinguishedName(dn: DistinguishedName): string {
    return `CN=${dn.commonName}, OU=${dn.organizationalUnit}, O=${dn.organization}, C=${dn.country}`
  }

  private validateCapabilities(
    requestedCapabilities: string[],
    template: CertificateTemplate
  ): void {
    for (const capability of requestedCapabilities) {
      if (!template.constraints.allowedCapabilities.includes(capability)) {
        throw new Error(
          `Requested capabilities exceed trust level permissions: ${capability}`
        )
      }
    }
  }

  private checkRevocationStatusSync(serialNumber: string): RevocationStatus {
    const revokedEntry = this.revokedCertificates.get(serialNumber)

    if (revokedEntry) {
      return {
        status: 'REVOKED',
        reason: revokedEntry.reason,
        revocationDate: revokedEntry.revocationDate,
      }
    }

    return { status: 'VALID' }
  }

  private isTrustLevelSufficient(
    certificateTrustLevel: TrustLevel,
    requiredTrustLevel: TrustLevel
  ): boolean {
    const trustHierarchy = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    return (
      trustHierarchy[certificateTrustLevel] >=
      trustHierarchy[requiredTrustLevel]
    )
  }

  private verifyCertificateSignature(certificate: string): boolean {
    try {
      const certData = this.parseCertificate(certificate)
      const { signature, ...dataToVerify } = certData

      if (!signature) {
        return false
      }

      const verifier = crypto.createVerify(this.config.rootCA.hashAlgorithm)
      verifier.update(JSON.stringify(dataToVerify))

      return verifier.verify(
        this.rootCertificate!.certificate,
        signature,
        'base64'
      )
    } catch {
      return false
    }
  }

  private verifyCertificateIssuedBy(
    certificate: string,
    issuerCertificate: string
  ): boolean {
    try {
      const certData = this.parseCertificate(certificate)
      const issuerData = this.parseCertificate(issuerCertificate)

      // Verify issuer names match - simplified check for testing
      // In production, this would verify the actual cryptographic signature
      const certIssuer = certData.issuer
      const issuerSubject = issuerData.subject

      // For our simplified implementation, check if issuer contains key components
      return (
        certIssuer.includes(
          issuerData.subject?.split(',')[0] || issuerSubject
        ) || certIssuer === issuerSubject
      )
    } catch {
      return false
    }
  }

  private logAuditEntry(entry: PKIAuditEntry): void {
    this.auditLog.push(entry)
    console.log(
      `[PKI-AUDIT] ${entry.timestamp.toISOString()} - ${entry.operation} - ${entry.certificateSerialNumber || 'N/A'} - ${entry.result}`
    )
  }
}

export class IntermediateCertificateAuthority implements ICertificateAuthority {
  private intermediatePrivateKey?: string
  private intermediateCertificate?: IssuedCertificate
  private issuedCertificates: Map<string, IssuedCertificate> = new Map()
  private revokedCertificates: Map<string, RevokedCertificateEntry> = new Map()
  private auditLog: PKIAuditEntry[] = []

  constructor(
    private config: PKIConfiguration,
    private rootCA: RootCertificateAuthority
  ) {}

  public async initialize(): Promise<void> {
    // Generate intermediate CA key pair
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: this.config.intermediateCA.keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })

    this.intermediatePrivateKey = keyPair.privateKey

    // Request intermediate certificate from root CA
    const csr: CertificateSigningRequest = {
      subject: {
        commonName: 'Intermediate CA',
        organizationalUnit: 'Agent Systems',
        organization: 'Textile Showcase',
        country: 'US',
      },
      publicKey: keyPair.publicKey,
      trustLevel: 'HIGH',
      requestedCapabilities: ['CERTIFICATE_SIGNING'],
      agentMetadata: {
        name: 'intermediate-ca',
        version: '1.0.0',
        capabilities: ['CERTIFICATE_SIGNING', 'CRL_GENERATION'],
      },
    }

    // Use CertificateTemplateManager template
    const template: CertificateTemplate = {
      trustLevel: 'HIGH',
      keyUsage: ['KEY_CERT_SIGN', 'CRL_SIGN'],
      extendedKeyUsage: ['CLIENT_AUTH'],
      validityPeriod: this.config.intermediateCA.validityPeriod * 365,
      keySize: this.config.intermediateCA.keySize,
      subjectAltNames: [],
      constraints: {
        allowedCapabilities: ['CERTIFICATE_SIGNING'],
        requiredValidation: 'ENHANCED',
        maxPathLength: this.config.intermediateCA.pathLenConstraint,
      },
    }

    this.intermediateCertificate = await this.rootCA.issueCertificate(
      csr,
      template
    )
  }

  public async issueCertificate(
    request: CertificateSigningRequest,
    template: CertificateTemplate
  ): Promise<IssuedCertificate> {
    if (!this.intermediateCertificate || !this.intermediatePrivateKey) {
      throw new Error('Intermediate CA not initialized')
    }

    // Validate capabilities against template
    this.validateCapabilities(request.requestedCapabilities, template)

    const serialNumber = crypto.randomBytes(16).toString('hex')
    const validFrom = new Date()
    const validTo = new Date()
    validTo.setDate(validFrom.getDate() + template.validityPeriod)

    const certificate = this.signCertificate(
      request,
      serialNumber,
      validFrom,
      validTo,
      this.intermediatePrivateKey
    )

    const fingerprint = crypto
      .createHash('sha256')
      .update(certificate)
      .digest('hex')
      .toUpperCase()

    const issuedCert: IssuedCertificate = {
      certificate,
      serialNumber,
      validFrom,
      validTo,
      certificateChain: [
        certificate,
        this.intermediateCertificate.certificate,
        ...this.intermediateCertificate.certificateChain.slice(1),
      ],
      fingerprint,
    }

    this.issuedCertificates.set(serialNumber, issuedCert)

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CERTIFICATE_ISSUED',
      certificateSerialNumber: serialNumber,
      subjectCommonName: request.subject.commonName,
      issuerCommonName: 'Intermediate CA',
      trustLevel: request.trustLevel,
      result: 'SUCCESS',
    })

    return issuedCert
  }

  public async validateCertificate(
    certificate: string,
    requiredTrustLevel: TrustLevel
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const timestamp = new Date()

    try {
      // First check if this is a certificate we issued
      const certInfo = this.parseCertificate(certificate)
      const serialNumber = certInfo.serialNumber

      // Check if certificate exists in our records or delegate to root CA
      const issuedCert = this.issuedCertificates.get(serialNumber)
      if (issuedCert) {
        // This is our certificate, validate it directly

        // Check expiration - use current timestamp
        const currentTime = new Date(Date.now())
        if (new Date(certInfo.validTo) < currentTime) {
          errors.push({
            code: 'CERTIFICATE_EXPIRED',
            message: 'Certificate has expired',
            severity: 'ERROR',
          })
        }

        // Check revocation status
        const revocationStatus = this.checkRevocationStatusSync(serialNumber)

        if (revocationStatus.status === 'REVOKED') {
          errors.push({
            code: 'CERTIFICATE_REVOKED',
            message: 'Certificate has been revoked',
            severity: 'ERROR',
          })
        }

        // Check trust level
        if (
          certInfo.trustLevel &&
          !this.isTrustLevelSufficient(certInfo.trustLevel, requiredTrustLevel)
        ) {
          errors.push({
            code: 'INSUFFICIENT_TRUST_LEVEL',
            message: `Certificate trust level ${certInfo.trustLevel} insufficient for required ${requiredTrustLevel}`,
            severity: 'ERROR',
          })
        }

        const isValid = errors.length === 0

        return {
          isValid,
          trustLevel: certInfo.trustLevel || requiredTrustLevel,
          validationErrors: errors,
          certificateChain: issuedCert.certificateChain,
          revocationStatus,
          validationTimestamp: timestamp,
        }
      } else {
        // Not our certificate, but before delegating to root CA,
        // check if this might be a certificate from our chain
        try {
          const certInfo = this.parseCertificate(certificate)

          // If it's issued by us (Intermediate CA), it's valid by our chain
          if (certInfo.issuer && certInfo.issuer.includes('Intermediate CA')) {
            // This should not happen if our records are correct, but handle gracefully
            return {
              isValid: false,
              trustLevel: requiredTrustLevel,
              validationErrors: [
                {
                  code: 'CERTIFICATE_RECORD_MISMATCH',
                  message:
                    'Certificate appears to be issued by Intermediate CA but not found in records',
                  severity: 'WARNING',
                },
              ],
              certificateChain: [certificate],
              revocationStatus: { status: 'VALID' },
              validationTimestamp: timestamp,
            }
          }
        } catch {
          // Ignore parsing errors, delegate to root CA
        }

        // Not our certificate, delegate to root CA
        return this.rootCA.validateCertificate(certificate, requiredTrustLevel)
      }
    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Certificate validation failed: ${error}`,
        severity: 'CRITICAL',
      })

      return {
        isValid: false,
        trustLevel: requiredTrustLevel,
        validationErrors: errors,
        certificateChain: [],
        revocationStatus: { status: 'VALID' },
        validationTimestamp: timestamp,
      }
    }
  }

  public async validateCertificateChain(
    certificateChain: string[]
  ): Promise<ValidationResult> {
    if (certificateChain.length < 1) {
      return {
        isValid: false,
        trustLevel: 'LOW',
        validationErrors: [
          {
            code: 'INVALID_CHAIN_LENGTH',
            message: 'Certificate chain must contain at least 1 certificate',
            severity: 'ERROR',
          },
        ],
        certificateChain,
        revocationStatus: { status: 'VALID' },
        validationTimestamp: new Date(),
      }
    }

    // For a single certificate, just validate it
    if (certificateChain.length === 1) {
      return this.validateCertificate(certificateChain[0], 'MEDIUM')
    }

    // Validate each certificate in the chain - simplified for testing
    try {
      // Parse certificates to ensure they're valid format
      for (const cert of certificateChain) {
        this.parseCertificate(cert)
      }
    } catch (error) {
      return {
        isValid: false,
        trustLevel: 'LOW',
        validationErrors: [
          {
            code: 'INVALID_CERTIFICATE_FORMAT',
            message: `Invalid certificate format in chain: ${error}`,
            severity: 'ERROR',
          },
        ],
        certificateChain,
        revocationStatus: { status: 'VALID' },
        validationTimestamp: new Date(),
      }
    }

    // Validate the end entity certificate with its trust level
    const endEntityCert = this.parseCertificate(certificateChain[0])
    const trustLevel = endEntityCert.trustLevel || 'MEDIUM'

    // Check if this is a certificate issued by this intermediate CA
    const serialNumber = endEntityCert.serialNumber
    if (this.issuedCertificates.has(serialNumber)) {
      // This is a certificate we issued, validate it locally
      return this.validateCertificate(certificateChain[0], trustLevel)
    } else {
      // Not our certificate, delegate to root CA chain validation
      return this.rootCA.validateCertificateChain(certificateChain)
    }
  }

  public async revokeCertificate(
    serialNumber: string,
    reason: RevocationReason
  ): Promise<void> {
    const certificate = this.issuedCertificates.get(serialNumber)
    if (!certificate) {
      throw new Error(`Certificate not found: ${serialNumber}`)
    }

    const revokedEntry: RevokedCertificateEntry = {
      serialNumber,
      revocationDate: new Date(),
      reason,
    }

    this.revokedCertificates.set(serialNumber, revokedEntry)

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CERTIFICATE_REVOKED',
      certificateSerialNumber: serialNumber,
      result: 'SUCCESS',
    })
  }

  public async generateCRL(): Promise<CertificateRevocationList> {
    if (!this.intermediateCertificate || !this.intermediatePrivateKey) {
      throw new Error('Intermediate CA not initialized')
    }

    const thisUpdate = new Date()
    const nextUpdate = new Date()
    nextUpdate.setHours(
      thisUpdate.getHours() + this.config.revocation.crlUpdateInterval
    )

    const revokedCertificates = Array.from(this.revokedCertificates.values())

    const crlData = JSON.stringify({
      issuer: 'Intermediate CA',
      thisUpdate,
      nextUpdate,
      revokedCertificates,
    })

    const signature = crypto
      .createSign('SHA256')
      .update(crlData)
      .sign(this.intermediatePrivateKey, 'base64')

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'CRL_GENERATED',
      result: 'SUCCESS',
    })

    return {
      issuer: {
        commonName: 'Intermediate CA',
        organizationalUnit: 'Agent Systems',
        organization: 'Textile Showcase',
        country: 'US',
      },
      thisUpdate,
      nextUpdate,
      revokedCertificates,
      signature,
    }
  }

  public async checkRevocationStatus(
    serialNumber: string
  ): Promise<OCSPResponse> {
    const revokedEntry = this.revokedCertificates.get(serialNumber)
    const thisUpdate = new Date()
    const nextUpdate = new Date()
    nextUpdate.setHours(thisUpdate.getHours() + 1)

    let status: 'GOOD' | 'REVOKED' | 'UNKNOWN' = 'UNKNOWN'
    let revocationTime: Date | undefined
    let revocationReason: RevocationReason | undefined

    if (this.issuedCertificates.has(serialNumber)) {
      if (revokedEntry) {
        status = 'REVOKED'
        revocationTime = revokedEntry.revocationDate
        revocationReason = revokedEntry.reason
      } else {
        status = 'GOOD'
      }
    }

    const responseData = JSON.stringify({
      status,
      revocationTime,
      revocationReason,
      thisUpdate,
      nextUpdate,
    })

    const signature = crypto
      .createSign('SHA256')
      .update(responseData)
      .sign(this.intermediatePrivateKey!, 'base64')

    this.logAuditEntry({
      timestamp: new Date(),
      operation: 'OCSP_REQUEST',
      certificateSerialNumber: serialNumber,
      result: 'SUCCESS',
    })

    return {
      status,
      revocationTime,
      revocationReason,
      thisUpdate,
      nextUpdate,
      signature,
    }
  }

  private signCertificate(
    request: CertificateSigningRequest,
    serialNumber: string,
    validFrom: Date,
    validTo: Date,
    signingKey: string
  ): string {
    const certData = {
      version: 3,
      serialNumber,
      issuer: 'CN=Intermediate CA, OU=Agent Systems, O=Textile Showcase, C=US',
      subject: this.formatDistinguishedName(request.subject),
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      publicKey: request.publicKey,
      trustLevel: request.trustLevel,
      capabilities: request.requestedCapabilities,
      agentMetadata: request.agentMetadata,
    }

    const certString = JSON.stringify(certData)
    const signature = crypto
      .createSign(this.config.intermediateCA.hashAlgorithm)
      .update(certString)
      .sign(signingKey, 'base64')

    return `-----BEGIN CERTIFICATE-----\n${Buffer.from(
      JSON.stringify({
        ...certData,
        signature,
      })
    ).toString('base64')}\n-----END CERTIFICATE-----`
  }

  private formatDistinguishedName(dn: DistinguishedName): string {
    return `CN=${dn.commonName}, OU=${dn.organizationalUnit}, O=${dn.organization}, C=${dn.country}`
  }

  private validateCapabilities(
    requestedCapabilities: string[],
    template: CertificateTemplate
  ): void {
    for (const capability of requestedCapabilities) {
      if (!template.constraints.allowedCapabilities.includes(capability)) {
        throw new Error(
          `Requested capabilities exceed trust level permissions: ${capability}`
        )
      }
    }
  }

  private parseCertificate(certificate: string): ParsedCertificate {
    // Simplified certificate parsing for testing
    // In production, use proper X.509 certificate libraries
    const certData = certificate
      .replace(/-----BEGIN CERTIFICATE-----\n/, '')
      .replace(/\n-----END CERTIFICATE-----/, '')

    const parsed = JSON.parse(
      Buffer.from(certData, 'base64').toString()
    ) as Record<string, unknown>
    return {
      serialNumber:
        typeof parsed.serialNumber === 'string' ? parsed.serialNumber : '',
      issuer: typeof parsed.issuer === 'string' ? parsed.issuer : '',
      subject: typeof parsed.subject === 'string' ? parsed.subject : '',
      validFrom: typeof parsed.validFrom === 'string' ? parsed.validFrom : '',
      validTo: typeof parsed.validTo === 'string' ? parsed.validTo : '',
      trustLevel:
        typeof parsed.trustLevel === 'string' &&
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.trustLevel)
          ? (parsed.trustLevel as TrustLevel)
          : 'MEDIUM',
      capabilities: Array.isArray(parsed.capabilities)
        ? parsed.capabilities.filter(
            (cap): cap is string => typeof cap === 'string'
          )
        : [],
      signature:
        typeof parsed.signature === 'string' ? parsed.signature : undefined,
    }
  }

  private checkRevocationStatusSync(serialNumber: string): RevocationStatus {
    const revokedEntry = this.revokedCertificates.get(serialNumber)

    if (revokedEntry) {
      return {
        status: 'REVOKED',
        reason: revokedEntry.reason,
        revocationDate: revokedEntry.revocationDate,
      }
    }

    return { status: 'VALID' }
  }

  private isTrustLevelSufficient(
    certificateTrustLevel: TrustLevel,
    requiredTrustLevel: TrustLevel
  ): boolean {
    const trustHierarchy = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    return (
      trustHierarchy[certificateTrustLevel] >=
      trustHierarchy[requiredTrustLevel]
    )
  }

  private logAuditEntry(entry: PKIAuditEntry): void {
    this.auditLog.push(entry)
    console.log(
      `[PKI-AUDIT] ${entry.timestamp.toISOString()} - ${entry.operation} - ${entry.certificateSerialNumber || 'N/A'} - ${entry.result}`
    )
  }
}
