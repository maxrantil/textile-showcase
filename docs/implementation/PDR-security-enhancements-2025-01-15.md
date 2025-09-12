# PDR: Security Enhancement Project Technical Design

**Document Information:**

- **Project**: Textile Showcase Security Enhancement
- **Creation Date**: 2025-01-15
- **Version**: 1.0
- **Status**: DRAFT - Awaiting Agent Review
- **Author**: Development Team
- **Stakeholder**: Doctor Hubert
- **Related PRD**: PRD-security-enhancements-2025-01-15.md

---

## Executive Summary

**Technical Approach**: Implement security enhancements through TypeScript type system fixes, centralized security event logging, accessibility-compliant monitoring dashboard, and automated security scanning integration.

**Architecture Impact**: Additive security components with minimal disruption to existing systems. Leverages current infrastructure while introducing new monitoring and alerting capabilities.

**Implementation Strategy**: 7-day phased approach with feature flags, comprehensive testing, and rollback procedures.

**Risk Mitigation**: Performance monitoring, gradual rollout, and established rollback mechanisms ensure system stability throughout implementation.

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Application   │    │   Security Layer     │    │   Monitoring    │
│                 │    │                      │    │   Dashboard     │
│ ┌─────────────┐ │    │ ┌──────────────────┐ │    │ ┌─────────────┐ │
│ │Contact Form │ │◄──►│ │Security Event    │ │◄──►│ │Real-time    │ │
│ │Validation   │ │    │ │Logging Service   │ │    │ │Security     │ │
│ └─────────────┘ │    │ └──────────────────┘ │    │ │Status       │ │
│                 │    │                      │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌──────────────────┐ │    │ ┌─────────────┐ │
│ │Credentials  │ │◄──►│ │Alert System      │ │◄──►│ │Alert        │ │
│ │System       │ │    │ │(ARIA Live)      │ │    │ │Management   │ │
│ └─────────────┘ │    │ └──────────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
        │                         │                         │
        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│  Type System    │    │   Security Scanner   │    │  Alert Channels │
│  Fixes          │    │   Integration        │    │  (Email/SMS)    │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
```

### Component Integration Points

#### 1. TypeScript Credentials System

- **Location**: `scripts/setup-credentials.ts`
- **Current Issue**: Environment type mismatch on line 152
- **Integration**: Core authentication and configuration system
- **Impact**: Build process and runtime environment handling

#### 2. Security Event Logging Service

- **Integration**: Middleware layer in existing Express/Next.js stack
- **Storage**: Append to existing log infrastructure
- **Performance**: <5% overhead requirement through async processing

#### 3. Security Monitoring Dashboard

- **Technology**: React component integrated into existing UI framework
- **Accessibility**: WCAG 2.1 AA compliant with ARIA live regions
- **Authentication**: Leverages existing auth middleware

#### 4. Alert System

- **Channels**: Email notifications, dashboard alerts, system logs
- **Accessibility**: Screen reader compatible with user-controlled timeouts
- **Integration**: Hooks into existing notification infrastructure

---

## Technical Implementation Plan

### Phase 1: TypeScript Type System Fixes (Days 1-2)

#### 1.1 Comprehensive Type Analysis

**Objective**: Resolve all TypeScript errors in credentials system

**Technical Approach**:

```typescript
// Current problematic code pattern (setup-credentials.ts:152)
interface EnvironmentConfig {
  environment: 'production' | 'development' | 'test' | 'staging' // Issue: 'staging' not in type union
}

// Resolution approach
interface EnvironmentConfig {
  environment: 'production' | 'development' | 'test'
  deploymentStage?: 'staging' | 'production' // Separate deployment context
}
```

**Implementation Steps**:

1. Run comprehensive type check: `npx tsc --noEmit --strict`
2. Map all type errors in credentials system
3. Refactor environment type definitions
4. Update configuration interfaces
5. Validate against all environment configurations

**Validation Criteria**:

- Zero TypeScript build warnings
- All environment types properly defined
- Configuration system works across dev/test/prod
- No runtime type errors

#### 1.2 Build Process Integration

**Objective**: Ensure clean build pipeline

**Technical Tasks**:

- Update tsconfig.json if needed for stricter type checking
- Integrate type validation into pre-commit hooks
- Document type patterns for future development
- Create type testing utilities

### Phase 2: Security Event Logging Service (Days 2-3)

#### 2.1 Logging Architecture Design

**Technical Specification**:

```typescript
interface SecurityEvent {
  id: string
  timestamp: Date
  eventType:
    | 'authentication'
    | 'validation_failure'
    | 'rate_limit'
    | 'api_key_usage'
  severity: 'info' | 'warning' | 'error' | 'critical'
  metadata: {
    userAgent?: string
    ipAddress?: string
    endpoint?: string
    errorDetails?: string
  }
  accessibility: {
    screenReaderText: string
    ariaLabel: string
  }
}

class SecurityEventLogger {
  async logEvent(event: SecurityEvent): Promise<void>
  async getEvents(filters: SecurityEventFilter): Promise<SecurityEvent[]>
  async getEventStream(): Promise<ReadableStream<SecurityEvent>>
}
```

#### 2.2 Performance Optimization Strategy

**Performance Requirements**: <5% overhead impact

**Optimization Techniques**:

- Async event processing with worker threads
- Event batching for high-volume scenarios
- Structured logging with JSON format
- Configurable log levels for production

**Implementation Approach**:

```typescript
// Async logging to prevent performance impact
const securityLogger = new AsyncSecurityLogger({
  batchSize: 50,
  flushInterval: 5000, // 5 seconds
  maxQueueSize: 1000,
})

// Usage in middleware
app.use(async (req, res, next) => {
  // Non-blocking security event logging
  securityLogger
    .logEvent({
      eventType: 'authentication',
      // ... event details
    })
    .catch((err) => console.error('Logging error:', err))

  next()
})
```

#### 2.3 Integration Points

**Existing Systems Integration**:

- Contact form validation middleware
- Authentication middleware
- Rate limiting middleware
- API key validation middleware

**Storage Integration**:

- Append to existing log files
- Structured format compatible with log aggregation
- Retention policy aligned with security requirements

### Phase 3: Security Monitoring Dashboard (Days 3-5)

#### 3.1 Dashboard Architecture

**Technology Stack**:

- React functional components with hooks
- Existing UI component library (consistent styling)
- Real-time updates via WebSocket or Server-Sent Events
- State management integrated with existing Redux/Context patterns

**Accessibility Implementation**:

```typescript
// WCAG 2.1 AA Compliant Dashboard Component
interface SecurityDashboardProps {
  events: SecurityEvent[]
  alerts: SecurityAlert[]
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ events, alerts }) => {
  return (
    <div role="main" aria-label="Security Monitoring Dashboard">
      <h1>Security Status</h1>

      {/* ARIA Live Region for Real-time Updates */}
      <div
        aria-live="polite"
        aria-label="Security status updates"
        className="sr-only"
      >
        {latestUpdate}
      </div>

      {/* High Contrast Support */}
      <div className="security-status" style={{
        backgroundColor: statusColor,
        color: getContrastColor(statusColor), // Ensures 4.5:1 ratio
        fontSize: '1.1rem' // Meets minimum size requirements
      }}>
        <SecurityStatusIndicator
          status={currentStatus}
          ariaLabel={`Current security status: ${currentStatus}`}
        />
      </div>

      {/* Keyboard Navigation Support */}
      <SecurityEventsList
        events={events}
        onKeyDown={handleKeyboardNavigation}
        tabIndex={0}
      />
    </div>
  )
}
```

#### 3.2 Internationalization Framework

**i18n Implementation**:

```typescript
// Security-specific i18n keys
const securityI18nKeys = {
  'security.status.active': {
    en: 'System Active',
    es: 'Sistema Activo',
    fr: 'Système Actif',
  },
  'security.alert.rateLimitExceeded': {
    en: 'Rate limit exceeded for {endpoint}',
    es: 'Límite de velocidad excedido para {endpoint}',
    fr: 'Limite de débit dépassée pour {endpoint}',
  },
  // ... additional security terms
}

// Locale-aware formatting
const formatSecurityTimestamp = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'local',
  }).format(date)
}

const formatSecurityCount = (count: number, locale: string) => {
  return new Intl.NumberFormat(locale).format(count)
}
```

#### 3.3 Mobile Accessibility Implementation

**Mobile-First Design**:

```css
/* Mobile-optimized touch targets */
.security-dashboard-button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  margin: 4px;
  border-radius: 4px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .security-status-indicator {
    border: 2px solid;
    filter: contrast(150%);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .security-alert-animation {
    animation: none;
  }
}
```

### Phase 4: Alert System Implementation (Days 4-5)

#### 4.1 ARIA Live Regions for Accessibility

**Screen Reader Integration**:

```typescript
interface SecurityAlertProps {
  alert: SecurityAlert
  onDismiss: (alertId: string) => void
  userControlledTimeout?: number
}

const SecurityAlertSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [userPreferences, setUserPreferences] = useState({
    enableAudio: false,
    alertTimeout: 10000, // User-controllable
    enableLiveRegion: true
  })

  return (
    <>
      {/* Polite announcements for non-critical alerts */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="security-alerts-polite"
      >
        {alerts.filter(a => a.severity !== 'critical').map(alert =>
          <SecurityAlertAnnouncement key={alert.id} alert={alert} />
        )}
      </div>

      {/* Assertive announcements for critical alerts */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="security-alerts-critical"
      >
        {alerts.filter(a => a.severity === 'critical').map(alert =>
          <SecurityAlertAnnouncement key={alert.id} alert={alert} />
        )}
      </div>

      {/* Visual alert display */}
      <div className="security-alerts-visual">
        {alerts.map(alert => (
          <SecurityAlert
            key={alert.id}
            alert={alert}
            onDismiss={handleDismiss}
            timeout={userPreferences.alertTimeout}
          />
        ))}
      </div>
    </>
  )
}
```

#### 4.2 Keyboard Navigation Support

**Keyboard Shortcuts**:

- `Alt + S`: Open security dashboard
- `Escape`: Dismiss current alert
- `Tab`: Navigate through security controls
- `Enter/Space`: Activate security actions
- `Arrow keys`: Navigate alert list

### Phase 5: Automated Security Scanning Integration (Days 5-6)

#### 5.1 Security Scanner Integration

**Technical Approach**:

```typescript
interface SecurityScanConfig {
  schedule: string // Cron format
  scanTypes: ('dependencies' | 'code' | 'configuration')[]
  alertThresholds: {
    critical: number
    high: number
    medium: number
  }
}

class SecurityScanner {
  async runDependencyScan(): Promise<SecurityScanResult>
  async runCodeScan(): Promise<SecurityScanResult>
  async runConfigurationScan(): Promise<SecurityScanResult>

  async scheduleScans(config: SecurityScanConfig): Promise<void>
  async getLatestResults(): Promise<SecurityScanResult[]>
}
```

**Integration with Existing CI/CD**:

- Pre-commit hooks for immediate feedback
- Scheduled scans in CI pipeline
- Results integrated into security dashboard
- Automated alerts for new vulnerabilities

### Phase 6: Testing and Validation (Day 7)

#### 6.1 Accessibility Testing Strategy

**WCAG 2.1 AA Compliance Testing**:

```bash
# Automated accessibility testing
npm run test:accessibility  # axe-core integration
npm run test:contrast      # Color contrast validation
npm run test:keyboard      # Keyboard navigation testing
npm run test:screen-reader # Screen reader compatibility
```

**Manual Testing Checklist**:

- [ ] Keyboard-only navigation through security dashboard
- [ ] Screen reader announcement verification (NVDA/JAWS)
- [ ] Color contrast measurement (minimum 4.5:1)
- [ ] Mobile touch target validation (minimum 44px)
- [ ] High contrast mode testing
- [ ] Reduced motion preference respect

#### 6.2 Performance Testing

**Performance Validation**:

```typescript
// Performance monitoring during security logging
const performanceMonitor = {
  async measureSecurityLoggingOverhead(): Promise<number> {
    const baseline = await measureBaselinePerformance()
    const withLogging = await measurePerformanceWithLogging()
    return ((withLogging - baseline) / baseline) * 100 // Should be <5%
  },

  async validateDashboardLoadTime(): Promise<number> {
    // Dashboard should load in <2 seconds
    return await measureComponentLoadTime('SecurityDashboard')
  },
}
```

#### 6.3 Integration Testing

**Security Component Integration**:

- TypeScript builds cleanly across all environments
- Security events logged correctly for all triggers
- Dashboard displays real-time data accurately
- Alerts function properly with accessibility features
- Mobile interface works on various devices
- Internationalization works for multiple locales

---

## Infrastructure Requirements

### Development Environment Setup

**Required Dependencies**:

```json
{
  "devDependencies": {
    "@axe-core/react": "^4.8.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest-axe": "^8.0.0",
    "cypress-axe": "^1.5.0"
  },
  "dependencies": {
    "react-aria": "^3.32.0",
    "date-fns": "^2.30.0",
    "@internationalization/date": "^3.5.0"
  }
}
```

### Production Environment

**Infrastructure Requirements**:

- No new servers required (uses existing infrastructure)
- Log storage: Additional 10-50MB daily for security events
- Dashboard hosting: Integrated into existing web application
- Performance monitoring: Existing monitoring tools extended

**Security Considerations**:

- Security logs encrypted at rest
- Dashboard access restricted to authenticated admins
- Alert channels secured with proper authentication
- Audit trail for all security configuration changes

---

## Rollback Strategy

### Rollback Triggers

- Performance degradation >5%
- TypeScript build failures
- Accessibility compliance failures
- Security vulnerability introduction
- Critical system instability

### Rollback Procedures

1. **Immediate Rollback** (< 5 minutes)

   - Disable feature flags for new security components
   - Revert to previous TypeScript configuration
   - Disable security event logging if causing issues

2. **Partial Rollback** (< 30 minutes)

   - Keep beneficial components (type fixes)
   - Disable problematic components (dashboard, logging)
   - Maintain system stability while addressing issues

3. **Full Rollback** (< 60 minutes)
   - Complete revert to previous system state
   - All security enhancements disabled
   - Original functionality fully restored

### Rollback Validation

- Automated testing after rollback completion
- Performance monitoring to confirm restoration
- User acceptance testing for critical paths
- Documentation of rollback reasons and lessons learned

---

## Security Considerations

### Security Event Log Protection

- **Encryption**: All security logs encrypted at rest using AES-256
- **Access Control**: Role-based access to security dashboard
- **Integrity**: Hash verification for log entries to prevent tampering
- **Retention**: 90-day retention with secure archival procedures

### Dashboard Security

- **Authentication**: Multi-factor authentication for dashboard access
- **Authorization**: Role-based permissions for security functions
- **Session Management**: Secure session handling with timeout
- **HTTPS**: All dashboard traffic encrypted in transit

### Alert System Security

- **Channel Security**: Encrypted email/SMS alert delivery
- **Authentication**: Verified alert channels to prevent spoofing
- **Rate Limiting**: Alert rate limiting to prevent spam attacks
- **Audit Trail**: All alert activities logged for security review

---

## Performance Specifications

### Performance Requirements

| Component           | Requirement              | Measurement Method                              |
| ------------------- | ------------------------ | ----------------------------------------------- |
| Security Logging    | <5% overhead             | Performance monitoring during normal operations |
| Dashboard Load Time | <2 seconds initial load  | Browser performance timing API                  |
| Real-time Updates   | <30 seconds latency      | WebSocket/SSE monitoring                        |
| Alert Delivery      | <60 seconds notification | End-to-end alert timing                         |
| Mobile Interface    | <3 seconds on 3G         | Mobile device testing                           |

### Performance Monitoring Strategy

```typescript
// Continuous performance monitoring
const performanceTracker = {
  trackSecurityLoggingImpact: () => {
    // Monitor application response time with/without logging
    console.time('security-logging-overhead')
    // ... logging operation
    console.timeEnd('security-logging-overhead')
  },

  trackDashboardPerformance: () => {
    // Monitor dashboard component render times
    performance.mark('dashboard-start')
    // ... dashboard rendering
    performance.mark('dashboard-end')
    performance.measure('dashboard-render', 'dashboard-start', 'dashboard-end')
  },
}
```

---

## Testing Strategy

### Unit Testing

**TypeScript Type Fixes**:

```typescript
describe('Credentials System Types', () => {
  test('should handle all environment types correctly', () => {
    const configs = [
      { environment: 'development' as const },
      { environment: 'test' as const },
      { environment: 'production' as const },
    ]

    configs.forEach((config) => {
      expect(() => validateConfig(config)).not.toThrow()
    })
  })
})
```

**Security Event Logging**:

```typescript
describe('SecurityEventLogger', () => {
  test('should log events without performance impact', async () => {
    const logger = new SecurityEventLogger()
    const startTime = performance.now()

    await logger.logEvent({
      eventType: 'authentication',
      severity: 'info',
      // ... event details
    })

    const duration = performance.now() - startTime
    expect(duration).toBeLessThan(10) // Should be very fast
  })
})
```

### Integration Testing

**Dashboard Accessibility**:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

describe('Security Dashboard Accessibility', () => {
  test('should meet WCAG 2.1 AA standards', async () => {
    const { container } = render(<SecurityDashboard />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('should support keyboard navigation', () => {
    render(<SecurityDashboard />)
    // Test tab order and keyboard interactions
    fireEvent.keyDown(screen.getByRole('main'), { key: 'Tab' })
    expect(document.activeElement).toHaveAttribute('data-testid', 'security-status')
  })
})
```

### End-to-End Testing

**Complete Security Workflow**:

```typescript
// Cypress accessibility testing
describe('Security Enhancement E2E', () => {
  it('should handle complete security workflow', () => {
    cy.visit('/admin/security')
    cy.injectAxe() // Accessibility testing

    // Test security event generation
    cy.triggerSecurityEvent('authentication_failure')

    // Verify event appears in dashboard
    cy.get('[data-testid="security-events"]').should(
      'contain',
      'Authentication failure'
    )

    // Test alert system
    cy.get('[data-testid="security-alert"]')
      .should('be.visible')
      .and('have.attr', 'role', 'alert')

    // Accessibility validation
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
    })
  })
})
```

---

## Monitoring and Observability

### Key Metrics Dashboard

```typescript
interface SecurityMetrics {
  // Performance metrics
  loggingOverhead: number        // Should be <5%
  dashboardLoadTime: number      // Should be <2s
  alertDeliveryTime: number      // Should be <60s

  // Security metrics
  eventsLoggedPerHour: number
  failedAuthAttempts: number
  rateLimitViolations: number

  // Accessibility metrics
  keyboardNavigationErrors: number
  screenReaderIssues: number
  contrastViolations: number
}

const securityMetricsCollector = {
  collectMetrics(): SecurityMetrics,
  sendToMonitoring(metrics: SecurityMetrics): void,
  alertOnThresholds(metrics: SecurityMetrics): void
}
```

### Alerting Thresholds

- **Performance Degradation**: >5% overhead triggers investigation
- **Accessibility Issues**: Any WCAG violations trigger immediate fix
- **Security Events**: High-severity events trigger immediate alerts
- **System Health**: Dashboard errors trigger operational response

---

## Success Criteria Validation

### Acceptance Testing Checklist

- [ ] **Build Quality**: Zero TypeScript warnings across all environments
- [ ] **Security Logging**: 100% of defined security events logged correctly
- [ ] **Dashboard Accessibility**: WCAG 2.1 AA compliance verified via automated and manual testing
- [ ] **Performance**: <5% overhead impact validated through comprehensive testing
- [ ] **Mobile Compatibility**: All security interfaces work on mobile devices with proper touch targets
- [ ] **Internationalization**: All security text properly externalized and testable in multiple locales
- [ ] **Alert System**: All alert types function correctly with proper accessibility features
- [ ] **Keyboard Navigation**: Complete security workflow achievable using only keyboard
- [ ] **Screen Reader**: All security information properly announced by screen readers

### Performance Validation

```typescript
const validatePerformanceRequirements = async () => {
  const results = {
    loggingOverhead: await measureLoggingOverhead(), // Must be <5%
    dashboardLoadTime: await measureDashboardLoad(), // Must be <2s
    alertDeliveryTime: await measureAlertDelivery(), // Must be <60s
    mobileLoadTime: await measureMobileLoad(), // Must be <3s
  }

  const passed = Object.entries(results).every(([key, value]) => {
    return value <= PERFORMANCE_THRESHOLDS[key]
  })

  return { passed, results }
}
```

---

## Risk Mitigation Strategies

### Technical Risk Mitigation

1. **TypeScript Error Complexity**

   - Comprehensive type analysis before implementation
   - Incremental type fixes with testing at each stage
   - Fallback to previous type definitions if issues arise

2. **Performance Impact Risk**

   - Async processing for all security logging
   - Performance monitoring throughout implementation
   - Feature flags to disable components if performance issues occur

3. **Accessibility Compliance Risk**
   - Automated accessibility testing integrated into CI/CD
   - Manual testing with assistive technologies
   - Expert accessibility review before deployment

### Operational Risk Mitigation

1. **Alert Fatigue**

   - Configurable alert thresholds
   - User-controlled notification preferences
   - Smart alert aggregation to prevent spam

2. **Dashboard Complexity**

   - Progressive disclosure of security information
   - User testing with operations team
   - Comprehensive documentation and training

3. **Maintenance Burden**
   - Automated security scanning integration
   - Self-monitoring capabilities for security components
   - Clear operational procedures and troubleshooting guides

---

## Agent Validation Requirements

### Mandatory Agent Reviews (Per CLAUDE.md)

1. **architecture-designer** - System design and component architecture validation
2. **security-validator** - Security implementation and vulnerability assessment
3. **performance-optimizer** - Performance impact analysis and optimization recommendations
4. **code-quality-analyzer** - Code quality standards and testing coverage validation

### Agent Review Criteria

- **Architecture Score**: ≥4.0/5.0 required for approval
- **Security Risk**: ≤MEDIUM risk level acceptable
- **Performance Impact**: <5% overhead requirement validation
- **Code Quality Score**: ≥4.0/5.0 required for approval

---

**Document Control**

- **Created**: 2025-01-15
- **Version**: 1.0
- **Classification**: Product Design Document
- **Related Documents**: PRD-security-enhancements-2025-01-15.md
- **Next Review**: Pending Agent Validation

**Review Status**

- [x] Architecture Designer Agent Review (✅ COMPLETED - 3.8/5.0 with critical improvements needed)
- [x] Security Validator Agent Review (✅ COMPLETED - MEDIUM risk acceptable with mitigations)
- [x] Performance Optimizer Agent Review (✅ COMPLETED - <5% overhead achievable)
- [x] Code Quality Analyzer Agent Review (✅ COMPLETED - 4.2/5.0 exceeds minimum)
- [ ] Technical Review (Doctor Hubert)
- [ ] Final Approval (Doctor Hubert)

**Agent Cross-Validation Summary:**

- **Security-Performance Trade-offs**: Worker thread logging resolves both security audit and performance requirements
- **Architecture-Quality Alignment**: Component-based approach supports both scalability and testing strategies
- **UX-Security Integration**: ARIA live regions satisfy both accessibility compliance and security alerting needs
- **No major cross-agent conflicts identified**

**CONDITIONAL APPROVAL STATUS**: Ready for implementation after addressing 4 critical pre-implementation actions:

1. Fix TypeScript environment types in credentials system
2. Add comprehensive data architecture section (storage, indexing, retention)
3. Implement log integrity protection with HMAC signatures
4. Complete RBAC specifications for dashboard access control
