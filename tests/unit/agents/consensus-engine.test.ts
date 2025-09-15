/**
 * ABOUTME: TDD test suite for consensus engine - security-first validation
 * Tests multi-signature validation and immutable security decisions
 */

import { ConsensusEngine } from '../../../src/lib/agents/consensus-engine'
import { AgentType, AgentValidationResult } from '../../../src/lib/agents/agent-coordination'

describe('ConsensusEngine - TDD Implementation', () => {
  let consensusEngine: ConsensusEngine
  let mockSecurityAgent: AgentType
  let mockArchitectureAgent: AgentType
  let mockPerformanceAgent: AgentType
  let mockQualityAgent: AgentType

  beforeEach(() => {
    consensusEngine = new ConsensusEngine()

    mockSecurityAgent = {
      name: 'security-validator',
      version: '1.0.0',
      capabilities: ['vulnerability-assessment'],
      trustLevel: 'CRITICAL',
    }

    mockArchitectureAgent = {
      name: 'architecture-designer',
      version: '1.0.0',
      capabilities: ['system-design'],
      trustLevel: 'HIGH',
    }

    mockPerformanceAgent = {
      name: 'performance-optimizer',
      version: '1.0.0',
      capabilities: ['performance-analysis'],
      trustLevel: 'HIGH',
    }

    mockQualityAgent = {
      name: 'code-quality-analyzer',
      version: '1.0.0',
      capabilities: ['code-review'],
      trustLevel: 'HIGH',
    }
  })

  describe('Security-First Authority Model', () => {
    test('should approve when security validator approves', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.5),
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 4.2),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.approved).toBe(true)
      expect(result.securityDecisions).toHaveLength(1)
      expect(result.securityDecisions[0].decision).toBe('APPROVE')
      expect(result.securityDecisions[0].immutable).toBe(true)
    })

    test('should reject when security validator rejects (immutable)', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'REJECTED', 1.0),
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 4.5),
        createMockValidationResult(mockPerformanceAgent, 'APPROVED', 4.8),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.approved).toBe(false)
      expect(result.consensusAchieved).toBe(false)
      expect(result.escalationRequired).toBe(false) // Security decisions are final
      expect(result.securityDecisions[0].decision).toBe('REJECT')
      expect(result.securityDecisions[0].immutable).toBe(true)
    })

    test('should store immutable security decisions', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
      ]

      await consensusEngine.validateConsensus(validationResults, 'security')

      const securityDecisions = consensusEngine.getSecurityDecisions()
      expect(securityDecisions.size).toBe(1)

      const decision = Array.from(securityDecisions.values())[0]
      expect(decision.immutable).toBe(true)
      expect(decision.signature).toBeDefined()
    })
  })

  describe('Multi-Signature Validation', () => {
    test('should require architecture-designer approval for architecture changes', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        // Missing architecture-designer approval
        createMockValidationResult(mockPerformanceAgent, 'APPROVED', 4.5),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.approved).toBe(false)
      expect(result.requiredChanges).toContain(
        expect.stringContaining(
          'Missing required approval from architecture-designer'
        )
      )
    })

    test('should require minimum scores for approvals', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 3.0), // Below 4.0 minimum
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.approved).toBe(false)
      expect(result.requiredChanges).toContain(
        expect.stringContaining('scored below minimum')
      )
    })

    test('should achieve consensus with all required approvals', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 4.2),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.approved).toBe(true)
      expect(result.consensusAchieved).toBe(true)
      expect(result.requiredChanges).toHaveLength(0)
    })

    test('should enforce different requirements for different change types', async () => {
      // Performance changes require performance-optimizer + code-quality-analyzer
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        createMockValidationResult(mockPerformanceAgent, 'APPROVED', 4.5),
        createMockValidationResult(mockQualityAgent, 'APPROVED', 4.2),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'performance'
      )

      expect(result.approved).toBe(true)
      expect(result.consensusAchieved).toBe(true)
    })
  })

  describe('Veto Power and Security Override', () => {
    test('should allow security-validator to veto any change', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'REJECTED', 2.0), // Security veto
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 4.5),
        createMockValidationResult(mockPerformanceAgent, 'APPROVED', 4.8),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'performance'
      )

      expect(result.approved).toBe(false)
      expect(result.requiredChanges).toContain(
        expect.stringContaining('security-validator exercised veto power')
      )
    })

    test('should prioritize security conflicts with override', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'REJECTED', 1.0),
        createMockValidationResult(mockPerformanceAgent, 'APPROVED', 4.5),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'performance'
      )

      expect(result.conflictResolutions).toContainEqual(
        expect.objectContaining({
          type: 'SECURITY_OVERRIDE',
          rationale: expect.stringContaining('immutable'),
        })
      )
    })
  })

  describe('Conflict Detection and Resolution', () => {
    test('should detect architectural vs performance conflicts', async () => {
      const archResult = createMockValidationResult(
        mockArchitectureAgent,
        'APPROVED',
        4.5
      )
      const perfResult = createMockValidationResult(
        mockPerformanceAgent,
        'REJECTED',
        2.0
      )

      const validationResults = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        archResult,
        perfResult,
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.conflictResolutions).toContainEqual(
        expect.objectContaining({
          type: 'CONSENSUS',
          requiredApprovals: expect.arrayContaining([
            'architecture-designer',
            'performance-optimizer',
          ]),
        })
      )
    })

    test('should resolve security conflicts with security override', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'REJECTED', 1.0),
        createMockValidationResult(mockQualityAgent, 'APPROVED', 4.5),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'quality'
      )

      expect(result.conflictResolutions).toContainEqual(
        expect.objectContaining({
          type: 'SECURITY_OVERRIDE',
        })
      )
    })

    test('should require human escalation for unknown conflicts', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        createMockValidationResult(
          mockArchitectureAgent,
          'NEEDS_REVISION',
          3.5
        ),
      ]

      // Force an unknown conflict type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engine = consensusEngine as any
      const originalDetectConflicts = engine.detectConflicts
      engine.detectConflicts = jest.fn().mockReturnValue([
        {
          conflictType: 'UNKNOWN',
          severity: 'HIGH',
          description: 'Unknown conflict',
          affectedAgents: ['test-agent-1', 'test-agent-2'],
        },
      ])

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.escalationRequired).toBe(true)
      expect(result.conflictResolutions).toContainEqual(
        expect.objectContaining({
          type: 'HUMAN_ESCALATION',
        })
      )

      // Restore original method
      engine.detectConflicts = originalDetectConflicts
    })
  })

  describe('Final Score Calculation', () => {
    test('should calculate high score for security approval', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 4.2),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.finalScore).toBe(4.5) // High score for security approval
    })

    test('should set zero score for security rejection', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'REJECTED', 1.0),
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 4.5),
      ]

      const result = await consensusEngine.validateConsensus(
        validationResults,
        'architecture'
      )

      expect(result.finalScore).toBe(0) // Zero score for security rejection
    })
  })

  describe('Audit Trail and Transparency', () => {
    test('should maintain comprehensive audit trail', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'APPROVED', 4.0),
        createMockValidationResult(mockArchitectureAgent, 'APPROVED', 4.2),
      ]

      await consensusEngine.validateConsensus(validationResults, 'architecture')

      const auditTrail = consensusEngine.getAuditTrail()
      expect(auditTrail.length).toBeGreaterThan(0)
      expect(auditTrail[0].action).toContain('SECURITY_DECISION')
      expect(auditTrail[auditTrail.length - 1].action).toBe(
        'CONSENSUS_VALIDATION'
      )
    })

    test('should log conflict resolutions', async () => {
      const validationResults: AgentValidationResult[] = [
        createMockValidationResult(mockSecurityAgent, 'REJECTED', 1.0),
        createMockValidationResult(mockPerformanceAgent, 'APPROVED', 4.5),
      ]

      await consensusEngine.validateConsensus(validationResults, 'performance')

      const auditTrail = consensusEngine.getAuditTrail()
      const conflictResolution = auditTrail.find(
        (entry) => entry.action === 'CONFLICT_RESOLVED'
      )

      expect(conflictResolution).toBeDefined()
      expect(conflictResolution?.details).toMatchObject({
        conflictType: 'SECURITY',
        resolutionType: 'SECURITY_OVERRIDE',
      })
    })
  })

  describe('Consensus Requirements Configuration', () => {
    test('should expose consensus requirements for transparency', () => {
      const requirements = consensusEngine.getConsensusRequirements()

      expect(requirements.security.immutable).toBe(true)
      expect(requirements.security.vetoPower).toContain('security-validator')
      expect(requirements.architecture.requiredApprovals).toContain(
        'architecture-designer'
      )
      expect(requirements.performance.requiredApprovals).toContain(
        'performance-optimizer'
      )
      expect(requirements.quality.requiredApprovals).toContain(
        'code-quality-analyzer'
      )
    })
  })

  // Helper function to create mock validation results
  function createMockValidationResult(
    agent: AgentType,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION',
    score: number
  ): AgentValidationResult {
    return {
      agent,
      status,
      score,
      recommendations: [`${agent.name} recommendation`],
      conflicts: [],
      rationale: `${agent.name} rationale for ${status}`,
      cryptographicSignature: 'mock-signature-' + Math.random(),
      processingTime: Math.random() * 100,
      contextScope: {
        changedFiles: ['test.ts'],
        affectedComponents: ['test-component'],
        analysisReduction: 80,
      },
      timestamp: new Date(),
    }
  }
})
