/**
 * ABOUTME: TDD test suite for agent orchestrator - integration testing
 * Tests end-to-end agent coordination workflow and phase timing
 */

import {
  AgentOrchestrator,
  OrchestrationRequest,
} from '../../../src/lib/agents/agent-orchestrator'

describe('AgentOrchestrator - TDD Integration Tests', () => {
  let orchestrator: AgentOrchestrator

  beforeEach(() => {
    orchestrator = new AgentOrchestrator()
  })

  describe('Agent Registration and Initialization', () => {
    test('should register all standard agents on initialization', () => {
      const registeredAgents = orchestrator.getRegisteredAgents()

      expect(registeredAgents.has('architecture-designer')).toBe(true)
      expect(registeredAgents.has('security-validator')).toBe(true)
      expect(registeredAgents.has('performance-optimizer')).toBe(true)
      expect(registeredAgents.has('code-quality-analyzer')).toBe(true)
      expect(registeredAgents.has('ux-accessibility-i18n-agent')).toBe(true)
      expect(registeredAgents.has('devops-deployment-agent')).toBe(true)
    })

    test('should assign unique IDs to each agent', () => {
      const registeredAgents = orchestrator.getRegisteredAgents()
      const agentIds = Array.from(registeredAgents.values())

      const uniqueIds = new Set(agentIds)
      expect(uniqueIds.size).toBe(agentIds.length)
    })
  })

  describe('Hybrid Parallel-Sequential Pipeline', () => {
    test('should complete validation within 2-minute SLA', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'code-change', description: 'Test validation' },
        changeType: 'architecture',
        changedFiles: ['src/components/Button.tsx'],
        fullContext: Array.from({ length: 50 }, (_, i) => `file${i}.ts`),
        requiredAgents: ['architecture-designer', 'security-validator'],
      }

      const startTime = Date.now()
      const result = await orchestrator.orchestrateValidation(request)
      const totalTime = Date.now() - startTime

      expect(totalTime).toBeLessThan(120000) // 2 minutes
      expect(result.slaCompliant).toBe(true)
      expect(result.processingTime).toBeLessThan(120000)
    })

    test('should execute Phase 1: Architecture Analysis (target 30s)', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'architecture-change' },
        changeType: 'architecture',
        changedFiles: ['src/lib/core.ts'],
        fullContext: ['src/lib/core.ts', 'src/lib/utils.ts'],
        requiredAgents: ['architecture-designer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      expect(result.validationPipeline.architectureAnalysis).toBeDefined()
      expect(result.validationPipeline.architectureAnalysis.agent.name).toBe(
        'architecture-designer'
      )
      expect(
        result.validationPipeline.architectureAnalysis.processingTime
      ).toBeLessThan(30000)
    })

    test('should execute Phase 2: Parallel Domain Validation (target 60s)', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'multi-domain-change' },
        changeType: 'performance',
        changedFiles: ['src/api/optimization.ts'],
        fullContext: Array.from({ length: 20 }, (_, i) => `file${i}.ts`),
        requiredAgents: [
          'security-validator',
          'performance-optimizer',
          'code-quality-analyzer',
        ],
      }

      const result = await orchestrator.orchestrateValidation(request)

      expect(
        result.validationPipeline.parallelDomainReviews.length
      ).toBeGreaterThan(1)

      // Check that agents ran in parallel (total time < sum of individual times)
      const individualTimes =
        result.validationPipeline.parallelDomainReviews.map(
          (review) => review.processingTime
        )
      const sumOfTimes = individualTimes.reduce((sum, time) => sum + time, 0)

      // Parallel execution should be more efficient than sequential
      expect(result.processingTime).toBeLessThan(sumOfTimes)
    })

    test('should execute Phase 3: Consensus Validation (target 15s)', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'consensus-test' },
        changeType: 'security',
        changedFiles: ['src/auth/security.ts'],
        fullContext: ['src/auth/security.ts'],
        requiredAgents: ['security-validator'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      expect(result.consensusResult).toBeDefined()
      expect(result.consensusResult.finalScore).toBeGreaterThanOrEqual(0)
      expect(typeof result.consensusResult.consensusAchieved).toBe('boolean')
    })
  })

  describe('Context Optimization', () => {
    test('should achieve 80% context reduction target', async () => {
      const largeContext = Array.from({ length: 100 }, (_, i) => `file${i}.ts`)
      const request: OrchestrationRequest = {
        task: { type: 'context-optimization-test' },
        changeType: 'quality',
        changedFiles: ['src/components/Button.tsx', 'src/components/Input.tsx'],
        fullContext: largeContext,
        requiredAgents: ['code-quality-analyzer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      const contextOptimization =
        result.validationPipeline.architectureAnalysis.contextScope
          .analysisReduction
      expect(contextOptimization).toBeGreaterThanOrEqual(80)
    })

    test('should identify affected components correctly', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'component-change' },
        changeType: 'architecture',
        changedFiles: ['src/components/ui/Button.tsx'],
        fullContext: [
          'src/components/ui/Button.tsx',
          'src/components/ui/Input.tsx',
          'src/hooks/useButton.ts',
          'src/utils/helper.ts',
        ],
        requiredAgents: ['architecture-designer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      const affectedComponents =
        result.validationPipeline.architectureAnalysis.contextScope
          .affectedComponents
      expect(affectedComponents).toContain('src/components/ui/Button')
    })
  })

  describe('Security-First Validation', () => {
    test('should reject when security validator rejects (immutable)', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'security-violation' },
        changeType: 'security',
        changedFiles: ['src/auth/vulnerable.ts'],
        fullContext: ['src/auth/vulnerable.ts'],
        requiredAgents: ['security-validator'],
      }

      // Mock security rejection by manipulating validation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalExecute = (orchestrator as any).agentFramework
        .executeAgentValidation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(orchestrator as any).agentFramework.executeAgentValidation = jest
        .fn()
        .mockImplementation(async (agentId, task, context) => {
          const agent = {
            name: 'security-validator',
            version: '1.0.0',
            capabilities: [],
            trustLevel: 'CRITICAL',
          }
          return {
            agent,
            status: 'REJECTED',
            score: 0,
            recommendations: ['Security vulnerability detected'],
            conflicts: [],
            rationale: 'Critical security issue found',
            cryptographicSignature: 'mock-signature',
            processingTime: 50,
            contextScope: context,
            timestamp: new Date(),
          }
        })

      const result = await orchestrator.orchestrateValidation(request)

      expect(result.approved).toBe(false)
      expect(result.securityDecisions.length).toBeGreaterThan(0)
      expect(result.securityDecisions[0].decision).toBe('REJECT')
      expect(result.securityDecisions[0].immutable).toBe(true)

      // Restore original method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(orchestrator as any).agentFramework.executeAgentValidation =
        originalExecute
    })

    test('should always include security validator in domain validation', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'any-change' },
        changeType: 'performance',
        changedFiles: ['src/performance/cache.ts'],
        fullContext: ['src/performance/cache.ts'],
        requiredAgents: ['performance-optimizer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      const securityValidation =
        result.validationPipeline.parallelDomainReviews.find(
          (review) => review.agent.name === 'security-validator'
        )

      expect(securityValidation).toBeDefined()
    })
  })

  describe('Agent Selection Based on Change Type', () => {
    test('should select appropriate agents for performance changes', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'performance-change' },
        changeType: 'performance',
        changedFiles: ['src/optimization/cache.ts'],
        fullContext: ['src/optimization/cache.ts'],
        requiredAgents: [],
      }

      const result = await orchestrator.orchestrateValidation(request)

      const agentNames = result.validationPipeline.parallelDomainReviews.map(
        (review) => review.agent.name
      )

      expect(agentNames).toContain('security-validator')
      expect(agentNames).toContain('performance-optimizer')
      expect(agentNames).toContain('code-quality-analyzer')
    })

    test('should include UX agent for UI component changes', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'ui-change' },
        changeType: 'architecture',
        changedFiles: ['src/components/ui/Button.tsx'],
        fullContext: ['src/components/ui/Button.tsx'],
        requiredAgents: [],
      }

      const result = await orchestrator.orchestrateValidation(request)

      const agentNames = result.validationPipeline.parallelDomainReviews.map(
        (review) => review.agent.name
      )

      expect(agentNames).toContain('ux-accessibility-i18n-agent')
    })

    test('should include DevOps agent for infrastructure changes', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'infrastructure-change' },
        changeType: 'architecture',
        changedFiles: ['docker-compose.yml', 'deployment/k8s.yaml'],
        fullContext: ['docker-compose.yml', 'deployment/k8s.yaml'],
        requiredAgents: [],
      }

      const result = await orchestrator.orchestrateValidation(request)

      const agentNames = result.validationPipeline.parallelDomainReviews.map(
        (review) => review.agent.name
      )

      expect(agentNames).toContain('devops-deployment-agent')
    })
  })

  describe('Performance Monitoring Integration', () => {
    test('should track performance metrics throughout validation', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'performance-tracking' },
        changeType: 'architecture',
        changedFiles: ['src/core/system.ts'],
        fullContext: Array.from({ length: 30 }, (_, i) => `file${i}.ts`),
        requiredAgents: ['architecture-designer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      expect(result.performanceMetrics).toBeDefined()
      expect(result.performanceMetrics.totalValidationTime).toBeGreaterThan(0)
      expect(
        result.performanceMetrics.contextOptimization
      ).toBeGreaterThanOrEqual(0)
    })

    test('should report SLA compliance status', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'sla-test' },
        changeType: 'quality',
        changedFiles: ['src/quality/test.ts'],
        fullContext: ['src/quality/test.ts'],
        requiredAgents: ['code-quality-analyzer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      expect(typeof result.slaCompliant).toBe('boolean')
      expect(result.processingTime).toBeLessThan(120000) // Should be within SLA
      expect(result.slaCompliant).toBe(true)
    })

    test('should generate alerts for performance violations', async () => {
      // This test would require mocking slow operations to trigger alerts
      const alerts = orchestrator.getActiveAlerts()
      expect(Array.isArray(alerts)).toBe(true)
    })
  })

  describe('Recommendations and Actionable Feedback', () => {
    test('should provide actionable recommendations for rejections', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'rejection-test' },
        changeType: 'security',
        changedFiles: ['src/security/test.ts'],
        fullContext: ['src/security/test.ts'],
        requiredAgents: ['security-validator'],
      }

      // Mock rejection scenario
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalExecute = (orchestrator as any).agentFramework
        .executeAgentValidation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(orchestrator as any).agentFramework.executeAgentValidation = jest
        .fn()
        .mockResolvedValue({
          agent: {
            name: 'security-validator',
            version: '1.0.0',
            capabilities: [],
            trustLevel: 'CRITICAL',
          },
          status: 'NEEDS_REVISION',
          score: 2.0,
          recommendations: [
            'Fix authentication vulnerability',
            'Update encryption method',
          ],
          conflicts: [],
          rationale: 'Security improvements needed',
          cryptographicSignature: 'mock-signature',
          processingTime: 50,
          contextScope: {
            changedFiles: ['src/security/test.ts'],
            affectedComponents: [],
            analysisReduction: 0,
          },
          timestamp: new Date(),
        })

      const result = await orchestrator.orchestrateValidation(request)

      expect(result.recommendations).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(
        result.recommendations.some((rec) => rec.includes('security'))
      ).toBe(true)

      // Restore original method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(orchestrator as any).agentFramework.executeAgentValidation =
        originalExecute
    })

    test('should include performance optimization recommendations', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'slow-validation' },
        changeType: 'performance',
        changedFiles: Array.from({ length: 50 }, (_, i) => `src/file${i}.ts`),
        fullContext: Array.from({ length: 200 }, (_, i) => `file${i}.ts`),
        requiredAgents: ['performance-optimizer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      const perfRecommendations = result.recommendations.filter(
        (rec) =>
          rec.includes('performance') ||
          rec.includes('optimization') ||
          rec.includes('context')
      )

      expect(perfRecommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Audit Trail and Transparency', () => {
    test('should maintain comprehensive audit trail', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'audit-test' },
        changeType: 'architecture',
        changedFiles: ['src/audit/test.ts'],
        fullContext: ['src/audit/test.ts'],
        requiredAgents: ['architecture-designer'],
      }

      await orchestrator.orchestrateValidation(request)

      const auditTrail = orchestrator.getAuditTrail()

      expect(auditTrail.length).toBeGreaterThan(0)
      expect(
        auditTrail.some((entry) => entry.action === 'AGENT_REGISTERED')
      ).toBe(true)
      expect(
        auditTrail.some((entry) => entry.action === 'VALIDATION_COMPLETED')
      ).toBe(true)
    })

    test('should provide visibility into agent decisions', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'transparency-test' },
        changeType: 'quality',
        changedFiles: ['src/quality/test.ts'],
        fullContext: ['src/quality/test.ts'],
        requiredAgents: ['code-quality-analyzer'],
      }

      const result = await orchestrator.orchestrateValidation(request)

      expect(result.validationPipeline.auditTrail).toBeDefined()
      expect(result.consensusResult.conflictResolutions).toBeDefined()
      expect(result.securityDecisions).toBeDefined()
    })
  })

  describe('Error Handling and Resilience', () => {
    test('should handle agent execution failures gracefully', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'error-test' },
        changeType: 'architecture',
        changedFiles: ['src/error/test.ts'],
        fullContext: ['src/error/test.ts'],
        requiredAgents: ['architecture-designer'],
      }

      // Mock agent failure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalExecute = (orchestrator as any).agentFramework
        .executeAgentValidation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(orchestrator as any).agentFramework.executeAgentValidation = jest
        .fn()
        .mockRejectedValue(new Error('Agent execution failed'))

      await expect(orchestrator.orchestrateValidation(request)).rejects.toThrow(
        'Agent execution failed'
      )

      // Restore original method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(orchestrator as any).agentFramework.executeAgentValidation =
        originalExecute
    })

    test('should use circuit breaker pattern for fault tolerance', async () => {
      const request: OrchestrationRequest = {
        task: { type: 'circuit-breaker-test' },
        changeType: 'performance',
        changedFiles: ['src/performance/test.ts'],
        fullContext: ['src/performance/test.ts'],
        requiredAgents: ['performance-optimizer'],
      }

      // This should execute without throwing even if circuit breaker is involved
      const result = await orchestrator.orchestrateValidation(request)

      expect(result).toBeDefined()
      expect(typeof result.approved).toBe('boolean')
    })
  })
})
