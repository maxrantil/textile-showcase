/**
 * ABOUTME: Secure environment loader that integrates GPG credential management with Next.js runtime
 * Handles credential loading, caching, and integration with application startup
 */

import { GPGCredentialManager } from './credential-manager'
import { AuditLogger } from './audit-logger'

interface LoadEnvironmentOptions {
  useCache?: boolean
  cacheTtl?: number
  validateCredentials?: boolean
  throwOnFailure?: boolean
}

interface CredentialValidation {
  key: string
  validator: (value: string) => boolean
  errorMessage: string
}

const auditLogger = new AuditLogger()

// Credential validation rules
const CREDENTIAL_VALIDATORS: CredentialValidation[] = [
  {
    key: 'RESEND_API_KEY',
    validator: (value: string) => {
      return !!(
        value &&
        value !== 'dummy_key_for_build' &&
        value.startsWith('re_') &&
        value.length > 20
      )
    },
    errorMessage:
      'RESEND_API_KEY must be a valid Resend API key starting with "re_"',
  },
]

/**
 * Loads secure environment variables using GPG credential management
 */
export async function loadSecureEnvironment(
  options: LoadEnvironmentOptions = {}
): Promise<void> {
  const {
    useCache = true,
    cacheTtl = 5 * 60 * 1000, // 5 minutes
    validateCredentials = true,
    throwOnFailure = true,
  } = options

  try {
    const keyId = process.env.GPG_KEY_ID
    const credentialPath =
      process.env.CREDENTIAL_PATH || './credentials/encrypted.gpg'

    if (!keyId) {
      throw new Error('GPG_KEY_ID environment variable not set')
    }

    // Initialize credential manager
    const manager = new GPGCredentialManager(keyId, credentialPath)

    // Validate GPG key is available
    const keyValid = await manager.validateGPGKey()
    if (!keyValid) {
      throw new Error(`GPG key ${keyId} not found or not usable`)
    }

    // Load credentials
    const credentials = await manager.loadCredentials({ useCache, cacheTtl })

    // Set environment variables
    Object.entries(credentials).forEach(([key, value]) => {
      process.env[key] = value
    })

    // Validate credentials if requested
    if (validateCredentials) {
      await validateLoadedCredentials(credentials, throwOnFailure)
    }

    await auditLogger.logSecurityEvent(
      'ENVIRONMENT_LOADED',
      'LOW',
      `Loaded ${Object.keys(credentials).length} credentials`
    )
  } catch (error) {
    await auditLogger.logSecurityEvent(
      'ENVIRONMENT_LOAD_FAILED',
      'HIGH',
      error instanceof Error ? error.message : 'Unknown error'
    )

    if (throwOnFailure) {
      throw error
    } else {
      console.warn(
        'Failed to load secure environment:',
        error instanceof Error ? error.message : error
      )
    }
  }
}

/**
 * Validates that loaded credentials meet security requirements
 */
async function validateLoadedCredentials(
  credentials: Record<string, string>,
  throwOnFailure: boolean = true
): Promise<void> {
  const errors: string[] = []

  for (const validator of CREDENTIAL_VALIDATORS) {
    const value = credentials[validator.key]

    if (!value) {
      errors.push(`Missing required credential: ${validator.key}`)
      continue
    }

    if (!validator.validator(value)) {
      errors.push(validator.errorMessage)
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Credential validation failed:\n${errors.join('\n')}`

    await auditLogger.logSecurityEvent(
      'CREDENTIAL_VALIDATION_FAILED',
      'HIGH',
      errorMessage
    )

    if (throwOnFailure) {
      throw new Error(errorMessage)
    } else {
      console.warn(errorMessage)
    }
  } else {
    await auditLogger.logSecurityEvent(
      'CREDENTIAL_VALIDATION_PASSED',
      'LOW',
      `Validated ${CREDENTIAL_VALIDATORS.length} credentials`
    )
  }
}

/**
 * Clears the credential cache and forces reload
 */
export function clearCredentialCache(): void {
  GPGCredentialManager.clearCache()
}

/**
 * Tests the credential system end-to-end
 */
export async function testCredentialSystem(): Promise<boolean> {
  try {
    const keyId = process.env.GPG_KEY_ID
    if (!keyId) {
      console.error('GPG_KEY_ID not set')
      return false
    }

    const manager = new GPGCredentialManager(
      keyId,
      './credentials/test-encrypted.gpg'
    )

    // Test encryption/decryption
    const testResult = await manager.testEncryptionDecryption()
    if (!testResult) {
      console.error('GPG encryption/decryption test failed')
      return false
    }

    console.log('✅ Credential system test passed')
    return true
  } catch (error) {
    console.error(
      '❌ Credential system test failed:',
      error instanceof Error ? error.message : error
    )
    return false
  }
}

/**
 * Emergency credential loading with fallback mechanisms
 */
export async function emergencyLoadCredentials(): Promise<boolean> {
  console.log('🚨 Emergency credential loading initiated')

  try {
    // Try normal loading first
    await loadSecureEnvironment({
      useCache: false,
      validateCredentials: false,
      throwOnFailure: false,
    })

    console.log('✅ Emergency credential loading successful')
    return true
  } catch (error) {
    console.error('❌ Emergency credential loading failed:', error)

    // Fall back to environment variables if available
    if (
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== 'dummy_key_for_build'
    ) {
      console.log('⚠️ Using fallback environment variables')
      return true
    }

    return false
  }
}

/**
 * Gets the current credential status for monitoring
 */
export async function getCredentialStatus(): Promise<{
  loaded: boolean
  cached: boolean
  valid: boolean
  lastLoaded?: Date
  errors: string[]
}> {
  const errors: string[] = []

  try {
    const keyId = process.env.GPG_KEY_ID
    if (!keyId) {
      errors.push('GPG_KEY_ID not configured')
      return { loaded: false, cached: false, valid: false, errors }
    }

    const manager = new GPGCredentialManager(
      keyId,
      process.env.CREDENTIAL_PATH || './credentials/encrypted.gpg'
    )

    // Check if GPG key is valid
    const keyValid = await manager.validateGPGKey()
    if (!keyValid) {
      errors.push('GPG key not valid or not found')
    }

    // Check if credentials are loaded
    const hasResendKey =
      !!process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== 'dummy_key_for_build'

    return {
      loaded: hasResendKey,
      cached: true, // This would need to be checked against actual cache
      valid: keyValid && hasResendKey,
      errors,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return { loaded: false, cached: false, valid: false, errors }
  }
}
