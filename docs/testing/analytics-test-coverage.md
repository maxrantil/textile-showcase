# Analytics Testing Coverage

**Created**: 2025-11-12
**Purpose**: Ensure Umami analytics integration remains functional forever

---

## 🎯 Problem Solved

**Original Issue**: Duplicate middleware files caused production CSP to block analytics:
- Root `middleware.ts` (old, wrong CSP) overrode `src/middleware.ts` (correct CSP)
- 28 existing tests passed ✅ but production was broken ❌
- Tests validated **code correctness** but not **production deployment**

**Root Cause**: Next.js prioritizes root-level `middleware.ts` over `src/middleware.ts`

---

## 🧪 New Test Suite

### 1. Build Artifact Validation (`tests/build/middleware-compilation.test.ts`)

**What it checks:**
- ✅ Compiled middleware contains `analytics.idaromme.dk`
- ❌ Compiled middleware does NOT contain old domains (`umami.is`, `70.34.205.18`)
- ✅ Only `src/middleware.ts` exists (NO root `middleware.ts`)
- ✅ Source file has correct analytics domain

**Why it matters:**
- Catches **file precedence issues** (duplicate middleware files)
- Validates **build artifacts** (what actually runs in production)
- Prevents **regressions** if old files are accidentally restored

**Run it:**
```bash
npm test -- tests/build/middleware-compilation.test.ts
```

**When it fails:**
```
CRITICAL FILE STRUCTURE ERROR: Duplicate middleware files detected!

❌ FOUND: middleware.ts (root level) - Contains OLD domains!
✅ FOUND: src/middleware.ts - Contains CORRECT domains

PROBLEM: Next.js prioritizes root-level middleware.ts over src/middleware.ts.

FIX:
1. Delete middleware.ts from project root:
   rm middleware.ts

2. Rebuild:
   rm -rf .next && npm run build
```

---

### 2. Production Smoke Tests (`tests/e2e/production-smoke.spec.ts`)

**What it checks:**
- ✅ Production URL (`https://idaromme.dk`) returns correct CSP headers
- ✅ CSP includes `analytics.idaromme.dk` in `script-src` and `connect-src`
- ❌ CSP does NOT contain old domains
- ✅ Analytics script loads without CSP violations
- ✅ Script tag appears in production DOM
- ✅ Analytics requests succeed (200 OK)

**Why it matters:**
- Tests **REAL production deployment** (not localhost)
- Catches issues that only appear in production environment
- Validates **actual HTTP headers** from deployed server

**Run it:**
```bash
# Locally (enabled by default)
RUN_PRODUCTION_TESTS=true npx playwright test tests/e2e/production-smoke.spec.ts

# In CI (disabled by default to avoid rate limiting)
RUN_PRODUCTION_TESTS=true npm test -- tests/e2e/production-smoke.spec.ts
```

**When it fails:**
```
CRITICAL: CSP is blocking analytics on production!

Current script-src: 'self' 'unsafe-inline' https://cdn.sanity.io https://umami.is
Missing: https://analytics.idaromme.dk

ROOT CAUSE: Likely duplicate middleware files on server.

FIX ON SERVER:
1. SSH to production: ssh user@idaromme.dk
2. cd /var/www/idaromme.dk
3. ls -la middleware.ts src/middleware.ts
4. If both exist: rm middleware.ts
5. rm -rf .next && NODE_ENV=production npm run build
6. pm2 restart idaromme-website
```

---

### 3. Existing Unit Tests (`tests/unit/middleware/csp-analytics.test.ts`)

**What they check:**
- ✅ Middleware source code has correct CSP configuration
- ✅ Both `script-src` and `connect-src` include analytics domain
- ✅ CSP works in development and production modes
- ✅ Nonce generation for inline scripts

**Why they matter:**
- Validates **source code logic**
- Fast feedback during development
- Prevents introducing CSP bugs

**Run them:**
```bash
npm test -- tests/unit/middleware/csp-analytics.test.ts
```

---

### 4. Existing E2E Tests (`tests/e2e/analytics-integration.spec.ts`)

**What they check:**
- ✅ Analytics script loads in localhost environment
- ✅ Script has correct attributes (`defer`, `data-website-id`)
- ✅ No CSP violations on localhost
- ✅ Script loads across different pages

**Why they matter:**
- Validates **local development** behavior
- Tests **client-side script injection** (requestIdleCallback)
- Ensures analytics doesn't block page rendering

**Run them:**
```bash
npx playwright test tests/e2e/analytics-integration.spec.ts
```

---

## 📊 Complete Test Coverage Matrix

| Test Type | Location | Checks Source | Checks Build | Checks Production |
|-----------|----------|--------------|--------------|-------------------|
| **Unit Tests** | `tests/unit/middleware/` | ✅ | ❌ | ❌ |
| **Build Validation** | `tests/build/` | ✅ | ✅ | ❌ |
| **E2E Localhost** | `tests/e2e/analytics-integration.spec.ts` | ❌ | ❌ | ❌ |
| **E2E Production** | `tests/e2e/production-smoke.spec.ts` | ❌ | ❌ | ✅ |

**Key Insight**: You need ALL test types to catch all issues!

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow Updates

**Add to `.github/workflows/production-deploy.yml`:**

```yaml
  # After deploy step (line ~206)
  production-validation:
    runs-on: ubuntu-latest
    needs: [deploy]
    if: github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: Run production smoke tests
        env:
          RUN_PRODUCTION_TESTS: 'true'
        run: npx playwright test tests/e2e/production-smoke.spec.ts
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: production-smoke-test-results
          path: test-results/
```

**Add to test job (line ~21):**

```yaml
      - name: Run middleware build validation
        run: npm test -- tests/build/middleware-compilation.test.ts
```

---

## 🔍 Test Gap Analysis

### Why Existing Tests Didn't Catch the Bug

**Existing 28 tests validated:**
- ✅ Source code correctness (`src/middleware.ts`)
- ✅ Component behavior
- ✅ TypeScript compilation

**What tests MISSED:**
- ❌ File precedence (root vs src middleware)
- ❌ Production HTTP headers (real responses)
- ❌ Build artifact correctness
- ❌ Deployed server configuration

### The Missing Pieces (Now Fixed)

1. **File Structure Validation** ✅
   - Test: `tests/build/middleware-compilation.test.ts`
   - Catches: Duplicate middleware files

2. **Build Artifact Validation** ✅
   - Test: `tests/build/middleware-compilation.test.ts`
   - Catches: Wrong middleware compiled

3. **Production URL Testing** ✅
   - Test: `tests/e2e/production-smoke.spec.ts`
   - Catches: Wrong CSP on production server

---

## 🎓 Lessons Learned

### 1. Test the Right Thing

❌ **Wrong**: Testing that source code is correct
✅ **Right**: Testing that COMPILED code is correct

❌ **Wrong**: Testing localhost CSP headers
✅ **Right**: Testing PRODUCTION CSP headers

### 2. Test All Layers

- **Layer 1**: Source code (unit tests)
- **Layer 2**: Build artifacts (build tests) ← **NEW**
- **Layer 3**: Local runtime (E2E localhost)
- **Layer 4**: Production runtime (E2E production) ← **NEW**

### 3. File Precedence Matters

Next.js middleware file priority:
1. `middleware.ts` (root) ← **TAKES PRECEDENCE**
2. `src/middleware.ts` ← **IGNORED if root exists**

**Rule**: Keep ONLY `src/middleware.ts`, delete any root middleware.

---

## 📝 Developer Checklist

**Before committing middleware changes:**

1. ✅ Run unit tests: `npm test -- tests/unit/middleware/`
2. ✅ Run build validation: `npm test -- tests/build/`
3. ✅ Verify file structure: `ls middleware.ts` should fail (root shouldn't exist)
4. ✅ Run E2E tests: `npx playwright test tests/e2e/analytics-integration.spec.ts`

**After deploying to production:**

1. ✅ Run production smoke tests: `RUN_PRODUCTION_TESTS=true npx playwright test tests/e2e/production-smoke.spec.ts`
2. ✅ Check browser DevTools (no CSP errors)
3. ✅ Verify Umami dashboard shows visitors

---

## 🔧 Maintenance

### Regular Validation

**Weekly** (automated in CI):
- Build artifact validation
- Production smoke tests

**Monthly** (manual):
- Browser testing (multiple browsers)
- Umami dashboard verification
- Analytics data accuracy

### When to Update Tests

**Update tests if:**
- Analytics domain changes
- CSP configuration changes
- Middleware file structure changes
- New analytics provider added

---

## 📚 Reference

**Related Documentation:**
- Session Handoff: `SESSION_HANDOVER.md` (root cause analysis)
- Middleware Source: `src/middleware.ts` (lines 198, 202)
- Analytics Provider: `src/app/components/analytics-provider.tsx`
- Browser Verification: `/tmp/analytics_verification_steps.md`

**Key Commits:**
- PR #190: Remove duplicate root middleware
- PR #191: Update deployment workflow
- PR #192: Add production smoke tests

---

## ✅ Success Criteria

**Analytics is working correctly when:**

1. ✅ All 10 build validation tests pass
2. ✅ All 28 unit tests pass
3. ✅ All E2E localhost tests pass
4. ✅ All E2E production tests pass
5. ✅ No CSP errors in browser console
6. ✅ Umami dashboard shows real-time visitors
7. ✅ `src/middleware.ts` is the ONLY middleware file

**If ANY test fails → Analytics is broken or at risk.**

---

## 🆘 Troubleshooting

### Tests Failing After Pull

1. Check for duplicate middleware:
   ```bash
   ls middleware.ts src/middleware.ts
   ```
   If root exists: `rm middleware.ts && npm run build`

2. Verify source file:
   ```bash
   grep "analytics.idaromme.dk" src/middleware.ts
   ```
   Should find 2 occurrences (script-src, connect-src)

3. Rebuild and retest:
   ```bash
   rm -rf .next && NODE_ENV=production npm run build
   npm test -- tests/build/middleware-compilation.test.ts
   ```

### Production Tests Failing

1. Check production CSP headers:
   ```bash
   curl -sI https://idaromme.dk | grep -i content-security-policy
   ```

2. Check for duplicate files on server:
   ```bash
   ssh user@idaromme.dk 'cd /var/www/idaromme.dk && ls -la middleware.ts src/middleware.ts'
   ```

3. If duplicate found on server, delete and rebuild:
   ```bash
   ssh user@idaromme.dk 'cd /var/www/idaromme.dk && rm middleware.ts && rm -rf .next && NODE_ENV=production npm run build && pm2 restart idaromme-website'
   ```

---

**Last Updated**: 2025-11-12
**Maintained By**: Development Team
**Status**: ✅ All tests passing, analytics functional
