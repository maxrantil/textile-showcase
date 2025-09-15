// ABOUTME: Consensus-based validation engine with security-first authority model
// Implements multi-signature validation and immutable security decisions

import crypto from 'crypto'
import {
  AgentValidationResult,
  AgentConflict,
  ConflictResolutionStrategy,
  AuditEntry,
} from './agent-coordination'

// Consensus requirements for different change types
export interface ConsensusRequirements {
  architecture: {
    requiredApprovals: string[]
    minimumScore: number
    vetoPower: string[]
  }
  security: {
    requiredApprovals: string[]
    minimumScore: number
    vetoPower: string[] // security-validator has absolute veto power
    immutable: boolean
  }
  performance: {
    requiredApprovals: string[]
    minimumScore: number
    vetoPower: string[]
  }
  quality: {
    requiredApprovals: string[]
    minimumScore: number
    vetoPower: string[]
  }
}

export interface ConsensusResult {
  approved: boolean
  requiredChanges: string[]
  conflictResolutions: ConflictResolutionStrategy[]
  securityDecisions: SecurityDecision[]
  finalScore: number
  consensusAchieved: boolean
  escalationRequired: boolean
}

export interface SecurityDecision {
  decision: 'APPROVE' | 'REJECT' | 'CONDITIONAL'
  rationale: string
  immutable: boolean
  signature: string
  timestamp: Date
}

export class ConsensusEngine {
  private consensusRequirements: ConsensusRequirements
  private securityDecisions: Map<string, SecurityDecision> = new Map()
  private auditLog: AuditEntry[] = []
  private static cachedSecretKey: string | null = null
  private static secretKeyValidated: boolean = false

  constructor() {
    // Security-first consensus model as specified in PDR
    this.consensusRequirements = {
      architecture: {
        requiredApprovals: ['architecture-designer'],
        minimumScore: 4.0,
        vetoPower: ['security-validator'], // Security can veto architecture changes
      },
      security: {
        requiredApprovals: ['security-validator'],
        minimumScore: 0, // Security decisions are not score-based
        vetoPower: ['security-validator'], // Security-validator has absolute authority
        immutable: true, // Security decisions cannot be overridden
      },
      performance: {
        requiredApprovals: ['performance-optimizer', 'code-quality-analyzer'],
        minimumScore: 3.5,
        vetoPower: ['security-validator'], // Security can veto performance changes
      },
      quality: {
        requiredApprovals: ['code-quality-analyzer', 'architecture-designer'],
        minimumScore: 4.0,
        vetoPower: ['security-validator'], // Security can veto quality changes
      },
    }
  }

  // Main consensus validation entry point
  async validateConsensus(
    validationResults: AgentValidationResult[],
    changeType: keyof ConsensusRequirements
  ): Promise<ConsensusResult> {
    const startTime = Date.now()

    // Phase 1: Security-first validation
    const securityValidation =
      await this.performSecurityValidation(validationResults)

    // If security rejects, decision is immutable and final
    if (securityValidation.some((decision) => decision.decision === 'REJECT')) {
      return this.createSecurityRejectionResult(securityValidation)
    }

    // Phase 2: Multi-signature validation for approved security
    const consensusResult = await this.performMultiSignatureValidation(
      validationResults,
      changeType,
      securityValidation
    )

    // Phase 3: Conflict detection and resolution
    const conflicts = this.detectConflicts(validationResults)
    const resolutions = await this.resolveConflicts(
      conflicts,
      validationResults
    )

    // Phase 4: Final consensus determination
    const finalResult = this.determineFinalConsensus(
      consensusResult,
      resolutions,
      securityValidation
    )

    const processingTime = Date.now() - startTime

    this.logAuditEntry({
      timestamp: new Date(),
      action: 'CONSENSUS_VALIDATION',
      agent: 'consensus-engine',
      result: finalResult.approved ? 'SUCCESS' : 'FAILURE',
      signature: this.generateConsensusSignature(finalResult),
      details: {
        processingTime,
        changeType,
        agentCount: validationResults.length,
        conflictCount: conflicts.length,
        consensusAchieved: finalResult.consensusAchieved,
      },
    })

    return finalResult
  }

  // Security-first validation with immutable decisions
  private async performSecurityValidation(
    validationResults: AgentValidationResult[]
  ): Promise<SecurityDecision[]> {
    const securityResults = validationResults.filter(
      (result) => result.agent.name === 'security-validator'
    )

    const decisions: SecurityDecision[] = []

    for (const result of securityResults) {
      const decision: SecurityDecision = {
        decision:
          result.status === 'APPROVED'
            ? 'APPROVE'
            : result.status === 'REJECTED'
              ? 'REJECT'
              : 'CONDITIONAL',
        rationale: result.rationale,
        immutable: true, // Security decisions are always immutable
        signature: result.cryptographicSignature,
        timestamp: new Date(),
      }

      // Store immutable security decision
      const decisionId = `security-${Date.now()}-${Math.random()}`
      this.securityDecisions.set(decisionId, decision)

      decisions.push(decision)

      this.logAuditEntry({
        timestamp: new Date(),
        action: 'SECURITY_DECISION',
        agent: 'security-validator',
        result: decision.decision === 'APPROVE' ? 'SUCCESS' : 'FAILURE',
        signature: decision.signature,
        details: {
          decision: decision.decision,
          immutable: decision.immutable,
          rationale: decision.rationale,
        },
      })
    }

    return decisions
  }

  // Multi-signature validation requiring agent agreement
  private async performMultiSignatureValidation(
    validationResults: AgentValidationResult[],
    changeType: keyof ConsensusRequirements,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _securityDecisions: SecurityDecision[]
  ): Promise<Partial<ConsensusResult>> {
    const requirements = this.consensusRequirements[changeType]
    const approvals: Map<string, AgentValidationResult> = new Map()
    const rejections: string[] = []

    // Check required approvals
    for (const requiredAgent of requirements.requiredApprovals) {
      const agentResult = validationResults.find(
        (result) => result.agent.name === requiredAgent
      )

      if (!agentResult) {
        rejections.push(`Missing required approval from ${requiredAgent}`)
        continue
      }

      if (
        agentResult.status === 'APPROVED' &&
        (agentResult.score || 0) >= requirements.minimumScore
      ) {
        approvals.set(requiredAgent, agentResult)
      } else {
        rejections.push(
          `${requiredAgent} rejected or scored below minimum (${agentResult.score} < ${requirements.minimumScore})`
        )
      }
    }

    // Check veto power (security-validator can veto any change)
    for (const vetoAgent of requirements.vetoPower) {
      const vetoResult = validationResults.find(
        (result) => result.agent.name === vetoAgent
      )

      if (vetoResult && vetoResult.status === 'REJECTED') {
        rejections.push(`${vetoAgent} exercised veto power`)
      }
    }

    const approved =
      rejections.length === 0 &&
      approvals.size >= requirements.requiredApprovals.length
    const consensusAchieved =
      approvals.size === requirements.requiredApprovals.length

    return {
      approved,
      consensusAchieved,
      requiredChanges: rejections,
    }
  }

  // Conflict detection across agent recommendations
  private detectConflicts(
    validationResults: AgentValidationResult[]
  ): AgentConflict[] {
    const conflicts: AgentConflict[] = []

    // Check for architectural vs performance conflicts
    const archResults = validationResults.filter(
      (r) => r.agent.name === 'architecture-designer'
    )
    const perfResults = validationResults.filter(
      (r) => r.agent.name === 'performance-optimizer'
    )

    for (const archResult of archResults) {
      for (const perfResult of perfResults) {
        if (this.hasConflictingRecommendations(archResult, perfResult)) {
          conflicts.push({
            conflictType: 'ARCHITECTURAL',
            severity: 'MEDIUM',
            description:
              'Architecture and performance recommendations conflict',
            affectedAgents: [archResult.agent.name, perfResult.agent.name],
            resolutionStrategy: {
              type: 'CONSENSUS',
              requiredApprovals: [
                'architecture-designer',
                'performance-optimizer',
              ],
              rationale: 'Both agents must agree on balanced solution',
            },
          })
        }
      }
    }

    // Check for security vs other conflicts
    const securityResults = validationResults.filter(
      (r) => r.agent.name === 'security-validator'
    )
    const otherResults = validationResults.filter(
      (r) => r.agent.name !== 'security-validator'
    )

    for (const secResult of securityResults) {
      for (const otherResult of otherResults) {
        if (this.hasSecurityConflict(secResult, otherResult)) {
          conflicts.push({
            conflictType: 'SECURITY',
            severity: 'CRITICAL',
            description:
              'Security requirements conflict with other recommendations',
            affectedAgents: [secResult.agent.name, otherResult.agent.name],
            resolutionStrategy: {
              type: 'SECURITY_OVERRIDE',
              requiredApprovals: ['security-validator'],
              rationale: 'Security decisions are immutable and take priority',
            },
          })
        }
      }
    }

    return conflicts
  }

  // Resolve conflicts according to security-first principles
  private async resolveConflicts(
    conflicts: AgentConflict[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _validationResults: AgentValidationResult[]
  ): Promise<ConflictResolutionStrategy[]> {
    const resolutions: ConflictResolutionStrategy[] = []

    for (const conflict of conflicts) {
      let resolution: ConflictResolutionStrategy

      switch (conflict.conflictType) {
        case 'SECURITY':
          // Security conflicts are resolved by security override (immutable)
          resolution = {
            type: 'SECURITY_OVERRIDE',
            requiredApprovals: ['security-validator'],
            rationale:
              'Security validator decision is immutable and cannot be overridden',
          }
          break

        case 'ARCHITECTURAL':
        case 'PERFORMANCE':
        case 'QUALITY':
          // Non-security conflicts require consensus
          resolution = {
            type: 'CONSENSUS',
            requiredApprovals: conflict.affectedAgents,
            rationale: 'Requires agreement from all affected agents',
          }
          break

        default:
          // Escalate unknown conflicts to human review
          resolution = {
            type: 'HUMAN_ESCALATION',
            requiredApprovals: [],
            rationale: 'Unknown conflict type requires human intervention',
          }
      }

      resolutions.push(resolution)

      this.logAuditEntry({
        timestamp: new Date(),
        action: 'CONFLICT_RESOLVED',
        agent: 'consensus-engine',
        result: 'SUCCESS',
        signature: '',
        details: {
          conflictType: conflict.conflictType,
          resolutionType: resolution.type,
          affectedAgents: conflict.affectedAgents,
        },
      })
    }

    return resolutions
  }

  // Create result for security rejections (immutable and final)
  private createSecurityRejectionResult(
    securityDecisions: SecurityDecision[]
  ): ConsensusResult {
    const rejectedDecisions = securityDecisions.filter(
      (d) => d.decision === 'REJECT'
    )

    return {
      approved: false,
      requiredChanges: rejectedDecisions.map(
        (d) => `Security rejection: ${d.rationale}`
      ),
      conflictResolutions: [],
      securityDecisions,
      finalScore: 0,
      consensusAchieved: false,
      escalationRequired: false, // Security rejections are final, no escalation
    }
  }

  // Determine final consensus based on all validation phases
  private determineFinalConsensus(
    consensusResult: Partial<ConsensusResult>,
    resolutions: ConflictResolutionStrategy[],
    securityDecisions: SecurityDecision[]
  ): ConsensusResult {
    // If any security decision is rejected, final result is rejected
    const hasSecurityRejection = securityDecisions.some(
      (d) => d.decision === 'REJECT'
    )

    if (hasSecurityRejection) {
      return this.createSecurityRejectionResult(securityDecisions)
    }

    // Check if human escalation is needed
    const needsEscalation = resolutions.some(
      (r) => r.type === 'HUMAN_ESCALATION'
    )

    const finalScore = this.calculateFinalScore(securityDecisions)

    return {
      approved: consensusResult.approved || false,
      requiredChanges: consensusResult.requiredChanges || [],
      conflictResolutions: resolutions,
      securityDecisions,
      finalScore,
      consensusAchieved: consensusResult.consensusAchieved || false,
      escalationRequired: needsEscalation,
    }
  }

  // Helper methods for conflict detection
  private hasConflictingRecommendations(
    result1: AgentValidationResult,
    result2: AgentValidationResult
  ): boolean {
    // Simple heuristic - in practice this would analyze recommendation content
    return (
      result1.status !== result2.status &&
      Math.abs((result1.score || 0) - (result2.score || 0)) > 2.0
    )
  }

  private hasSecurityConflict(
    securityResult: AgentValidationResult,
    otherResult: AgentValidationResult
  ): boolean {
    // Security conflicts when security rejects but others approve
    return (
      securityResult.status === 'REJECTED' && otherResult.status === 'APPROVED'
    )
  }

  private calculateFinalScore(securityDecisions: SecurityDecision[]): number {
    // If security approves, score is positive; if rejects, score is 0
    const hasApproval = securityDecisions.some((d) => d.decision === 'APPROVE')
    const hasRejection = securityDecisions.some((d) => d.decision === 'REJECT')

    if (hasRejection) return 0
    if (hasApproval) return 4.5 // High score for security approval
    return 3.0 // Neutral score for conditional approval
  }

  private validateSecretKey(): string {
    // Return cached key if already validated
    if (ConsensusEngine.secretKeyValidated && ConsensusEngine.cachedSecretKey) {
      return ConsensusEngine.cachedSecretKey
    }

    const secretKey = process.env.AGENT_SECRET_KEY

    if (!secretKey || secretKey === 'default-key') {
      throw new Error(
        'Default secret key detected. Set AGENT_SECRET_KEY environment variable.'
      )
    }

    if (secretKey.length < 16) {
      throw new Error('Secret key must be at least 16 characters long.')
    }

    // Cache the validated key
    ConsensusEngine.cachedSecretKey = secretKey
    ConsensusEngine.secretKeyValidated = true

    return secretKey
  }

  private generateConsensusSignature(result: ConsensusResult): string {
    // Validate secret key before generating signature
    const secretKey = this.validateSecretKey()

    // Generate cryptographic signature for consensus result
    const hash = crypto.createHash('sha256')
    const payload = JSON.stringify({
      approved: result.approved,
      consensusAchieved: result.consensusAchieved,
      finalScore: result.finalScore,
      timestamp: Date.now(),
    })
    hash.update(payload + secretKey)
    return hash.digest('hex')
  }

  private logAuditEntry(entry: AuditEntry): void {
    this.auditLog.push(entry)
    console.log(
      `[CONSENSUS-AUDIT] ${entry.timestamp.toISOString()} - ${entry.action} - ${entry.agent} - ${entry.result}`
    )
  }

  // Public methods for accessing consensus state
  getSecurityDecisions(): Map<string, SecurityDecision> {
    return new Map(this.securityDecisions)
  }

  getAuditTrail(): AuditEntry[] {
    return [...this.auditLog]
  }

  getConsensusRequirements(): ConsensusRequirements {
    return { ...this.consensusRequirements }
  }
}
