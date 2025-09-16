// ABOUTME: Core PKI type definitions for Agent Coordination System Phase 3
// Comprehensive TypeScript interfaces for Certificate Authority, certificates, and PKI operations

// Core PKI configuration interface
export interface PKIConfiguration {
  rootCA: {
    keySize: 4096 | 2048
    hashAlgorithm: 'SHA256' | 'SHA384' | 'SHA512'
    validityPeriod: number // years
    keyUsage: KeyUsage[]
  }
  intermediateCA: {
    keySize: 2048 | 4096
    hashAlgorithm: 'SHA256' | 'SHA384'
    validityPeriod: number // years
    pathLenConstraint: number
  }
  certificateTemplates: Map<TrustLevel, CertificateTemplate>
  revocation: {
    crlUpdateInterval: number // hours
    ocspEnabled: boolean
    gracePeriod: number // hours
  }
}

// Trust levels from existing agent coordination system
export type TrustLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

// Certificate key usage types
export type KeyUsage =
  | 'DIGITAL_SIGNATURE'
  | 'KEY_ENCIPHERMENT'
  | 'KEY_AGREEMENT'
  | 'KEY_CERT_SIGN'
  | 'CRL_SIGN'

// Extended key usage types
export type ExtendedKeyUsage =
  | 'SERVER_AUTH'
  | 'CLIENT_AUTH'
  | 'CODE_SIGNING'
  | 'EMAIL_PROTECTION'
  | 'TIME_STAMPING'

// Certificate validation levels
export type ValidationLevel = 'STRICT' | 'ENHANCED' | 'STANDARD' | 'BASIC'

// Certificate revocation reasons
export type RevocationReason =
  | 'UNSPECIFIED'
  | 'KEY_COMPROMISE'
  | 'CA_COMPROMISE'
  | 'AFFILIATION_CHANGED'
  | 'SUPERSEDED'
  | 'CESSATION_OF_OPERATION'
  | 'CERTIFICATE_HOLD'

// Distinguished Name for certificate subjects and issuers
export interface DistinguishedName {
  commonName: string
  organizationalUnit: string
  organization: string
  locality?: string
  stateOrProvince?: string
  country: string
  emailAddress?: string
}

// Subject Alternative Name types
export interface SubjectAltName {
  type: 'DNS' | 'IP' | 'EMAIL' | 'URI'
  value: string
}

// Certificate constraints
export interface CertificateConstraints {
  maxPathLength?: number
  nameConstraints?: NameConstraints
  policyConstraints?: PolicyConstraints
  allowedCapabilities: string[]
  requiredValidation: ValidationLevel
}

export interface NameConstraints {
  permittedSubtrees?: string[]
  excludedSubtrees?: string[]
}

export interface PolicyConstraints {
  requireExplicitPolicy?: number
  inhibitPolicyMapping?: number
}

// Certificate template for different trust levels
export interface CertificateTemplate {
  trustLevel: TrustLevel
  keyUsage: KeyUsage[]
  extendedKeyUsage: ExtendedKeyUsage[]
  validityPeriod: number // days
  keySize: 2048 | 4096
  subjectAltNames: SubjectAltName[]
  constraints: CertificateConstraints
}

// Certificate signing request
export interface CertificateSigningRequest {
  subject: DistinguishedName
  publicKey: string // PEM format
  trustLevel: TrustLevel
  requestedCapabilities: string[]
  agentMetadata: {
    name: string
    version: string
    capabilities: string[]
  }
}

// Issued certificate response
export interface IssuedCertificate {
  certificate: string // PEM-encoded certificate
  serialNumber: string
  validFrom: Date
  validTo: Date
  certificateChain: string[] // Full chain to root
  fingerprint: string // SHA256 fingerprint
}

// Certificate revocation status
export interface RevocationStatus {
  status: 'VALID' | 'REVOKED' | 'SUSPENDED'
  reason?: RevocationReason
  revocationDate?: Date
  invalidityDate?: Date
}

// Certificate validation result
export interface ValidationResult {
  isValid: boolean
  trustLevel: TrustLevel
  validationErrors: ValidationError[]
  certificateChain: string[]
  revocationStatus: RevocationStatus
  validationTimestamp: Date
}

// Validation error information
export interface ValidationError {
  code: string
  message: string
  severity: 'WARNING' | 'ERROR' | 'CRITICAL'
}

// Certificate metadata
export interface CertificateMetadata {
  serialNumber: string
  issuer: DistinguishedName
  subject: DistinguishedName
  validFrom: Date
  validTo: Date
  keyUsage: KeyUsage[]
  extendedKeyUsage: ExtendedKeyUsage[]
  fingerprint: string
}

// Certificate Authority interface
export interface ICertificateAuthority {
  // Certificate issuance
  issueCertificate(
    request: CertificateSigningRequest,
    template: CertificateTemplate
  ): Promise<IssuedCertificate>

  // Certificate validation
  validateCertificate(
    certificate: string,
    trustLevel: TrustLevel
  ): Promise<ValidationResult>

  // Certificate revocation
  revokeCertificate(
    serialNumber: string,
    reason: RevocationReason
  ): Promise<void>

  // CRL management
  generateCRL(): Promise<CertificateRevocationList>

  // OCSP operations
  checkRevocationStatus(serialNumber: string): Promise<OCSPResponse>

  // Certificate chain validation
  validateCertificateChain(
    certificateChain: string[]
  ): Promise<ValidationResult>
}

// Certificate Revocation List
export interface CertificateRevocationList {
  issuer: DistinguishedName
  thisUpdate: Date
  nextUpdate: Date
  revokedCertificates: RevokedCertificateEntry[]
  signature: string
}

export interface RevokedCertificateEntry {
  serialNumber: string
  revocationDate: Date
  reason: RevocationReason
}

// OCSP (Online Certificate Status Protocol) Response
export interface OCSPResponse {
  status: 'GOOD' | 'REVOKED' | 'UNKNOWN'
  revocationTime?: Date
  revocationReason?: RevocationReason
  thisUpdate: Date
  nextUpdate?: Date
  signature: string
}

// PKI audit entry for enhanced logging
export interface PKIAuditEntry {
  timestamp: Date
  operation: PKIOperation
  certificateSerialNumber?: string
  subjectCommonName?: string
  issuerCommonName?: string
  trustLevel?: TrustLevel
  result: 'SUCCESS' | 'FAILURE' | 'WARNING'
  errorCode?: string
  errorMessage?: string
  operatorId?: string
}

export type PKIOperation =
  | 'CERTIFICATE_ISSUED'
  | 'CERTIFICATE_VALIDATED'
  | 'CERTIFICATE_REVOKED'
  | 'CRL_GENERATED'
  | 'OCSP_REQUEST'
  | 'TRUST_CHAIN_VALIDATED'
  | 'CRITICAL_APPROVAL_REQUESTED'
  | 'CRITICAL_APPROVAL_GRANTED'
  | 'CRITICAL_APPROVAL_DENIED'

// Enhanced agent type with PKI integration
export interface PKIEnabledAgent {
  id: string
  name: string
  trustLevel: TrustLevel
  capabilities: string[]
  certificate?: string
  certificateChain?: string[]
  privateKeyReference?: string // HSM reference, not actual key
  pkiMetadata?: {
    serialNumber: string
    issuer: string
    validFrom: Date
    validTo: Date
    fingerprint: string
  }
}

// PKI validation extension for AgentIsolationFramework
export interface PKIValidator {
  validateAgentCertificate(agent: PKIEnabledAgent): Promise<PKIValidationResult>
  verifyTrustChain(certificateChain: string[]): Promise<boolean>
  checkRevocationStatus(serialNumber: string): Promise<RevocationStatus>
  auditCertificateUsage(agent: PKIEnabledAgent, operation: string): void
}

export interface PKIValidationResult {
  isValid: boolean
  trustLevel: TrustLevel
  validationErrors: ValidationError[]
  certificateMetadata: CertificateMetadata
  auditEntry: PKIAuditEntry
}

// Critical certificate request for manual approval process
export interface CriticalCertificateRequest {
  requestId: string
  csr: CertificateSigningRequest
  template: CertificateTemplate
  requestTimestamp: Date
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED' | 'EXPIRED'
  requiresManualApproval: boolean
  approvalMetadata?: {
    approvedBy?: string
    approvalTimestamp?: Date
    approvalReason?: string
    approvalTicket?: string
  }
}

// Certificate storage record for database persistence
export interface CertificateRecord {
  id: string // Unique certificate identifier
  serialNumber: string // X.509 serial number
  subject: DistinguishedName // Certificate subject
  issuer: DistinguishedName // Certificate issuer
  trustLevel: TrustLevel // Agent trust level
  certificateData: string // PEM-encoded certificate
  privateKeyId?: string // Reference to private key (if stored)
  validFrom: Date // Certificate validity start
  validTo: Date // Certificate validity end
  revocationStatus: RevocationStatus
  createdAt: Date
  updatedAt: Date
  auditTrail: PKIAuditEntry[]
}

// CA hierarchy for certificate chain management
export interface CAHierarchy {
  rootCA: CertificateRecord // Root CA certificate
  intermediateCA: CertificateRecord // Intermediate CA certificate
  issuedCertificates: CertificateRecord[] // All issued certificates
  trustChain: string[] // Certificate chain validation
}

// Hardware Security Module interface for production environments
export interface HSMInterface {
  generateKeyPair(keySize: number): Promise<HSMKeyPair>
  signData(keyId: string, data: Buffer): Promise<Buffer>
  verifySignature(
    keyId: string,
    data: Buffer,
    signature: Buffer
  ): Promise<boolean>
  storePrivateKey(keyData: string): Promise<string> // Returns key ID
  deletePrivateKey(keyId: string): Promise<void>
}

export interface HSMKeyPair {
  keyId: string
  publicKey: string // PEM format
  keySize: number
  algorithm: string
}

// Certificate lifecycle management
export interface CertificateLifecycleManager {
  scheduleRenewal(serialNumber: string, renewalDate: Date): Promise<void>
  processRenewals(): Promise<RenewalResult[]>
  cleanupExpiredCertificates(): Promise<CleanupResult>
  notifyExpiringCertificates(
    daysBeforeExpiry: number
  ): Promise<NotificationResult[]>
}

export interface RenewalResult {
  originalSerialNumber: string
  newCertificate?: IssuedCertificate
  success: boolean
  errorMessage?: string
}

export interface CleanupResult {
  certificatesRemoved: number
  certificatesArchived: number
  errors: string[]
}

export interface NotificationResult {
  serialNumber: string
  subjectCommonName: string
  expiryDate: Date
  notificationSent: boolean
  notificationMethod: string
}
