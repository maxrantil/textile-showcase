# Phase 1: Emergency Security Hardening - Implementation Checklist

**Branch**: `pdr/textile-showcase-optimization`
**Issue**: #10
**Timeline**: Weeks 1-2 (32 hours total)
**Priority**: CRITICAL - Execute Before Any Other Work

## **WEEK 1: IMMEDIATE SECURITY RESPONSE (16 hours)**

### **DAY 1: API Key Emergency Response (8 hours) - CRITICAL**
- [ ] **STEP 1: Inventory Current API Keys** (1 hour)
  - [ ] Check `.env*` files for exposed keys
  - [ ] Audit git history: `git log --oneline --grep="key\|token\|secret"`
  - [ ] Document all services using current keys

- [ ] **STEP 2: Revoke Exposed Keys** (2 hours)
  - [ ] **Sanity API Keys**:
    - [ ] Login to https://sanity.io/manage
    - [ ] Navigate to project settings → API
    - [ ] Revoke current tokens
    - [ ] Document token IDs for verification
  
  - [ ] **Resend API Key**:
    - [ ] Login to https://resend.com/api-keys
    - [ ] Revoke current API key
    - [ ] Document key ID for verification

- [ ] **STEP 3: Generate New Keys** (2 hours)
  - [ ] Create new Sanity API token with minimal required permissions
  - [ ] Create new Resend API key with domain restrictions
  - [ ] Store new keys in secure password manager
  - [ ] Update local `.env.local` (DO NOT COMMIT)

- [ ] **STEP 4: Update Deployment Environment** (2 hours)
  - [ ] Update Vercel environment variables
  - [ ] Test deployment with new keys
  - [ ] Verify all services function correctly
  - [ ] Clear deployment cache if needed

- [ ] **STEP 5: Git History Cleanup** (1 hour)
  - [ ] **CAUTION**: Coordinate with any other contributors first
  - [ ] Run: `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env*' --prune-empty --tag-name-filter cat -- --all`
  - [ ] Force push: `git push origin --force --all`
  - [ ] Verify clean history: `git log --oneline | head -20`

### **DAY 2: Sanity Studio Protection (8 hours)**
- [ ] **STEP 1: Create Emergency Middleware** (4 hours)
  - [ ] Create `middleware.ts` in project root
  - [ ] Implement IP-based protection for `/studio` paths
  - [ ] Add environment variable for allowed IPs
  - [ ] Test middleware functionality locally

- [ ] **STEP 2: Rate Limiting Setup** (3 hours)
  - [ ] Install: `npm install @upstash/ratelimit @upstash/redis`
  - [ ] Create rate limiting utility function
  - [ ] Apply to contact API endpoint
  - [ ] Test rate limiting with multiple requests

- [ ] **STEP 3: Basic Security Headers** (1 hour)
  - [ ] Update `next.config.ts` with enhanced CSP headers
  - [ ] Test headers with browser dev tools
  - [ ] Verify no functionality breaks

## **WEEK 2: SECURITY INFRASTRUCTURE (16 hours)**

### **DAY 3-4: Comprehensive Security Middleware (8 hours)**
- [ ] **STEP 1: Enhanced Authentication** (4 hours)
  - [ ] Implement session management for Studio access
  - [ ] Add login/logout functionality for Studio
  - [ ] Create secure session storage
  - [ ] Test authentication flow

- [ ] **STEP 2: Input Sanitization** (4 hours)
  - [ ] Install: `npm install isomorphic-dompurify`
  - [ ] Add DOMPurify to contact form processing
  - [ ] Implement email header injection prevention
  - [ ] Test form with malicious inputs

### **DAY 5: Security Monitoring & Testing (8 hours)**
- [ ] **STEP 1: Security Event Logging** (4 hours)
  - [ ] Create security event logger
  - [ ] Log failed authentication attempts
  - [ ] Log rate limiting violations
  - [ ] Log suspicious access patterns

- [ ] **STEP 2: Fix Failing Tests** (2 hours)
  - [ ] Run: `npm test`
  - [ ] Fix DOM API compatibility in useKeyboardNavigation test
  - [ ] Ensure all tests pass: `npm run test:ci`

- [ ] **STEP 3: Security Validation** (2 hours)
  - [ ] Test all security measures end-to-end
  - [ ] Verify CSP headers don't break functionality
  - [ ] Document any security gaps found

## **EMERGENCY PROCEDURES - IMMEDIATE ACCESS**

### **If Security Breach Detected:**
```bash
# 1. Immediate service shutdown (if needed)
vercel env rm NEXT_PUBLIC_SANITY_PROJECT_ID production

# 2. Emergency IP block (add to middleware)
BLOCKED_IPS="suspicious.ip.address"

# 3. Emergency rate limit (reduce to 1 request/minute)
# Update rate limiting configuration

# 4. Contact Doctor Hubert immediately
# Document: Time, Nature of breach, Actions taken
```

### **If Deployment Fails:**
```bash
# 1. Rollback to previous deployment
vercel rollback

# 2. Check environment variables
vercel env ls

# 3. Restore from backup if needed
# 4. Re-test with new API keys
```

## **SUCCESS CRITERIA FOR PHASE 1:**
- [ ] **Zero Critical Vulnerabilities**: No CVSS 9.0+ issues remain
- [ ] **API Key Security**: 100% exposed credentials revoked and rotated
- [ ] **Studio Protection**: 100% unauthorized access blocked
- [ ] **CI/CD Pipeline**: Zero failing tests, functional deployment
- [ ] **Security Monitoring**: Functional logging and alerting system
- [ ] **Documentation**: Complete incident response procedures

## **BREAK CONTINUATION NOTES:**
- **Current Status**: Branch created, documentation ready
- **Next Action**: Begin Day 1 API key emergency response
- **Critical**: API keys need immediate attention - high security risk
- **Dependencies**: Need access to Sanity and Resend admin panels
- **Testing**: All security measures must be validated before Phase 2

## **RESOURCES NEEDED:**
- [ ] Sanity admin panel access
- [ ] Resend admin panel access  
- [ ] Vercel deployment access
- [ ] Password manager for secure key storage
- [ ] Testing environment for validation

---

**READY FOR IMPLEMENTATION AFTER BREAK**
Doctor Hubert - Everything is prepared for immediate Phase 1 execution when you return.