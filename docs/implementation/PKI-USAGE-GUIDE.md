# PKI Infrastructure Usage Guide

**Complete Guide to Using the Textile Showcase PKI System**

This comprehensive guide covers everything you need to know to use the PKI (Public Key Infrastructure) system in the Textile Showcase Agent Coordination System.

---

## 📚 **Table of Contents**

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Certificate Authority Setup](#certificate-authority-setup)
4. [Certificate Operations](#certificate-operations)
5. [Trust Level Management](#trust-level-management)
6. [Certificate Validation](#certificate-validation)
7. [Revocation Management](#revocation-management)
8. [Integration with Agent System](#integration-with-agent-system)
9. [Error Handling](#error-handling)
10. [Advanced Features](#advanced-features)
11. [Troubleshooting](#troubleshooting)
12. [Security Best Practices](#security-best-practices)

---

## 🚀 **Quick Start**

### **Step 1: Import PKI Components**

```typescript
import {
  RootCertificateAuthority,
  IntermediateCertificateAuthority,
  CertificateTemplateManager,
} from './src/lib/pki/ca/certificate-authority'

import {
  PKIConfiguration,
  CertificateSigningRequest,
  TrustLevel,
} from './src/lib/pki/types/pki-types'
```

### **Step 2: Configure PKI System**

```typescript
const pkiConfig: PKIConfiguration = {
  rootCA: {
    keySize: 4096,
    hashAlgorithm: 'SHA256',
    validityPeriod: 10, // years
    keyUsage: ['KEY_CERT_SIGN', 'CRL_SIGN'],
  },
  intermediateCA: {
    keySize: 2048,
    hashAlgorithm: 'SHA256',
    validityPeriod: 5, // years
    pathLenConstraint: 1,
  },
  certificateTemplates: new Map(),
  revocation: {
    crlUpdateInterval: 24, // hours
    ocspEnabled: true,
    gracePeriod: 1, // hours
  },
}
```

### **Step 3: Initialize Certificate Authorities**

```typescript
// Create certificate template manager
const templateManager = new CertificateTemplateManager(pkiConfig)

// Create root CA
const rootCA = new RootCertificateAuthority(pkiConfig)
await rootCA.generateRootCertificate()

// Create and initialize intermediate CA
const intermediateCA = new IntermediateCertificateAuthority(pkiConfig, rootCA)
await intermediateCA.initialize()
```

### **Step 4: Issue Your First Certificate**

```typescript
// Create certificate signing request
const csr: CertificateSigningRequest = {
  subject: {
    commonName: 'My Agent',
    organizationalUnit: 'Agent Operations',
    organization: 'Textile Showcase',
    country: 'US',
  },
  publicKey: generatePublicKey(), // Your public key
  trustLevel: 'HIGH',
  requestedCapabilities: ['DATA_PROCESSING', 'SECURE_COMMUNICATION'],
  agentMetadata: {
    name: 'my-agent',
    version: '1.0.0',
    capabilities: ['DATA_PROCESSING', 'SECURE_COMMUNICATION'],
  },
}

// Issue certificate
const template = templateManager.getTemplate('HIGH')
const certificate = await intermediateCA.issueCertificate(csr, template)

console.log('Certificate issued:', certificate.serialNumber)
```

---

## 🎯 **Core Concepts**

### **Trust Levels**

The PKI system supports four trust levels with different security requirements:

| Trust Level  | Description                       | Use Cases                             | Certificate Authority |
| ------------ | --------------------------------- | ------------------------------------- | --------------------- |
| **CRITICAL** | Highest security, manual approval | System administration, key management | Root CA               |
| **HIGH**     | Enhanced security, automated      | Data processing, secure communication | Intermediate CA       |
| **MEDIUM**   | Standard security, automated      | Basic operations, reporting           | Intermediate CA       |
| **LOW**      | No certificate required           | Public operations, read-only access   | None                  |

### **Certificate Authority Hierarchy**

```
Root CA (Self-signed)
└── Intermediate CA (Signed by Root)
    ├── CRITICAL Agent Certificates (Manual approval)
    ├── HIGH Agent Certificates (Automated)
    └── MEDIUM Agent Certificates (Automated)
```

### **Certificate Lifecycle**

1. **Request** → Agent creates certificate signing request (CSR)
2. **Validate** → Template manager validates capabilities against trust level
3. **Issue** → Certificate authority issues signed certificate
4. **Validate** → Certificate validation during agent operations
5. **Revoke** → Certificate revocation when needed
6. **Expire** → Certificate expires after validity period

---

## 🏗️ **Certificate Authority Setup**

### **Root Certificate Authority**

The Root CA is the trust anchor for the entire PKI system:

```typescript
class RootCertificateAuthority {
  constructor(config: PKIConfiguration) {
    this.config = config
    this.issuedCertificates = new Map()
    this.revokedCertificates = new Map()
    this.criticalRequests = new Map()
  }

  // Generate self-signed root certificate
  async generateRootCertificate(): Promise<IssuedCertificate> {
    // Creates self-signed certificate with maximum security
    // Key size: 4096-bit RSA
    // Validity: 10 years
    // Usage: Certificate signing, CRL signing
  }
}
```

**Root CA Features:**

- ✅ Self-signed root certificate generation
- ✅ Manual approval workflow for CRITICAL certificates
- ✅ Certificate issuance with cryptographic signatures
- ✅ Certificate revocation and CRL management
- ✅ OCSP responder functionality

### **Intermediate Certificate Authority**

The Intermediate CA handles day-to-day certificate operations:

```typescript
class IntermediateCertificateAuthority {
  constructor(config: PKIConfiguration, rootCA: RootCertificateAuthority) {
    this.config = config
    this.rootCA = rootCA
    this.issuedCertificates = new Map()
    this.revokedCertificates = new Map()
  }

  // Initialize with certificate from root CA
  async initialize(): Promise<void> {
    // Requests intermediate certificate from root CA
    // Establishes certificate chain: Root → Intermediate
  }
}
```

**Intermediate CA Features:**

- ✅ Automated certificate issuance for HIGH/MEDIUM trust
- ✅ Certificate chain validation
- ✅ Local certificate management and revocation
- ✅ Integration with root CA for validation delegation

---

## 📜 **Certificate Operations**

### **Creating Certificate Signing Requests**

```typescript
// Basic CSR structure
const csr: CertificateSigningRequest = {
  subject: {
    commonName: 'Agent Name', // Required: Agent identifier
    organizationalUnit: 'Department', // Required: Organizational unit
    organization: 'Textile Showcase', // Required: Organization
    country: 'US', // Required: Country code
    locality: 'City', // Optional: City
    stateOrProvince: 'State', // Optional: State/Province
    emailAddress: 'agent@example.com', // Optional: Email
  },
  publicKey: '-----BEGIN PUBLIC KEY-----...', // PEM format public key
  trustLevel: 'HIGH', // CRITICAL, HIGH, MEDIUM
  requestedCapabilities: [
    // Must match trust level template
    'DATA_PROCESSING',
    'SECURE_COMMUNICATION',
  ],
  agentMetadata: {
    name: 'data-processor-agent', // Agent system name
    version: '2.1.0', // Agent version
    capabilities: [
      // Agent capabilities
      'DATA_PROCESSING',
      'SECURE_COMMUNICATION',
      'MONITORING',
    ],
  },
}
```

### **Certificate Issuance**

#### **HIGH/MEDIUM Trust Certificates (Automated)**

```typescript
// Get appropriate template for trust level
const template = templateManager.getTemplate('HIGH')

// Issue certificate through intermediate CA
const certificate = await intermediateCA.issueCertificate(csr, template)

// Certificate contains full chain: Agent → Intermediate → Root
console.log('Certificate issued:', {
  serialNumber: certificate.serialNumber,
  validFrom: certificate.validFrom,
  validTo: certificate.validTo,
  fingerprint: certificate.fingerprint,
  chainLength: certificate.certificateChain.length, // Should be 3
})
```

#### **CRITICAL Trust Certificates (Manual Approval)**

```typescript
// Submit request for manual approval
const criticalRequest = await rootCA.submitCriticalCertificateRequest(csr)

console.log('Critical certificate request submitted:', {
  requestId: criticalRequest.requestId,
  status: criticalRequest.status, // 'PENDING_APPROVAL'
  requiresManualApproval: criticalRequest.requiresManualApproval, // true
})

// Manual approval (typically done by security team)
const approvedCertificate = await rootCA.approveCriticalCertificate(
  criticalRequest.requestId,
  'APPROVED',
  'Security team approval - ticket #SEC-2025-001'
)

console.log('Critical certificate approved:', approvedCertificate.serialNumber)
```

### **Certificate Information**

```typescript
interface IssuedCertificate {
  certificate: string // PEM-encoded certificate
  serialNumber: string // Unique 128-bit hex identifier
  validFrom: Date // Certificate validity start
  validTo: Date // Certificate validity end
  certificateChain: string[] // Full chain to root [Agent, Intermediate, Root]
  fingerprint: string // SHA256 fingerprint
}
```

---

## 🎚️ **Trust Level Management**

### **Certificate Templates**

Each trust level has a specific template defining capabilities and constraints:

```typescript
// Get template for specific trust level
const criticalTemplate = templateManager.getTemplate('CRITICAL')
const highTemplate = templateManager.getTemplate('HIGH')
const mediumTemplate = templateManager.getTemplate('MEDIUM')

// Template properties
interface CertificateTemplate {
  trustLevel: TrustLevel // CRITICAL, HIGH, MEDIUM
  keyUsage: KeyUsage[] // Certificate key usage
  extendedKeyUsage: ExtendedKeyUsage[] // Extended key usage
  validityPeriod: number // Days (365, 730, 1095)
  keySize: 2048 | 4096 // RSA key size
  subjectAltNames: SubjectAltName[] // Alternative names
  constraints: {
    allowedCapabilities: string[] // Allowed agent capabilities
    requiredValidation: ValidationLevel // STRICT, ENHANCED, STANDARD
    maxPathLength?: number // Certificate chain length limit
  }
}
```

### **Trust Level Capabilities**

#### **CRITICAL Trust Level**

```typescript
// CRITICAL template capabilities
allowedCapabilities: [
  'SYSTEM_ADMIN', // System administration
  'KEY_MANAGEMENT', // Cryptographic key operations
  'SECURITY_AUDIT', // Security auditing
  'CERTIFICATE_SIGNING', // Certificate authority operations
  'CRITICAL_OPERATIONS', // Critical system operations
]

// Security characteristics
validityPeriod: 365 // 1 year
keySize: 4096 // 4096-bit RSA
requiredValidation: 'STRICT' // Highest validation level
```

#### **HIGH Trust Level**

```typescript
// HIGH template capabilities
allowedCapabilities: [
  'DATA_PROCESSING', // Data processing operations
  'SECURE_COMMUNICATION', // Secure agent communication
  'MONITORING', // System monitoring
  'PERFORMANCE_ANALYSIS', // Performance analysis
  'CERTIFICATE_SIGNING', // Intermediate CA operations
  'TESTING', // Testing operations
  'INTEGRATION_TESTING', // Integration testing
  'PERFORMANCE_TESTING', // Performance testing
]

// Security characteristics
validityPeriod: 730 // 2 years
keySize: 2048 // 2048-bit RSA
requiredValidation: 'ENHANCED' // Enhanced validation
```

#### **MEDIUM Trust Level**

```typescript
// MEDIUM template capabilities
allowedCapabilities: [
  'BASIC_OPERATIONS', // Basic operations
  'STANDARD_COMMUNICATION', // Standard communication
  'READ_ONLY_ACCESS', // Read-only access
  'REPORTING', // Reporting operations
  'TESTING', // Testing operations
  'PARALLEL_TESTING', // Parallel testing
]

// Security characteristics
validityPeriod: 1095 // 3 years
keySize: 2048 // 2048-bit RSA
requiredValidation: 'STANDARD' // Standard validation
```

### **Capability Validation**

```typescript
// Validate capabilities against trust level
const validation = templateManager.validateCapabilities(
  ['DATA_PROCESSING', 'SECURE_COMMUNICATION'], // Requested capabilities
  'HIGH' // Trust level
)

if (!validation.valid) {
  console.error('Capability validation failed:', validation.errors)
  // Handle validation errors
}
```

---

## ✅ **Certificate Validation**

### **Basic Certificate Validation**

```typescript
// Validate single certificate
const validation = await intermediateCA.validateCertificate(
  certificate.certificate, // PEM-encoded certificate
  'HIGH' // Required trust level
)

if (validation.isValid) {
  console.log('Certificate valid:', {
    trustLevel: validation.trustLevel,
    revocationStatus: validation.revocationStatus.status,
    validationTimestamp: validation.validationTimestamp,
  })
} else {
  console.error('Certificate validation failed:', validation.validationErrors)
}
```

### **Certificate Chain Validation**

```typescript
// Validate complete certificate chain
const chainValidation = await intermediateCA.validateCertificateChain(
  certificate.certificateChain
)

if (chainValidation.isValid) {
  console.log('Certificate chain valid')
} else {
  console.error('Chain validation failed:', chainValidation.validationErrors)
}
```

### **Validation Result Structure**

```typescript
interface ValidationResult {
  isValid: boolean // Overall validation result
  trustLevel: TrustLevel // Certificate trust level
  validationErrors: ValidationError[] // Any validation errors
  certificateChain: string[] // Full certificate chain
  revocationStatus: RevocationStatus // Revocation status
  validationTimestamp: Date // When validation occurred
}

interface ValidationError {
  code: string // Error code (e.g., 'CERTIFICATE_EXPIRED')
  message: string // Human-readable error message
  severity: 'WARNING' | 'ERROR' | 'CRITICAL' // Error severity
}
```

### **Common Validation Errors**

| Error Code                 | Description                   | Severity | Resolution                       |
| -------------------------- | ----------------------------- | -------- | -------------------------------- |
| `CERTIFICATE_EXPIRED`      | Certificate past expiry date  | ERROR    | Renew certificate                |
| `CERTIFICATE_REVOKED`      | Certificate has been revoked  | ERROR    | Issue new certificate            |
| `INSUFFICIENT_TRUST_LEVEL` | Trust level too low           | ERROR    | Request higher trust certificate |
| `INVALID_SIGNATURE`        | Signature verification failed | CRITICAL | Verify certificate integrity     |
| `CERTIFICATE_NOT_FOUND`    | Certificate not in CA records | ERROR    | Verify certificate source        |

---

## 🚫 **Revocation Management**

### **Certificate Revocation**

```typescript
// Revoke certificate with reason
await intermediateCA.revokeCertificate(
  certificate.serialNumber, // Certificate serial number
  'KEY_COMPROMISE' // Revocation reason
)

console.log(`Certificate ${certificate.serialNumber} revoked`)
```

### **Revocation Reasons**

| Reason                   | When to Use                                  |
| ------------------------ | -------------------------------------------- |
| `UNSPECIFIED`            | General revocation without specific reason   |
| `KEY_COMPROMISE`         | Private key has been compromised             |
| `CA_COMPROMISE`          | Certificate Authority has been compromised   |
| `AFFILIATION_CHANGED`    | Agent no longer affiliated with organization |
| `SUPERSEDED`             | Certificate replaced by newer certificate    |
| `CESSATION_OF_OPERATION` | Agent no longer operational                  |
| `CERTIFICATE_HOLD`       | Temporary suspension (can be reversed)       |

### **Certificate Revocation List (CRL)**

```typescript
// Generate current CRL
const crl = await intermediateCA.generateCRL()

console.log('CRL generated:', {
  issuer: crl.issuer.commonName,
  thisUpdate: crl.thisUpdate,
  nextUpdate: crl.nextUpdate,
  revokedCount: crl.revokedCertificates.length,
})

// CRL structure
interface CertificateRevocationList {
  issuer: DistinguishedName // CRL issuer
  thisUpdate: Date // CRL generation time
  nextUpdate: Date // Next CRL update time
  revokedCertificates: RevokedCertificateEntry[] // Revoked certificates
  signature: string // CRL signature
}
```

### **OCSP (Online Certificate Status Protocol)**

```typescript
// Check certificate status via OCSP
const ocspResponse = await intermediateCA.checkRevocationStatus(
  certificate.serialNumber
)

console.log('OCSP response:', {
  status: ocspResponse.status, // 'GOOD', 'REVOKED', 'UNKNOWN'
  revocationTime: ocspResponse.revocationTime,
  revocationReason: ocspResponse.revocationReason,
})
```

---

## 🔗 **Integration with Agent System**

### **Enhanced Agent Type**

```typescript
// PKI-enabled agent interface
interface PKIEnabledAgent {
  id: string // Agent ID
  name: string // Agent name
  trustLevel: TrustLevel // Agent trust level
  capabilities: string[] // Agent capabilities
  certificate?: string // PEM-encoded certificate
  certificateChain?: string[] // Full certificate chain
  privateKeyReference?: string // HSM key reference (not actual key)
  pkiMetadata?: {
    serialNumber: string // Certificate serial number
    issuer: string // Certificate issuer
    validFrom: Date // Certificate validity start
    validTo: Date // Certificate validity end
    fingerprint: string // Certificate fingerprint
  }
}
```

### **Agent Registration with PKI**

```typescript
// Register agent with PKI certificate
async function registerAgentWithPKI(
  agent: PKIEnabledAgent,
  certificateAuthority: IntermediateCertificateAuthority
): Promise<void> {
  if (agent.certificate && agent.trustLevel !== 'LOW') {
    // Validate agent certificate
    const validation = await certificateAuthority.validateCertificate(
      agent.certificate,
      agent.trustLevel
    )

    if (!validation.isValid) {
      throw new Error(
        `Agent certificate validation failed: ${validation.validationErrors[0]?.message}`
      )
    }

    // Extract certificate metadata
    agent.pkiMetadata = {
      serialNumber: validation.certificateChain[0]
        ? extractSerialNumber(validation.certificateChain[0])
        : '',
      issuer: 'Intermediate CA',
      validFrom: new Date(),
      validTo: new Date(),
      fingerprint: generateFingerprint(agent.certificate),
    }
  }

  // Register agent with validated certificate
  console.log(
    `Agent ${agent.name} registered with certificate ${agent.pkiMetadata?.serialNumber}`
  )
}
```

### **PKI Validation in Agent Operations**

```typescript
// Validate agent before operation
async function validateAgentOperation(
  agent: PKIEnabledAgent,
  operation: string,
  certificateAuthority: IntermediateCertificateAuthority
): Promise<boolean> {
  // Check if operation requires certificate
  if (agent.trustLevel === 'LOW') {
    return true // No certificate required for LOW trust
  }

  if (!agent.certificate) {
    throw new Error(`Certificate required for ${agent.trustLevel} trust level`)
  }

  // Validate certificate
  const validation = await certificateAuthority.validateCertificate(
    agent.certificate,
    agent.trustLevel
  )

  if (!validation.isValid) {
    console.error(
      `Agent ${agent.name} certificate validation failed:`,
      validation.validationErrors
    )
    return false
  }

  // Log successful validation
  console.log(`Agent ${agent.name} validated for operation: ${operation}`)
  return true
}
```

---

## ⚠️ **Error Handling**

### **Certificate Issuance Errors**

```typescript
try {
  const certificate = await intermediateCA.issueCertificate(csr, template)
} catch (error) {
  if (error.message.includes('capabilities exceed trust level')) {
    console.error('Capability validation failed:', error.message)
    // Handle capability mismatch
  } else if (error.message.includes('not initialized')) {
    console.error('Certificate Authority not initialized')
    // Initialize CA first
  } else {
    console.error('Certificate issuance failed:', error.message)
    // Handle general issuance error
  }
}
```

### **Validation Error Handling**

```typescript
const validation = await certificateAuthority.validateCertificate(
  cert,
  trustLevel
)

if (!validation.isValid) {
  validation.validationErrors.forEach((error) => {
    switch (error.code) {
      case 'CERTIFICATE_EXPIRED':
        console.error('Certificate expired, renewal required')
        break
      case 'CERTIFICATE_REVOKED':
        console.error('Certificate revoked, new certificate required')
        break
      case 'INSUFFICIENT_TRUST_LEVEL':
        console.error('Trust level insufficient for operation')
        break
      default:
        console.error(`Validation error: ${error.message}`)
    }
  })
}
```

### **Graceful Degradation**

```typescript
// Implement fallback validation
async function validateWithFallback(
  certificate: string,
  trustLevel: TrustLevel,
  certificateAuthority: IntermediateCertificateAuthority
): Promise<boolean> {
  try {
    const validation = await certificateAuthority.validateCertificate(
      certificate,
      trustLevel
    )
    return validation.isValid
  } catch (error) {
    console.warn(
      'PKI validation failed, falling back to basic validation:',
      error.message
    )

    // Implement basic validation fallback
    try {
      const certInfo = JSON.parse(
        Buffer.from(
          certificate
            .replace(/-----BEGIN CERTIFICATE-----\n/, '')
            .replace(/\n-----END CERTIFICATE-----/, ''),
          'base64'
        ).toString()
      )

      // Basic expiry check
      return new Date(certInfo.validTo) > new Date()
    } catch (fallbackError) {
      console.error('Fallback validation failed:', fallbackError.message)
      return false
    }
  }
}
```

---

## 🔧 **Advanced Features**

### **Custom Certificate Templates**

```typescript
// Create custom template for specific use case
const customTemplate: CertificateTemplate = {
  trustLevel: 'HIGH',
  keyUsage: ['DIGITAL_SIGNATURE', 'KEY_ENCIPHERMENT'],
  extendedKeyUsage: ['CLIENT_AUTH', 'CODE_SIGNING'],
  validityPeriod: 180, // 6 months
  keySize: 4096,
  subjectAltNames: [
    { type: 'DNS', value: 'agent.example.com' },
    { type: 'EMAIL', value: 'agent@example.com' },
  ],
  constraints: {
    allowedCapabilities: ['CUSTOM_OPERATION'],
    requiredValidation: 'ENHANCED',
    maxPathLength: 0,
  },
}

// Update template manager
templateManager.updateTemplate('HIGH', customTemplate)
```

### **Bulk Certificate Operations**

```typescript
// Issue multiple certificates
async function issueBulkCertificates(
  requests: CertificateSigningRequest[],
  certificateAuthority: IntermediateCertificateAuthority
): Promise<IssuedCertificate[]> {
  const certificates: IssuedCertificate[] = []

  for (const csr of requests) {
    try {
      const template = templateManager.getTemplate(csr.trustLevel)
      const cert = await certificateAuthority.issueCertificate(csr, template)
      certificates.push(cert)
    } catch (error) {
      console.error(
        `Failed to issue certificate for ${csr.subject.commonName}:`,
        error.message
      )
    }
  }

  return certificates
}
```

### **Certificate Monitoring**

```typescript
// Monitor certificate expiration
function monitorCertificateExpiration(
  certificates: IssuedCertificate[],
  warningDays: number = 30
): void {
  const now = new Date()
  const warningTime = new Date(
    now.getTime() + warningDays * 24 * 60 * 60 * 1000
  )

  certificates.forEach((cert) => {
    if (cert.validTo <= warningTime) {
      const daysUntilExpiry = Math.ceil(
        (cert.validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      if (daysUntilExpiry <= 0) {
        console.error(`Certificate ${cert.serialNumber} has EXPIRED`)
      } else {
        console.warn(
          `Certificate ${cert.serialNumber} expires in ${daysUntilExpiry} days`
        )
      }
    }
  })
}
```

---

## 🔍 **Troubleshooting**

### **Common Issues and Solutions**

#### **Issue: Certificate Validation Fails**

**Symptoms:**

- ValidationResult.isValid = false
- Error code: 'INVALID_SIGNATURE' or 'CERTIFICATE_NOT_FOUND'

**Solutions:**

1. Verify certificate was issued by the correct CA
2. Check certificate chain completeness
3. Ensure clock synchronization between systems
4. Verify certificate not corrupted during transmission

```typescript
// Debug certificate validation
console.log('Certificate details:', {
  serialNumber: extractSerialNumber(certificate),
  issuer: extractIssuer(certificate),
  subject: extractSubject(certificate),
  validFrom: extractValidFrom(certificate),
  validTo: extractValidTo(certificate),
})
```

#### **Issue: Trust Level Mismatch**

**Symptoms:**

- Error: 'Requested capabilities exceed trust level permissions'
- Certificate issuance fails

**Solutions:**

1. Review requested capabilities against trust level template
2. Request appropriate trust level for capabilities needed
3. Use templateManager.validateCapabilities() to check beforehand

```typescript
// Check capabilities before certificate request
const validation = templateManager.validateCapabilities(
  requestedCapabilities,
  trustLevel
)

if (!validation.valid) {
  console.error('Capability issues:', validation.errors)
}
```

#### **Issue: Certificate Authority Not Initialized**

**Symptoms:**

- Error: 'Certificate Authority not initialized'
- Operations fail with initialization errors

**Solutions:**

1. Ensure root CA certificate is generated first
2. Initialize intermediate CA properly
3. Check initialization order

```typescript
// Proper initialization sequence
const rootCA = new RootCertificateAuthority(config)
await rootCA.generateRootCertificate() // Must be first

const intermediateCA = new IntermediateCertificateAuthority(config, rootCA)
await intermediateCA.initialize() // Must be after root CA
```

### **Debugging Tools**

#### **Certificate Information Extraction**

```typescript
function debugCertificate(certificate: string): void {
  try {
    const certData = JSON.parse(
      Buffer.from(
        certificate
          .replace(/-----BEGIN CERTIFICATE-----\n/, '')
          .replace(/\n-----END CERTIFICATE-----/, ''),
        'base64'
      ).toString()
    )

    console.log('Certificate Debug Info:', {
      version: certData.version,
      serialNumber: certData.serialNumber,
      issuer: certData.issuer,
      subject: certData.subject,
      validFrom: certData.validFrom,
      validTo: certData.validTo,
      trustLevel: certData.trustLevel,
      capabilities: certData.capabilities,
    })
  } catch (error) {
    console.error('Failed to parse certificate:', error.message)
  }
}
```

#### **PKI System Health Check**

```typescript
async function healthCheck(
  rootCA: RootCertificateAuthority,
  intermediateCA: IntermediateCertificateAuthority
): Promise<void> {
  console.log('PKI System Health Check:')

  try {
    // Check root CA
    const rootCert = await rootCA.generateRootCertificate()
    console.log('✅ Root CA operational:', rootCert.serialNumber)

    // Check intermediate CA
    const testCSR: CertificateSigningRequest = {
      subject: {
        commonName: 'Health Check',
        organizationalUnit: 'Test',
        organization: 'Test',
        country: 'US',
      },
      publicKey: 'test-key',
      trustLevel: 'MEDIUM',
      requestedCapabilities: ['TESTING'],
      agentMetadata: {
        name: 'health-check',
        version: '1.0.0',
        capabilities: ['TESTING'],
      },
    }

    const template = templateManager.getTemplate('MEDIUM')
    const testCert = await intermediateCA.issueCertificate(testCSR, template)
    console.log('✅ Intermediate CA operational:', testCert.serialNumber)

    // Test validation
    const validation = await intermediateCA.validateCertificate(
      testCert.certificate,
      'MEDIUM'
    )
    console.log('✅ Certificate validation operational:', validation.isValid)

    // Test revocation
    await intermediateCA.revokeCertificate(testCert.serialNumber, 'SUPERSEDED')
    console.log('✅ Certificate revocation operational')
  } catch (error) {
    console.error('❌ PKI system health check failed:', error.message)
  }
}
```

---

## 🔒 **Security Best Practices**

### **Certificate Security**

1. **Private Key Protection**
   - Never store private keys in code or logs
   - Use HSM for production private key storage
   - Implement key escrow for recovery scenarios

```typescript
// Good: Reference to HSM key
const agent: PKIEnabledAgent = {
  // ... other fields
  privateKeyReference: 'hsm-key-id-12345', // HSM reference only
  // privateKey: '-----BEGIN PRIVATE KEY-----...' // ❌ NEVER DO THIS
}
```

2. **Certificate Validation**
   - Always validate certificates before operations
   - Check revocation status regularly
   - Implement certificate pinning for critical agents

```typescript
// Always validate before operations
if (agent.trustLevel !== 'LOW') {
  const isValid = await validateAgentOperation(
    agent,
    operation,
    certificateAuthority
  )
  if (!isValid) {
    throw new Error('Agent certificate validation failed')
  }
}
```

3. **Trust Level Enforcement**
   - Never bypass trust level checks
   - Implement principle of least privilege
   - Regular capability audits

### **Operational Security**

1. **Audit Logging**
   - Log all PKI operations
   - Monitor for suspicious certificate requests
   - Regular audit log reviews

```typescript
// PKI operations are automatically logged
console.log(
  '[PKI-AUDIT] 2025-09-16T07:22:03.672Z - CERTIFICATE_ISSUED - be1d84c81a1570bbf99abfe07619ccd8 - SUCCESS'
)
```

2. **Certificate Lifecycle Management**

   - Regular certificate renewal before expiration
   - Prompt revocation of compromised certificates
   - Cleanup of expired certificates

3. **Access Control**
   - Restrict access to certificate authority operations
   - Implement multi-person approval for CRITICAL certificates
   - Regular access reviews

### **Performance Security**

1. **Validation Caching**

   - Cache valid certificates for performance
   - Implement cache invalidation on revocation
   - Set appropriate cache timeouts

2. **Rate Limiting**
   - Limit certificate issuance requests
   - Implement backoff for validation failures
   - Monitor for abuse patterns

---

## 📊 **Performance Considerations**

### **Optimization Strategies**

1. **Certificate Caching**

```typescript
// Implementation example for validation caching
class CertificateCache {
  private cache = new Map<
    string,
    { validation: ValidationResult; timestamp: Date }
  >()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  async getCachedValidation(
    certificate: string
  ): Promise<ValidationResult | null> {
    const cached = this.cache.get(certificate)
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached.validation
    }
    return null
  }

  setCachedValidation(certificate: string, validation: ValidationResult): void {
    this.cache.set(certificate, { validation, timestamp: new Date() })
  }
}
```

2. **Parallel Processing**

```typescript
// Validate multiple certificates in parallel
async function validateCertificatesParallel(
  certificates: string[],
  trustLevel: TrustLevel,
  certificateAuthority: IntermediateCertificateAuthority
): Promise<ValidationResult[]> {
  return Promise.all(
    certificates.map((cert) =>
      certificateAuthority.validateCertificate(cert, trustLevel)
    )
  )
}
```

### **Performance Monitoring**

```typescript
// Monitor PKI operation performance
class PKIPerformanceMonitor {
  private metrics = new Map<string, number[]>()

  startOperation(operation: string): () => void {
    const startTime = Date.now()
    return () => {
      const duration = Date.now() - startTime
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, [])
      }
      this.metrics.get(operation)!.push(duration)
    }
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || []
    return times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0
  }
}

// Usage
const monitor = new PKIPerformanceMonitor()

const endTimer = monitor.startOperation('certificate_validation')
const validation = await certificateAuthority.validateCertificate(
  cert,
  trustLevel
)
endTimer()

console.log(
  'Average validation time:',
  monitor.getAverageTime('certificate_validation'),
  'ms'
)
```

---

This comprehensive guide covers all aspects of using the PKI infrastructure in the Textile Showcase system. For additional support or advanced use cases, refer to the PKI Infrastructure Status document or contact the development team.
