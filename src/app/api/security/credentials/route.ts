/**
 * ABOUTME: Security credentials API endpoint for GPG-encrypted credential management
 * Provides secure access to encrypted API keys and credential validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { GPGCredentialManager } from '@/lib/security/credential-manager'
import { AuditLogger } from '@/lib/security/audit-logger'

interface CredentialResponse {
  success: boolean
  data?: Record<string, string>
  error?: string
  timestamp: string
}

interface CredentialStoreRequest {
  apiKey: string
  environment: 'development' | 'staging' | 'production'
  rotationSchedule: string
}

// Initialize audit logger for request tracking
const auditLogger = new AuditLogger()

/**
 * GET - Retrieve encrypted credentials
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const requestId = `cred-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    // Validate required environment variables
    const gpgKeyId = process.env.GPG_KEY_ID
    const credentialPath =
      process.env.CREDENTIAL_PATH || './credentials/encrypted.gpg'

    if (!gpgKeyId) {
      await auditLogger.logCredentialError(
        'Missing GPG_KEY_ID configuration',
        requestId
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Security configuration incomplete',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 503 }
      )
    }

    // Initialize credential manager
    const credentialManager = new GPGCredentialManager(gpgKeyId, credentialPath)

    // Validate GPG key availability
    const isKeyValid = await credentialManager.validateGPGKey()
    if (!isKeyValid) {
      await auditLogger.logCredentialError(
        'Invalid or unavailable GPG key',
        requestId
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Security infrastructure unavailable',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 503 }
      )
    }

    // Load and decrypt credentials
    const credentials = await credentialManager.loadCredentials({
      useCache: true,
      cacheTtl: 5 * 60 * 1000, // 5 minutes
    })

    await auditLogger.logCredentialAccess(requestId, Object.keys(credentials))

    return NextResponse.json({
      success: true,
      data: credentials,
      timestamp: new Date().toISOString(),
    } as CredentialResponse)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    await auditLogger.logCredentialError(errorMessage, requestId)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve credentials',
        timestamp: new Date().toISOString(),
      } as CredentialResponse,
      { status: 500 }
    )
  }
}

/**
 * POST - Store encrypted credentials
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `store-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    // Validate required environment variables
    const gpgKeyId = process.env.GPG_KEY_ID
    const credentialPath =
      process.env.CREDENTIAL_PATH || './credentials/encrypted.gpg'

    if (!gpgKeyId) {
      await auditLogger.logCredentialError(
        'Missing GPG_KEY_ID configuration',
        requestId
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Security configuration incomplete',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 503 }
      )
    }

    // Parse and validate request body
    const body = (await request.json()) as CredentialStoreRequest
    const { apiKey, environment, rotationSchedule } = body

    // Validate required fields
    if (!apiKey || !environment || !rotationSchedule) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: apiKey, environment, rotationSchedule',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 400 }
      )
    }

    // Validate request size (prevent large payloads)
    const requestSize = JSON.stringify(body).length
    if (requestSize > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request payload too large',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 413 }
      )
    }

    // Initialize credential manager
    const credentialManager = new GPGCredentialManager(gpgKeyId, credentialPath)

    // Validate GPG key availability
    const isKeyValid = await credentialManager.validateGPGKey()
    if (!isKeyValid) {
      await auditLogger.logCredentialError(
        'Invalid or unavailable GPG key',
        requestId
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Security infrastructure unavailable',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 503 }
      )
    }

    // Store encrypted credentials
    await credentialManager.storeCredentials({
      apiKey,
      environment,
      rotationSchedule,
      lastRotated: new Date(),
    })

    await auditLogger.logCredentialStore(requestId, environment)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    } as CredentialResponse)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    await auditLogger.logCredentialError(errorMessage, requestId)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to store credentials',
        timestamp: new Date().toISOString(),
      } as CredentialResponse,
      { status: 500 }
    )
  }
}

/**
 * PUT - Test credential encryption/decryption
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: NextRequest): Promise<NextResponse> {
  const requestId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    // Validate required environment variables
    const gpgKeyId = process.env.GPG_KEY_ID
    const credentialPath =
      process.env.CREDENTIAL_PATH || './credentials/encrypted.gpg'

    if (!gpgKeyId) {
      await auditLogger.logCredentialError(
        'Missing GPG_KEY_ID configuration',
        requestId
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Security configuration incomplete',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 503 }
      )
    }

    // Initialize credential manager
    const credentialManager = new GPGCredentialManager(gpgKeyId, credentialPath)

    // Run encryption/decryption test
    const testResult = await credentialManager.testEncryptionDecryption()

    if (testResult) {
      await auditLogger.logCredentialTest(requestId, 'success')
      return NextResponse.json({
        success: true,
        data: { testResult: 'passed' },
        timestamp: new Date().toISOString(),
      } as CredentialResponse)
    } else {
      await auditLogger.logCredentialTest(requestId, 'failure')
      return NextResponse.json(
        {
          success: false,
          error: 'Encryption/decryption test failed',
          timestamp: new Date().toISOString(),
        } as CredentialResponse,
        { status: 500 }
      )
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    await auditLogger.logCredentialError(errorMessage, requestId)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test credentials',
        timestamp: new Date().toISOString(),
      } as CredentialResponse,
      { status: 500 }
    )
  }
}
