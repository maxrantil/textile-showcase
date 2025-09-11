/**
 * ABOUTME: Comprehensive audit logging system for credential access and security events
 * Tracks all credential operations with timestamps, success/failure status, and error details
 */

import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'
import { join } from 'path'

interface AuditEvent {
  timestamp: Date
  action: string
  keyId: string
  success: boolean
  error?: string
  requestId: string
  pid: number
  environment: string
}

export class AuditLogger {
  private readonly logPath: string
  private readonly logDir: string

  constructor(logPath?: string) {
    this.logDir = process.env.AUDIT_LOG_DIR || './logs'
    this.logPath = logPath || join(this.logDir, 'credential-access.log')
  }

  async logEncryption(keyId: string): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'ENCRYPT_CREDENTIAL',
      keyId,
      success: true,
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logDecryption(keyId: string): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'DECRYPT_CREDENTIAL',
      keyId,
      success: true,
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logDecryptionFailure(keyId: string, error: string): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'DECRYPT_CREDENTIAL',
      keyId,
      success: false,
      error: error.substring(0, 500), // Limit error length
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logLoadSuccess(keyId: string): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'LOAD_CREDENTIALS',
      keyId,
      success: true,
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logLoadFailure(error: unknown): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'LOAD_CREDENTIALS',
      keyId: 'unknown',
      success: false,
      error: error instanceof Error ? error.message.substring(0, 500) : 'Unknown error',
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logStoreSuccess(keyId: string): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'STORE_CREDENTIALS',
      keyId,
      success: true,
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logStoreFailure(error: unknown): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'STORE_CREDENTIALS',
      keyId: 'unknown',
      success: false,
      error: error instanceof Error ? error.message.substring(0, 500) : 'Unknown error',
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logRotation(credentialType: string, success: boolean, error?: string): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: 'ROTATE_CREDENTIAL',
      keyId: credentialType,
      success,
      error: error?.substring(0, 500),
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  async logSecurityEvent(event: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details?: string): Promise<void> {
    await this.writeAuditEvent({
      timestamp: new Date(),
      action: `SECURITY_${severity}`,
      keyId: event,
      success: severity === 'LOW',
      error: details?.substring(0, 500),
      requestId: this.generateRequestId(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'unknown'
    })
  }

  /**
   * Retrieves recent audit events for monitoring and alerting
   */
  async getRecentEvents(hours: number = 24): Promise<AuditEvent[]> {
    try {
      const logContent = await fs.readFile(this.logPath, 'utf8')
      const lines = logContent.trim().split('\n').filter(line => line)
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)

      const events: AuditEvent[] = []
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as AuditEvent
          event.timestamp = new Date(event.timestamp)

          if (event.timestamp >= cutoff) {
            events.push(event)
          }
        } catch {
          // Skip malformed log entries
          continue
        }
      }

      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch {
      return []
    }
  }

  /**
   * Gets security alerts from recent events
   */
  async getSecurityAlerts(): Promise<AuditEvent[]> {
    const events = await this.getRecentEvents(24)
    return events.filter(event =>
      !event.success ||
      event.action.startsWith('SECURITY_') ||
      event.error?.includes('failed') ||
      event.error?.includes('unauthorized')
    )
  }

  /**
   * Rotates log files to prevent unlimited growth
   */
  async rotateLogs(): Promise<void> {
    try {
      const stats = await fs.stat(this.logPath)
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (stats.size > maxSize) {
        const backupPath = `${this.logPath}.${Date.now()}`
        await fs.rename(this.logPath, backupPath)

        // Keep only the last 5 backup files
        const files = await fs.readdir(this.logDir)
        const backupFiles = files
          .filter(file => file.startsWith('credential-access.log.'))
          .sort()
          .reverse()

        if (backupFiles.length > 5) {
          for (const file of backupFiles.slice(5)) {
            await fs.unlink(join(this.logDir, file))
          }
        }
      }
    } catch (error) {
      console.warn('Failed to rotate audit logs:', error)
    }
  }

  private async writeAuditEvent(event: AuditEvent): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDir, { recursive: true })

      const logEntry = JSON.stringify(event) + '\n'
      await fs.appendFile(this.logPath, logEntry, 'utf8')

      // Check if log rotation is needed (don't await to avoid blocking)
      this.rotateLogs().catch(console.warn)

    } catch (error) {
      console.error('Failed to write audit log:', error)
      // Don't throw - logging failures shouldn't break credential operations
    }
  }

  private generateRequestId(): string {
    return randomBytes(8).toString('hex')
  }
}
