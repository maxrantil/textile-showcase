# Test Suite Documentation

## Overview

This directory contains comprehensive tests for the Textile Showcase portfolio application. Tests are organized by type following the testing pyramid principle.

## Directory Structure

```
tests/
├── README.md                        (This file)
├── ANALYTICS_TESTING.md            (Analytics-specific test documentation)
├── unit/                           (Fast, isolated tests)
│   ├── middleware/
│   │   ├── auth.test.ts           (Authentication middleware)
│   │   └── csp-analytics.test.ts  (CSP analytics configuration)
│   ├── hooks/
│   └── mobile-hooks/
├── integration/                    (Component interaction tests)
│   ├── analytics-provider.test.tsx (Analytics component logic)
│   ├── real-contact-form.test.tsx
│   ├── real-gallery-navigation.test.tsx
│   └── ...
├── e2e/                           (End-to-end browser tests)
│   ├── analytics-integration.spec.ts (Analytics E2E validation)
│   ├── workflows/
│   ├── accessibility/
│   └── performance/
├── api/                           (API endpoint tests)
├── performance/                   (Performance tests)
├── bundle/                        (Bundle size tests)
└── performance-budget/            (Budget enforcement)
```

## Test Types

### Unit Tests (`unit/`)
- **Fast** (< 100ms per test)
- **Isolated** (no external dependencies)
- **Coverage**: Individual functions, utilities, hooks

**Run:**
```bash
npm test -- tests/unit/
```

### Integration Tests (`integration/`)
- **Moderate speed** (< 1s per test)
- **Component interactions** (forms, navigation, providers)
- **Coverage**: Multi-component workflows, API interactions

**Run:**
```bash
npm test -- tests/integration/
```

### E2E Tests (`e2e/`)
- **Slower** (1-10s per test)
- **Real browser** (Playwright)
- **Coverage**: User journeys, accessibility, performance

**Run:**
```bash
npm test:e2e
```

## Quick Start

### Running All Tests
```bash
# Unit + Integration tests
npm test

# E2E tests (requires build)
npm test:e2e

# All tests with coverage
npm test:coverage
```

### Running Specific Test Suites
```bash
# Analytics tests only
npm test -- --testPathPatterns="(csp-analytics|analytics-provider)"
npm test:e2e -- tests/e2e/analytics-integration.spec.ts

# Contact form tests
npm test -- tests/integration/real-contact-form.test.tsx

# Accessibility tests
npm test:e2e -- tests/e2e/accessibility/
```

### Watch Mode (Development)
```bash
# Watch all tests
npm test:watch

# Watch specific pattern
npm test:watch -- --testPathPatterns="analytics"
```

## Test Configuration

### Jest (Unit + Integration)
- **Config**: `jest.config.ts`
- **Setup**: `jest.setup.ts`
- **Environment**: jsdom
- **Coverage**: src/ directory (excluding mocks, Sanity)

### Playwright (E2E)
- **Config**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari (desktop + mobile)
- **Base URL**: http://localhost:3000 (configurable via E2E_BASE_URL)

## Feature-Specific Testing

### Analytics Integration
**Documentation**: [ANALYTICS_TESTING.md](./ANALYTICS_TESTING.md)

**Tests:**
- Unit: CSP middleware configuration
- Integration: AnalyticsProvider component
- E2E: Browser validation, network requests

**Run:**
```bash
npm test -- --testPathPatterns="(csp-analytics|analytics-provider)"
npm test:e2e -- tests/e2e/analytics-integration.spec.ts
```

### Contact Form
**Tests:**
- Integration: Form validation, API calls, error handling
- E2E: User workflows, accessibility

**Run:**
```bash
npm test -- tests/integration/real-contact-form.test.tsx
npm test:e2e -- tests/e2e/workflows/contact-form.spec.ts
```

### Gallery & Navigation
**Tests:**
- Integration: Gallery navigation, keyboard controls
- E2E: Image loading, performance, accessibility

**Run:**
```bash
npm test -- tests/integration/real-gallery-navigation.test.tsx
npm test:e2e -- tests/e2e/workflows/gallery-browsing.spec.ts
```

## Writing New Tests

### Test-Driven Development (TDD)

**MANDATORY WORKFLOW:**
1. **RED** - Write failing test first
2. **GREEN** - Minimal code to pass
3. **REFACTOR** - Improve while tests pass

**NEVER write production code without a failing test first**

### Test Structure

```typescript
// ABOUTME: Brief description of test file purpose

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  describe('Specific Behavior', () => {
    it('should do something specific when condition occurs', () => {
      // Arrange: Set up test data
      const input = 'test'

      // Act: Execute the code
      const result = functionUnderTest(input)

      // Assert: Verify expectations
      expect(result).toBe('expected')
    })
  })
})
```

### Naming Conventions

**Test files:**
- Unit: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`

**Test names:**
- Use `should_[expectedBehavior]_when_[condition]` pattern
- Be specific and descriptive
- Focus on behavior, not implementation

**Good:**
```typescript
it('should display error message when email is invalid', () => {})
it('should load analytics script only in production mode', () => {})
```

**Bad:**
```typescript
it('works', () => {})
it('test email validation', () => {})
```

## Coverage Requirements

### Minimum Coverage
- **Overall**: 80%
- **Critical paths**: 100%
- **Security features**: 100%
- **Analytics integration**: 100%

### Checking Coverage
```bash
npm test:coverage
```

Coverage reports generated in `coverage/` directory.

## Continuous Integration

### Pre-commit Hooks
Install with `pre-commit install` (if using pre-commit framework)

**Runs automatically:**
- Linting
- Type checking
- Unit tests
- Code formatting

### CI Pipeline
```yaml
# Example: GitHub Actions
- Run linting
- Run unit + integration tests
- Build production
- Run E2E tests
- Generate coverage report
```

## Common Testing Patterns

### Mocking Environment Variables
```typescript
beforeEach(() => {
  process.env.VARIABLE_NAME = 'test-value'
})

afterEach(() => {
  delete process.env.VARIABLE_NAME
})
```

### Mocking Fetch
```typescript
const mockFetch = jest.fn()
global.fetch = mockFetch

mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'value' })
})
```

### Testing Async Components
```typescript
import { render, waitFor, screen } from '@testing-library/react'

it('should load async data', async () => {
  render(<Component />)

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### E2E Page Navigation
```typescript
test('navigates to page', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const element = page.locator('button')
  await expect(element).toBeVisible()
})
```

## Debugging Tests

### Jest Debugging
```bash
# Run single test file
npm test -- path/to/test.ts

# Run with verbose output
npm test -- --verbose

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging
```bash
# Run headed (visible browser)
npm test:e2e:headed

# Debug mode with inspector
PWDEBUG=1 npm test:e2e

# Specific test with trace
npm test:e2e -- tests/e2e/specific.spec.ts --trace on
```

## Performance Testing

### Bundle Size Tests
```bash
npm test -- tests/bundle/
```

### Performance Budget
```bash
npm test -- tests/performance-budget/
```

### Core Web Vitals
```bash
npm test:e2e -- tests/e2e/performance/
```

## Troubleshooting

### Common Issues

**Issue:** Tests timeout
**Solution:**
```typescript
// Increase timeout for slow tests
it('slow test', async () => {}, 10000) // 10 second timeout
```

**Issue:** E2E tests fail locally
**Solution:**
```bash
# Ensure production build
npm run build

# Clear browser state
rm -rf playwright/.auth
```

**Issue:** Module not found errors
**Solution:** Check `jest.config.ts` moduleNameMapper paths

## Best Practices

### Do's ✅
- ✅ Write tests before code (TDD)
- ✅ Test behavior, not implementation
- ✅ Keep tests isolated and independent
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Clean up after tests (afterEach)
- ✅ Test edge cases and error scenarios
- ✅ Maintain test code quality

### Don'ts ❌
- ❌ Skip tests or mark as `.skip` without good reason
- ❌ Test implementation details
- ❌ Write dependent tests (order matters)
- ❌ Leave console.log statements
- ❌ Mock everything (test real behavior when possible)
- ❌ Ignore test failures
- ❌ Write vague test names

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Analytics Testing](./ANALYTICS_TESTING.md)

### Project-Specific
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guide

---

**Questions?** Check CLAUDE.md or ask Doctor Hubert

**Last Updated:** 2025-11-12
