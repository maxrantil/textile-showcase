// ABOUTME: Agent orchestration system - Phase 1 implementation
// Coordinates agent isolation, consensus validation, and performance monitoring

import {
  AgentIsolationFramework,
  AgentType,
  AgentValidationResult,
  ValidationPipeline,
  PerformanceMetrics,
} from './agent-coordination'
import { ConsensusEngine, ConsensusResult } from './consensus-engine'
import { PerformanceMonitor, PerformanceAlert } from './performance-monitor'

export interface OrchestrationRequest {
  task: unknown
  changeType: 'architecture' | 'security' | 'performance' | 'quality'
  changedFiles: string[]
  fullContext: string[]
  requiredAgents: string[]
}

export interface OrchestrationResult {
  approved: boolean
  validationPipeline: ValidationPipeline
  consensusResult: ConsensusResult
  performanceMetrics: PerformanceMetrics
  recommendations: string[]
  securityDecisions: Array<{
    decision: string
    rationale: string
    immutable: boolean
    signature: string
    timestamp: Date
  }>
  processingTime: number
  slaCompliant: boolean
}

export class AgentOrchestrator {
  private agentFramework: AgentIsolationFramework
  private consensusEngine: ConsensusEngine
  private performanceMonitor: PerformanceMonitor
  private registeredAgents: Map<string, string> = new Map() // name -> id mapping

  constructor() {
    this.agentFramework = new AgentIsolationFramework()
    this.consensusEngine = new ConsensusEngine()
    this.performanceMonitor = new PerformanceMonitor()

    // Register standard agents
    this.initializeStandardAgents()
  }

  // Main orchestration entry point - implements hybrid parallel-sequential pipeline
  async orchestrateValidation(
    request: OrchestrationRequest
  ): Promise<OrchestrationResult> {
    const startTime = Date.now()

    console.log(
      `[ORCHESTRATOR] Starting validation for ${request.changeType} change affecting ${request.changedFiles.length} files`
    )

    try {
      // Phase 1: Architecture Analysis (30 seconds)
      const architectureResult = await this.performArchitectureAnalysis(request)

      // Phase 2: Parallel Domain Validation (60 seconds)
      const domainResults = await this.performParallelDomainValidation(request)

      // Phase 3: Consensus-Based Cross-Validation (15 seconds)
      const consensusResult = await this.performConsensusValidation(
        [architectureResult, ...domainResults],
        request.changeType
      )

      // Build validation pipeline
      const validationPipeline: ValidationPipeline = {
        architectureAnalysis: architectureResult,
        parallelDomainReviews: domainResults,
        consensusValidation: consensusResult.conflictResolutions,
        performanceBenchmarks: this.agentFramework.getPerformanceMetrics(),
        finalConsensus: consensusResult.consensusAchieved,
        auditTrail: this.agentFramework.getAuditTrail(),
      }

      // Monitor performance SLA compliance
      const performanceMetrics =
        await this.performanceMonitor.monitorValidationPipeline(
          validationPipeline,
          startTime
        )

      const processingTime = Date.now() - startTime
      const slaCompliant = performanceMetrics.totalValidationTime <= 120000 // 2 minutes

      const result: OrchestrationResult = {
        approved: consensusResult.approved,
        validationPipeline,
        consensusResult,
        performanceMetrics,
        recommendations: this.generateRecommendations(
          consensusResult,
          performanceMetrics
        ),
        securityDecisions: Array.from(
          this.consensusEngine.getSecurityDecisions().values()
        ),
        processingTime,
        slaCompliant,
      }

      console.log(
        `[ORCHESTRATOR] Validation completed in ${processingTime}ms - ${result.approved ? 'APPROVED' : 'REJECTED'}`
      )

      return result
    } catch (error) {
      console.error(`[ORCHESTRATOR] Validation failed:`, error)
      throw error
    }
  }

  // Phase 1: Architecture Analysis (30 seconds target)
  private async performArchitectureAnalysis(
    request: OrchestrationRequest
  ): Promise<AgentValidationResult> {
    console.log(`[ORCHESTRATOR] Phase 1: Architecture Analysis`)

    const architectAgentId = this.registeredAgents.get('architecture-designer')
    if (!architectAgentId) {
      throw new Error('Architecture designer agent not registered')
    }

    // Optimize context for architecture analysis
    const context = this.agentFramework.optimizeValidationContext(
      request.fullContext,
      request.changedFiles
    )

    return await this.performanceMonitor.executeWithCircuitBreaker(
      'architecture-analysis',
      async () => {
        return await this.agentFramework.executeAgentValidation(
          architectAgentId,
          request.task,
          context
        )
      }
    )
  }

  // Phase 2: Parallel Domain Validation (60 seconds target)
  private async performParallelDomainValidation(
    request: OrchestrationRequest
  ): Promise<AgentValidationResult[]> {
    console.log(`[ORCHESTRATOR] Phase 2: Parallel Domain Validation`)

    // Determine required domain agents based on change type and request
    const domainAgents = this.getDomainAgentsForValidation(request)

    // Optimize context for domain validation
    const context = this.agentFramework.optimizeValidationContext(
      request.fullContext,
      request.changedFiles
    )

    return await this.performanceMonitor.executeWithCircuitBreaker(
      'parallel-domain-validation',
      async () => {
        return await this.agentFramework.executeParallelValidation(
          domainAgents,
          request.task,
          context
        )
      }
    )
  }

  // Phase 3: Consensus-Based Cross-Validation (15 seconds target)
  private async performConsensusValidation(
    validationResults: AgentValidationResult[],
    changeType: OrchestrationRequest['changeType']
  ): Promise<ConsensusResult> {
    console.log(`[ORCHESTRATOR] Phase 3: Consensus-Based Cross-Validation`)

    return await this.performanceMonitor.executeWithCircuitBreaker(
      'consensus-validation',
      async () => {
        return await this.consensusEngine.validateConsensus(
          validationResults,
          changeType
        )
      }
    )
  }

  // Initialize standard agents with proper configuration
  private initializeStandardAgents(): void {
    const standardAgents: AgentType[] = [
      {
        name: 'architecture-designer',
        version: '1.0.0',
        capabilities: [
          'system-design',
          'component-architecture',
          'technical-approach',
        ],
        trustLevel: 'HIGH',
        certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t', // Mock valid cert for HIGH trust
      },
      {
        name: 'security-validator',
        version: '1.0.0',
        capabilities: [
          'vulnerability-assessment',
          'compliance-check',
          'threat-analysis',
        ],
        trustLevel: 'CRITICAL',
        certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t', // Mock valid cert for CRITICAL trust
      },
      {
        name: 'performance-optimizer',
        version: '1.0.0',
        capabilities: [
          'performance-analysis',
          'resource-optimization',
          'bottleneck-detection',
        ],
        trustLevel: 'HIGH',
        certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t', // Mock valid cert for HIGH trust
      },
      {
        name: 'code-quality-analyzer',
        version: '1.0.0',
        capabilities: ['code-review', 'testing-coverage', 'best-practices'],
        trustLevel: 'HIGH',
        certificate: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t', // Mock valid cert for HIGH trust
      },
      {
        name: 'ux-accessibility-i18n-agent',
        version: '1.0.0',
        capabilities: [
          'accessibility-compliance',
          'internationalization',
          'user-experience',
        ],
        trustLevel: 'MEDIUM',
      },
      {
        name: 'devops-deployment-agent',
        version: '1.0.0',
        capabilities: [
          'deployment-automation',
          'infrastructure-management',
          'ci-cd-optimization',
        ],
        trustLevel: 'MEDIUM',
      },
    ]

    for (const agent of standardAgents) {
      const agentId = this.agentFramework.registerAgent(agent)
      this.registeredAgents.set(agent.name, agentId)
      console.log(`[ORCHESTRATOR] Registered agent: ${agent.name} (${agentId})`)
    }
  }

  // Determine which domain agents are needed for validation
  private getDomainAgentsForValidation(
    request: OrchestrationRequest
  ): string[] {
    const agentIds: string[] = []

    // Security validator is always required (security-first principle)
    const securityId = this.registeredAgents.get('security-validator')
    if (securityId) agentIds.push(securityId)

    // Add performance optimizer for performance-critical changes
    if (
      request.changeType === 'performance' ||
      this.hasPerformanceImpact(request)
    ) {
      const perfId = this.registeredAgents.get('performance-optimizer')
      if (perfId) agentIds.push(perfId)
    }

    // Add code quality analyzer for all code changes
    const qualityId = this.registeredAgents.get('code-quality-analyzer')
    if (qualityId) agentIds.push(qualityId)

    // Add UX agent for user-facing changes
    if (this.hasUXImpact(request)) {
      const uxId = this.registeredAgents.get('ux-accessibility-i18n-agent')
      if (uxId) agentIds.push(uxId)
    }

    // Add DevOps agent for infrastructure changes
    if (this.hasInfrastructureImpact(request)) {
      const devopsId = this.registeredAgents.get('devops-deployment-agent')
      if (devopsId) agentIds.push(devopsId)
    }

    return agentIds
  }

  // Heuristics for determining impact types
  private hasPerformanceImpact(request: OrchestrationRequest): boolean {
    return request.changedFiles.some(
      (file) =>
        file.includes('performance') ||
        file.includes('optimization') ||
        file.includes('cache') ||
        file.includes('database')
    )
  }

  private hasUXImpact(request: OrchestrationRequest): boolean {
    return request.changedFiles.some(
      (file) =>
        file.includes('component') ||
        file.includes('ui/') ||
        file.includes('style') ||
        file.includes('accessibility')
    )
  }

  private hasInfrastructureImpact(request: OrchestrationRequest): boolean {
    return request.changedFiles.some(
      (file) =>
        file.includes('docker') ||
        file.includes('deploy') ||
        file.includes('.yml') ||
        file.includes('infrastructure')
    )
  }

  // Generate actionable recommendations based on validation results
  private generateRecommendations(
    consensusResult: ConsensusResult,
    performanceMetrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = []

    // Add consensus-based recommendations
    if (!consensusResult.approved) {
      recommendations.push(...consensusResult.requiredChanges)
    }

    // Add performance-based recommendations
    if (performanceMetrics.totalValidationTime > 120000) {
      recommendations.push(
        'Consider optimizing validation context to improve performance'
      )
    }

    if (performanceMetrics.contextOptimization < 80) {
      recommendations.push(
        'Improve dependency analysis to achieve better context optimization'
      )
    }

    // Add security-based recommendations
    const hasSecurityRejection = consensusResult.securityDecisions.some(
      (d) => d.decision === 'REJECT'
    )
    if (hasSecurityRejection) {
      recommendations.push(
        'Security requirements must be addressed before proceeding'
      )
    }

    // Add conflict resolution recommendations
    for (const resolution of consensusResult.conflictResolutions) {
      if (resolution.type === 'HUMAN_ESCALATION') {
        recommendations.push('Human review required to resolve agent conflicts')
      }
    }

    return recommendations
  }

  // Public getters for monitoring and debugging
  getRegisteredAgents(): Map<string, string> {
    return new Map(this.registeredAgents)
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.agentFramework.getPerformanceMetrics()
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.performanceMonitor.getActiveAlerts()
  }

  getAuditTrail(): Array<{
    timestamp: Date
    action: string
    agent: string
    result: string
    signature: string
    details: Record<string, unknown>
  }> {
    return [
      ...this.agentFramework.getAuditTrail(),
      ...this.consensusEngine.getAuditTrail(),
      ...this.performanceMonitor.getAuditTrail(),
    ]
  }
}
