# Umami Analytics Testing Documentation

## Overview

This document describes the comprehensive test suite for Umami Analytics integration. These tests ensure that analytics remain functional and prevent accidental breakage during future development.

## Test Coverage

The test suite covers three layers of the testing pyramid:

### 1. Unit Tests (`tests/unit/middleware/csp-analytics.test.ts`)

**Purpose**: Verify Content Security Policy (CSP) headers correctly allow analytics domain

**What it tests:**
- ✅ CSP includes `https://analytics.idaromme.dk` in `script-src` directive
- ✅ CSP includes `https://analytics.idaromme.dk` in `connect-src` directive
- ✅ CSP maintains analytics domain across all routes
- ✅ CSP works correctly in both development and production modes
- ✅ CSP structure is valid and includes proper nonce
- ✅ Security: No wildcard origins, strict CSP maintained

**Regression Prevention:**
- ❌ Test fails if analytics domain is removed from `script-src`
- ❌ Test fails if analytics domain is removed from `connect-src`
- ❌ Test fails if CSP modifications break analytics

**Run command:**
```bash
npm test -- tests/unit/middleware/csp-analytics.test.ts
```

**Test count:** 11 tests

---

### 2. Integration Tests (`tests/integration/analytics-provider.test.tsx`)

**Purpose**: Verify AnalyticsProvider component correctly injects analytics script

**What it tests:**
- ✅ Script loads in production mode with environment variables set
- ✅ Script does NOT load in development mode
- ✅ Script does NOT load when environment variables missing
- ✅ Script uses `requestIdleCallback` for deferred loading
- ✅ Script falls back to `setTimeout` when `requestIdleCallback` unavailable
- ✅ Script has correct attributes: `defer`, `src`, `data-website-id`
- ✅ Children render regardless of analytics loading state

**Regression Prevention:**
- ❌ Test fails if script is not deferred (would block rendering)
- ❌ Test fails if production mode check is removed
- ❌ Test fails if environment variable check is removed

**Run command:**
```bash
npm test -- tests/integration/analytics-provider.test.tsx
```

**Test count:** 17 tests

---

### 3. End-to-End Tests (`tests/e2e/analytics-integration.spec.ts`)

**Purpose**: Verify analytics works in real browser with production build

**What it tests:**
- ✅ Umami script tag exists in DOM (production mode)
- ✅ Script has correct `src`, `defer`, and `data-website-id` attributes
- ✅ No CSP violations in browser console
- ✅ CSP headers allow analytics domain
- ✅ Network request to `script.js` succeeds (200 status)
- ✅ Analytics doesn't block page load (FCP measurement)
- ✅ Analytics loads on multiple routes (homepage, contact, etc.)
- ✅ Script uses `requestIdleCallback` for deferred loading

**Regression Prevention:**
- ❌ Test fails if CSP blocks analytics script
- ❌ Test fails if script attributes are wrong
- ❌ Test fails if analytics loads in non-production environment
- ❌ Test fails if analytics blocks First Contentful Paint

**Run command:**
```bash
# Requires production build
npm run build
npm test:e2e -- tests/e2e/analytics-integration.spec.ts
```

**Test count:** 18 tests

---

## Running Tests

### All Analytics Tests
```bash
npm test -- --testPathPatterns="(csp-analytics|analytics-provider)"
```

### Individual Test Suites
```bash
# Unit tests only
npm test -- tests/unit/middleware/csp-analytics.test.ts

# Integration tests only
npm test -- tests/integration/analytics-provider.test.tsx

# E2E tests only (requires production build)
npm run build
npm test:e2e -- tests/e2e/analytics-integration.spec.ts
```

### Watch Mode (Development)
```bash
npm test:watch -- --testPathPatterns="(csp-analytics|analytics-provider)"
```

### With Coverage
```bash
npm test:coverage -- --testPathPatterns="(csp-analytics|analytics-provider)"
```

---

## Test Environment Configuration

### Required Environment Variables

For tests to accurately validate configuration:

```bash
# Production Analytics (set in .env.production)
NEXT_PUBLIC_UMAMI_URL=https://analytics.idaromme.dk
NEXT_PUBLIC_UMAMI_WEBSITE_ID=caa54504-d542-4ccc-893f-70b6eb054036
```

### E2E Test Configuration

E2E tests require a production build to verify analytics loading:

```bash
# Build for production
NODE_ENV=production npm run build

# Run E2E tests
npm test:e2e
```

**Note:** In development mode, analytics will NOT load (by design). E2E tests account for this and log warnings rather than failing.

---

## What These Tests Prevent

### Critical Breakages Caught:

1. **CSP Configuration Changes**
   - Someone removes `analytics.idaromme.dk` from CSP headers
   - CSP refactor breaks analytics script loading
   - CSP blocks analytics data collection

2. **Component Breaking Changes**
   - AnalyticsProvider refactor removes production check
   - Script defer attribute removed (blocks rendering)
   - Environment variable check removed
   - requestIdleCallback optimization removed

3. **Deployment Issues**
   - Analytics loaded in development (wastes resources)
   - Analytics loaded without configuration (causes errors)
   - CSP violations in production

4. **Performance Regressions**
   - Analytics blocks page rendering
   - Script loaded synchronously instead of deferred
   - First Contentful Paint impacted

---

## Test Maintenance

### When to Update Tests

**Update tests when:**
- Analytics domain changes (update `ANALYTICS_DOMAIN` constant)
- Website ID changes (update `WEBSITE_ID` constant)
- Analytics provider changed (Umami → different service)
- CSP policy structure changes significantly

**Don't update tests when:**
- Adding new CSP domains unrelated to analytics
- Adding new routes (tests already validate all routes)
- Styling changes to components

### Test File Locations

```
tests/
├── unit/
│   └── middleware/
│       └── csp-analytics.test.ts          (CSP validation)
├── integration/
│   └── analytics-provider.test.tsx        (Component logic)
└── e2e/
    └── analytics-integration.spec.ts      (Browser validation)
```

---

## Common Issues & Debugging

### Issue: E2E tests show "Analytics script not found"

**Cause:** E2E tests running against development build

**Solution:**
```bash
NODE_ENV=production npm run build
npm test:e2e
```

### Issue: Integration tests fail with "requestIdleCallback not defined"

**Cause:** Jest/jsdom environment missing browser API

**Solution:** Tests already mock `requestIdleCallback`. If issues persist, check Jest setup.

### Issue: Unit tests fail with CSP directive mismatch

**Cause:** CSP header structure changed in middleware

**Solution:**
1. Check `src/middleware.ts` for CSP changes
2. Update test expectations if changes are intentional
3. Ensure `analytics.idaromme.dk` remains in CSP

---

## Metrics

**Total Test Coverage:**
- **28 unit + integration tests** (run in ~4 seconds)
- **18 E2E tests** (run in ~30 seconds with production build)
- **46 total tests** ensuring analytics reliability

**Code Coverage:**
- `src/middleware.ts`: CSP headers function (100%)
- `src/app/components/analytics-provider.tsx`: Full component (100%)

**What's Protected:**
- CSP middleware configuration
- AnalyticsProvider component logic
- Production vs development loading
- Environment variable validation
- Script attributes and deferred loading
- Network requests and CSP violations
- Performance impact (FCP measurement)

---

## CI/CD Integration

### Recommended CI Pipeline

```yaml
# Example GitHub Actions workflow
- name: Unit & Integration Tests
  run: npm test -- --testPathPatterns="(csp-analytics|analytics-provider)"

- name: Build Production
  run: NODE_ENV=production npm run build

- name: E2E Analytics Tests
  run: npm test:e2e -- tests/e2e/analytics-integration.spec.ts
```

### Pre-commit Hook

Add to `.pre-commit-config.yaml`:
```yaml
- id: analytics-tests
  name: Analytics Integration Tests
  entry: npm test -- --testPathPatterns="(csp-analytics|analytics-provider)"
  language: system
  pass_filenames: false
```

---

## Future Enhancements

### Potential Additions:

1. **Analytics Data Validation**
   - Verify page view events are sent
   - Check event tracking parameters
   - Validate custom event data

2. **Multi-browser E2E Tests**
   - Test on Safari, Firefox, Chrome
   - Mobile browser testing
   - Different screen sizes

3. **Performance Budget Tests**
   - Analytics script size limit
   - Load time impact measurement
   - Network waterfall validation

4. **Privacy Compliance Tests**
   - Verify no PII in analytics requests
   - Check cookie-free tracking
   - GDPR compliance validation

---

## Summary

These tests provide comprehensive coverage of the Umami analytics integration:

✅ **Unit tests** ensure CSP headers are configured correctly
✅ **Integration tests** verify component logic and script injection
✅ **E2E tests** validate real browser behavior and network requests

**Result:** Analytics integration is protected from accidental breakage, with clear error messages when issues occur.

---

**Last Updated:** 2025-11-12
**Test Framework:** Jest (unit/integration), Playwright (E2E)
**Coverage:** 46 tests across 3 test layers
