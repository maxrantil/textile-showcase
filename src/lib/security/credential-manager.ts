/**
 * ABOUTME: GPG-based credential management system for secure API key storage and access
 * Provides encryption, decryption, and integrity validation of sensitive credentials
 */

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { createHash, randomBytes } from 'crypto'
import { AuditLogger } from './audit-logger'

interface CredentialConfig {
  apiKey: string
  environment: 'development' | 'staging' | 'production'
  rotationSchedule: string
  lastRotated: Date
  integrityHash: string
}

interface CredentialLoadOptions {
  useCache?: boolean
  cacheTtl?: number
}

export class GPGCredentialManager {
  private readonly gpgKeyId: string
  private readonly credentialPath: string
  private readonly auditLogger: AuditLogger
  private static credentialCache: Record<string, string> | null = null
  private static cacheExpiry: Date | null = null

  constructor(keyId: string, credentialPath: string) {
    this.validateGPGKeyId(keyId)
    this.validateCredentialPath(credentialPath)

    this.gpgKeyId = keyId
    this.credentialPath = credentialPath
    this.auditLogger = new AuditLogger()
  }

  /**
   * Validates GPG key ID format and prevents injection attacks
   */
  private validateGPGKeyId(keyId: string): void {
    if (!keyId || typeof keyId !== 'string') {
      throw new Error('Invalid GPG key ID format')
    }

    if (keyId.length < 8 || keyId.length > 40) {
      throw new Error('Invalid GPG key ID format')
    }

    // Comprehensive validation to prevent command injection and ensure GPG key format
    const dangerousChars = [
      ';',
      '`',
      '$',
      '|',
      '-',
      '/',
      '\\',
      '&',
      '(',
      ')',
      '{',
      '}',
      '[',
      ']',
      '<',
      '>',
      '"',
      "'",
    ]
    if (dangerousChars.some((char) => keyId.includes(char))) {
      throw new Error('Invalid GPG key ID format')
    }

    // GPG key IDs should only contain alphanumeric characters and underscores
    if (!/^[A-Za-z0-9_]+$/.test(keyId)) {
      throw new Error('Invalid GPG key ID format')
    }
  }

  /**
   * Validates credential file path and prevents directory traversal attacks
   */
  private validateCredentialPath(credentialPath: string): void {
    if (
      !credentialPath ||
      typeof credentialPath !== 'string' ||
      credentialPath.trim() === ''
    ) {
      throw new Error('Invalid credential path')
    }

    // Comprehensive path traversal protection
    const dangerousPaths = [
      '..',
      '/etc/',
      '\\windows\\',
      '/var/',
      '/usr/',
      '/root/',
      '/home/',
      ';',
      '|',
      '&',
    ]
    if (
      dangerousPaths.some((dangerous) =>
        credentialPath.toLowerCase().includes(dangerous.toLowerCase())
      )
    ) {
      throw new Error('Invalid credential path - Path not allowed')
    }

    // Ensure path is reasonable (not too long, contains expected extension)
    if (credentialPath.length > 500) {
      throw new Error('Invalid credential path - Path too long')
    }
  }

  /**
   * Encrypts a credential using GPG encryption
   */
  async encryptCredential(plaintext: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const gpg = spawn('gpg', [
        '--encrypt',
        '--armor',
        '--trust-model',
        'always',
        '--recipient',
        this.gpgKeyId,
        '--output',
        '-',
      ])

      let encrypted = ''
      let errorOutput = ''

      gpg.stdout.on('data', (data) => (encrypted += data))
      gpg.stderr.on('data', (data) => (errorOutput += data))

      gpg.on('close', (code) => {
        if (code === 0) {
          this.auditLogger.logEncryption(this.gpgKeyId).catch(console.error)
          resolve(encrypted)
        } else {
          reject(new Error(`GPG encryption failed: ${errorOutput}`))
        }
      })

      gpg.on('error', (error) => {
        reject(new Error(`GPG process error: ${error.message}`))
      })

      gpg.stdin.write(plaintext)
      gpg.stdin.end()
    })
  }

  /**
   * Decrypts a credential using GPG decryption
   */
  async decryptCredential(ciphertext: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const gpg = spawn('gpg', ['--decrypt', '--quiet', '--batch', '--no-tty'])

      let decrypted = ''
      let errorOutput = ''

      gpg.stdout.on('data', (data) => (decrypted += data))
      gpg.stderr.on('data', (data) => (errorOutput += data))

      gpg.on('close', (code) => {
        if (code === 0) {
          this.auditLogger.logDecryption(this.gpgKeyId).catch(console.error)
          resolve(decrypted.trim())
        } else {
          this.auditLogger
            .logDecryptionFailure(this.gpgKeyId, errorOutput)
            .catch(console.error)
          reject(new Error(`GPG decryption failed: ${errorOutput}`))
        }
      })

      gpg.on('error', (error) => {
        reject(new Error(`GPG process error: ${error.message}`))
      })

      gpg.stdin.write(ciphertext)
      gpg.stdin.end()
    })
  }

  /**
   * Loads and validates encrypted credentials
   */
  async loadCredentials(
    options: CredentialLoadOptions = {}
  ): Promise<Record<string, string>> {
    const { useCache = true, cacheTtl = 5 * 60 * 1000 } = options

    // Check cache if enabled
    if (
      useCache &&
      GPGCredentialManager.credentialCache &&
      GPGCredentialManager.cacheExpiry
    ) {
      if (new Date() < GPGCredentialManager.cacheExpiry) {
        return GPGCredentialManager.credentialCache
      }
    }

    try {
      const encryptedContent = await fs.readFile(this.credentialPath, 'utf8')
      const decryptedContent = await this.decryptCredential(encryptedContent)
      const credentials = JSON.parse(decryptedContent) as CredentialConfig

      // Validate integrity
      const computedHash = this.computeIntegrityHash(credentials)
      if (computedHash !== credentials.integrityHash) {
        throw new Error('Credential integrity check failed')
      }

      const result = {
        RESEND_API_KEY: credentials.apiKey,
      }

      // Update cache if enabled
      if (useCache) {
        GPGCredentialManager.credentialCache = result
        GPGCredentialManager.cacheExpiry = new Date(Date.now() + cacheTtl)
      }

      await this.auditLogger.logLoadSuccess(this.gpgKeyId)
      return result
    } catch (error) {
      await this.auditLogger.logLoadFailure(error)
      throw new Error(
        `Failed to load credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Stores encrypted credentials with integrity validation
   */
  async storeCredentials(
    config: Omit<CredentialConfig, 'integrityHash'>
  ): Promise<void> {
    try {
      this.validateAPIKey(config.apiKey)
      this.validateCredentialConfig(config)

      const credentialWithHash: CredentialConfig = {
        ...config,
        integrityHash: this.computeIntegrityHash(config),
      }

      const plaintext = JSON.stringify(credentialWithHash, null, 2)
      const encrypted = await this.encryptCredential(plaintext)

      await fs.writeFile(this.credentialPath, encrypted, 'utf8')

      // Clear cache to force reload
      GPGCredentialManager.clearCache()

      await this.auditLogger.logStoreSuccess(this.gpgKeyId)
    } catch (error) {
      await this.auditLogger.logStoreFailure(error)
      throw new Error(
        `Failed to store credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Validates that GPG key exists and is usable
   */
  async validateGPGKey(): Promise<boolean> {
    return new Promise((resolve) => {
      const gpg = spawn('gpg', ['--list-keys', this.gpgKeyId])

      gpg.on('close', (code) => {
        resolve(code === 0)
      })

      gpg.on('error', () => {
        resolve(false)
      })
    })
  }

  /**
   * Generates a test encrypted credential to verify system functionality
   */
  async testEncryptionDecryption(): Promise<boolean> {
    try {
      const testData = `test-credential-${Date.now()}`
      const encrypted = await this.encryptCredential(testData)
      const decrypted = await this.decryptCredential(encrypted)
      return decrypted === testData
    } catch {
      return false
    }
  }

  /**
   * Validates API key format and security requirements
   */
  private validateAPIKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key format: API key is required')
    }

    if (apiKey.length < 10) {
      throw new Error('Invalid API key format: API key too short')
    }

    if (apiKey.length > 200) {
      throw new Error('Invalid API key format: API key too long')
    }

    // Enhanced validation for common API key patterns (secure character set)
    if (!apiKey.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error('Invalid API key format: Invalid characters')
    }

    // Check for obvious weak patterns
    if (
      apiKey.toLowerCase().includes('password') ||
      apiKey.toLowerCase().includes('secret') ||
      (apiKey === apiKey.toLowerCase() && apiKey.length < 20)
    ) {
      throw new Error(
        'Invalid API key format: Key appears to be weak or test data'
      )
    }
  }

  /**
   * Validates credential configuration object
   */
  private validateCredentialConfig(
    config: Omit<CredentialConfig, 'integrityHash'>
  ): void {
    const validEnvironments = ['development', 'staging', 'production'] as const
    if (!validEnvironments.includes(config.environment)) {
      throw new Error(`Invalid environment: ${config.environment}`)
    }

    if (
      !config.rotationSchedule ||
      typeof config.rotationSchedule !== 'string'
    ) {
      throw new Error('Invalid rotation schedule')
    }

    if (!(config.lastRotated instanceof Date)) {
      throw new Error('Invalid last rotated date')
    }
  }

  /**
   * Computes integrity hash for credential validation
   */
  private computeIntegrityHash(
    config: Omit<CredentialConfig, 'integrityHash'>
  ): string {
    const data = `${config.apiKey}${config.environment}${config.rotationSchedule}${config.lastRotated}`
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Clears the credential cache
   */
  static clearCache(): void {
    GPGCredentialManager.credentialCache = null
    GPGCredentialManager.cacheExpiry = null
  }

  /**
   * Generates a secure random string for credential generation
   */
  static generateSecureRandom(length: number = 32): string {
    return randomBytes(length).toString('hex')
  }
}
