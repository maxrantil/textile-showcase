#!/usr/bin/env ts-node
/**
 * ABOUTME: Credential validation script for build processes and deployments
 * Ensures all required credentials are properly configured and accessible
 */

import { GPGCredentialManager } from '../src/lib/security/credential-manager'
import {
  getCredentialStatus,
  testCredentialSystem,
} from '../src/lib/security/environment-loader'

interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  details: Record<string, unknown>
}

async function validateGPGConfiguration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: false,
    errors: [],
    warnings: [],
    details: {},
  }

  const keyId = process.env.GPG_KEY_ID
  const credentialPath =
    process.env.CREDENTIAL_PATH || './credentials/encrypted.gpg'

  if (!keyId) {
    result.errors.push('GPG_KEY_ID environment variable not set')
    return result
  }

  result.details.keyId = keyId
  result.details.credentialPath = credentialPath

  try {
    const manager = new GPGCredentialManager(keyId, credentialPath)

    // Check if GPG key exists and is usable
    const keyValid = await manager.validateGPGKey()
    if (!keyValid) {
      result.errors.push(`GPG key ${keyId} not found or not usable`)
      return result
    }

    result.details.gpgKeyValid = true

    // Check if credential file exists
    try {
      const fs = require('fs').promises
      await fs.access(credentialPath)
      result.details.credentialFileExists = true
    } catch {
      result.errors.push(`Credential file not found: ${credentialPath}`)
      return result
    }

    // Test encryption/decryption functionality
    const testResult = await manager.testEncryptionDecryption()
    if (!testResult) {
      result.errors.push('GPG encryption/decryption test failed')
      return result
    }

    result.details.encryptionTest = true

    // Try to load credentials
    const credentials = await manager.loadCredentials({ useCache: false })
    const requiredKeys = ['RESEND_API_KEY']

    for (const key of requiredKeys) {
      if (!credentials[key]) {
        result.errors.push(`Missing required credential: ${key}`)
      } else if (credentials[key] === 'dummy_key_for_build') {
        result.errors.push(`Credential ${key} is still using dummy value`)
      } else {
        result.details[key] = '***PRESENT***'
      }
    }

    // Validate Resend API key format
    if (
      credentials.RESEND_API_KEY &&
      !credentials.RESEND_API_KEY.startsWith('re_')
    ) {
      result.warnings.push(
        'RESEND_API_KEY does not follow expected format (should start with "re_")'
      )
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(
      `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

async function validateRuntimeEnvironment(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: false,
    errors: [],
    warnings: [],
    details: {},
  }

  try {
    const status = await getCredentialStatus()

    result.details.credentialStatus = {
      loaded: status.loaded,
      cached: status.cached,
      valid: status.valid,
      errors: status.errors,
    }

    if (!status.valid) {
      result.errors.push('Credentials are not valid in runtime environment')
      result.errors.push(...status.errors)
    }

    if (!status.loaded) {
      result.errors.push('Credentials are not loaded in runtime environment')
    }

    result.success = status.valid && status.loaded
  } catch (error) {
    result.errors.push(
      `Runtime validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

async function validateSystemIntegration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: false,
    errors: [],
    warnings: [],
    details: {},
  }

  try {
    const testResult = await testCredentialSystem()

    if (!testResult) {
      result.errors.push('System integration test failed')
    } else {
      result.details.integrationTest = true
    }

    // Check log directory permissions
    try {
      const fs = await import('fs/promises')
      const logDir = process.env.AUDIT_LOG_DIR || './logs'
      await fs.mkdir(logDir, { recursive: true })

      // Test write permissions
      const testFile = `${logDir}/.test-${Date.now()}`
      await fs.writeFile(testFile, 'test')
      await fs.unlink(testFile)

      result.details.logDirectoryWritable = true
    } catch {
      result.warnings.push('Cannot write to audit log directory')
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(
      `System integration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

function printValidationResult(title: string, result: ValidationResult): void {
  console.log(`\n${title}`)
  console.log('='.repeat(title.length))

  if (result.success) {
    console.log('✅ PASSED')
  } else {
    console.log('❌ FAILED')
  }

  if (result.errors.length > 0) {
    console.log('\nErrors:')
    result.errors.forEach((error) => console.log(`  ❌ ${error}`))
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:')
    result.warnings.forEach((warning) => console.log(`  ⚠️ ${warning}`))
  }

  if (Object.keys(result.details).length > 0) {
    console.log('\nDetails:')
    Object.entries(result.details).forEach(([key, value]) => {
      const displayValue =
        typeof value === 'object' ? JSON.stringify(value, null, 2) : value
      console.log(`  ${key}: ${displayValue}`)
    })
  }
}

async function main(): Promise<void> {
  console.log('🔐 GPG Credential System Validation')
  console.log('===================================')

  let allPassed = true

  // Validate GPG configuration
  const gpgResult = await validateGPGConfiguration()
  printValidationResult('GPG Configuration', gpgResult)
  allPassed = allPassed && gpgResult.success

  // Validate runtime environment
  const runtimeResult = await validateRuntimeEnvironment()
  printValidationResult('Runtime Environment', runtimeResult)
  allPassed = allPassed && runtimeResult.success

  // Validate system integration
  const systemResult = await validateSystemIntegration()
  printValidationResult('System Integration', systemResult)
  allPassed = allPassed && systemResult.success

  // Summary
  console.log('\n📋 Validation Summary')
  console.log('====================')

  if (allPassed) {
    console.log('✅ All validations passed - credential system is ready')
    process.exit(0)
  } else {
    console.log('❌ Some validations failed - please fix the issues above')
    console.log('\n🔧 Common solutions:')
    console.log('1. Run: npm run setup-credentials (if not done yet)')
    console.log('2. Check GPG key is properly configured')
    console.log('3. Verify credential file exists and is readable')
    console.log('4. Ensure required environment variables are set')
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Validation failed:', error)
    process.exit(1)
  })
}

export {
  validateGPGConfiguration,
  validateRuntimeEnvironment,
  validateSystemIntegration,
}
