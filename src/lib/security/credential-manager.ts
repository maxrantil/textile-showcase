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
    this.gpgKeyId = keyId
    this.credentialPath = credentialPath
    this.auditLogger = new AuditLogger()
  }

  /**
   * Encrypts a credential using GPG encryption
   */
  async encryptCredential(plaintext: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const gpg = spawn('gpg', [
        '--encrypt',
        '--armor',
        '--trust-model', 'always',
        '--recipient', this.gpgKeyId,
        '--output', '-'
      ])

      let encrypted = ''
      let errorOutput = ''

      gpg.stdout.on('data', (data) => encrypted += data)
      gpg.stderr.on('data', (data) => errorOutput += data)

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
      const gpg = spawn('gpg', [
        '--decrypt',
        '--quiet',
        '--batch',
        '--no-tty'
      ])

      let decrypted = ''
      let errorOutput = ''

      gpg.stdout.on('data', (data) => decrypted += data)
      gpg.stderr.on('data', (data) => errorOutput += data)

      gpg.on('close', (code) => {
        if (code === 0) {
          this.auditLogger.logDecryption(this.gpgKeyId).catch(console.error)
          resolve(decrypted.trim())
        } else {
          this.auditLogger.logDecryptionFailure(this.gpgKeyId, errorOutput).catch(console.error)
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
  async loadCredentials(options: CredentialLoadOptions = {}): Promise<Record<string, string>> {
    const { useCache = true, cacheTtl = 5 * 60 * 1000 } = options

    // Check cache if enabled
    if (useCache && GPGCredentialManager.credentialCache && GPGCredentialManager.cacheExpiry) {
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
        RESEND_API_KEY: credentials.apiKey
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
      throw new Error(`Failed to load credentials: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stores encrypted credentials with integrity validation
   */
  async storeCredentials(config: Omit<CredentialConfig, 'integrityHash'>): Promise<void> {
    try {
      const credentialWithHash: CredentialConfig = {
        ...config,
        integrityHash: this.computeIntegrityHash(config)
      }

      const plaintext = JSON.stringify(credentialWithHash, null, 2)
      const encrypted = await this.encryptCredential(plaintext)

      await fs.writeFile(this.credentialPath, encrypted, 'utf8')

      // Clear cache to force reload
      GPGCredentialManager.clearCache()

      await this.auditLogger.logStoreSuccess(this.gpgKeyId)
    } catch (error) {
      await this.auditLogger.logStoreFailure(error)
      throw new Error(`Failed to store credentials: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
   * Computes integrity hash for credential validation
   */
  private computeIntegrityHash(config: Omit<CredentialConfig, 'integrityHash'>): string {
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
