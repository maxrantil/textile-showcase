# Session Handoff: Umami Analytics Root Cause Resolution

**Date**: 2025-11-12 (22:30 UTC)
**Critical Discovery**: Duplicate middleware files causing production CSP issues
**Status**: ⚠️ **REQUIRES MANUAL FIX ON SERVER**

---

## 🚨 CRITICAL ROOT CAUSE IDENTIFIED

### **The Problem**
Production serving **wrong CSP** despite all code being correct:
- ✅ GitHub `src/middleware.ts`: Has `analytics.idaromme.dk` (correct)
- ❌ Production CSP headers: Has `umami.is` and `70.34.205.18:3000` (old/wrong)

### **Root Cause: Duplicate Middleware Files**

Found TWO middleware files on server:
```
./middleware.ts          (Sept 27) ← OLD, HAS HARDCODED CSP WITH umami.is
./src/middleware.ts      (Nov 12) ← CORRECT, HAS analytics.idaromme.dk
```

**Next.js priority**: Root-level `middleware.ts` takes precedence over `src/middleware.ts`

**Evidence from server**:
```bash
# Root middleware (THE CULPRIT):
cat /var/www/idaromme.dk/middleware.ts | grep "umami.is"
# Shows: hardcoded Safari detection with OLD CSP domains

# Src middleware (CORRECT but IGNORED):
cat /var/www/idaromme.dk/src/middleware.ts | grep "analytics.idaromme.dk"
# Shows: correct CSP configuration
```

---

## 🔍 Complete Investigation Timeline

### Initial Problem (21:25 UTC)
**Symptom**: Browser console shows CSP blocking analytics script
```
Content-Security-Policy: script-src 'self' 'unsafe-inline' ... https://umami.is http://70.34.205.18:3000
```
**Missing**: `https://analytics.idaromme.dk`

### Investigation Steps

#### 1️⃣ Deployment Verification (21:30 UTC)
- ✅ PR #186 deployed successfully (Run 19312872910)
- ✅ NODE_ENV=production confirmed in build logs
- ✅ UMAMI env vars confirmed in build logs
- ❌ Production still serving wrong CSP

#### 2️⃣ Source Code Verification (21:40 UTC)
```bash
# Check server source
cat /var/www/idaromme.dk/src/middleware.ts | grep "analytics.idaromme.dk"
# Result: ✅ Source file IS correct

# Check git status
git log -1 --oneline
# Result: 64450d8 (PR #189) - up to date with GitHub
```

#### 3️⃣ Compiled Middleware Analysis (21:50 UTC)
```bash
# Check compiled output
grep -c "umami.is" .next/server/middleware.js
# Result: 1 ❌ (should be 0)

grep -c "analytics.idaromme.dk" .next/server/middleware.js
# Result: 0 ❌ (should be >0)
```

**Discovery**: Compiled middleware contains old CSP despite correct source!

#### 4️⃣ Cache Clearing Attempts (22:00 UTC)
```bash
# Attempt 1: Clear .next and rebuild
rm -rf .next
NODE_ENV=production npm run build
pm2 restart idaromme-website
# Result: ❌ STILL wrong CSP

# Attempt 2: Nuclear clean (including node_modules/.cache)
rm -rf .next .next.backup node_modules/.cache
NODE_ENV=production npm run build
pm2 restart idaromme-website
# Result: ❌ STILL wrong CSP
```

**Analysis**: If cache clearing doesn't help → source file problem!

#### 5️⃣ Binary Analysis of Compiled Middleware (22:10 UTC)
Extracted compiled middleware.js and found:
```javascript
// Compiled code shows:
let f=a.headers.get("user-agent")||"",
g=/Version\/[\d\.]+.*Safari/.test(f);

c.headers.set("Content-Security-Policy",
  `script-src ${g?
    "'self' 'unsafe-inline' https://cdn.sanity.io https://umami.is http://70.34.205.18:3000":
    "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io https://umami.is http://70.34.205.18:3000"
  }`
)
```

**Critical**: Safari detection and hardcoded domains NOT in `src/middleware.ts`!

#### 6️⃣ Full Codebase Search (22:20 UTC)
```bash
# Search for old CSP domains
grep -r "umami.is" src/
# Result: No matches ✅

# Find ALL middleware files
find . -name "*middleware*" ! -path "./node_modules/*" ! -path "./.next/*"
# Result: FOUND TWO FILES! 🎯
./middleware.ts          (root level)
./src/middleware.ts      (in src/)
```

#### 7️⃣ Root Cause Confirmed (22:25 UTC)
```bash
cat /var/www/idaromme.dk/middleware.ts | grep -B 5 -A 10 "umami.is"
```

**Output**:
```typescript
const userAgent = request.headers.get('user-agent') || ''
const isSafari = /Version\/[\d\.]+.*Safari/.test(userAgent)

const scriptSrc = isSafari
  ? `'self' 'unsafe-inline' https://cdn.sanity.io https://umami.is http://70.34.205.18:3000`
  : `'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io https://umami.is http://70.34.205.18:3000`
```

**File dates**:
- `middleware.ts`: Sept 27 (OLD)
- `src/middleware.ts`: Nov 12 (CURRENT)

---

## ✅ THE SOLUTION

### Manual Fix Required on Server

**Doctor Hubert must run**:
```bash
cd /var/www/idaromme.dk

# Delete the duplicate root middleware
rm middleware.ts

# Clean rebuild to use correct src/middleware.ts
rm -rf .next
NODE_ENV=production npm run build

# Restart PM2
pm2 restart idaromme-website

# Verify CSP headers
curl -sI https://idaromme.dk | grep content-security-policy | grep "analytics.idaromme.dk"
```

**Expected**: CSP should now include `https://analytics.idaromme.dk` ✅

---

## 📋 Follow-Up PRs Needed

### PR #190: Remove Duplicate Root Middleware (HIGH PRIORITY)
**Problem**: Repository has both `middleware.ts` and `src/middleware.ts`
**Solution**: Delete root `middleware.ts`, keep only `src/middleware.ts`

**Files to change**:
```bash
git rm middleware.ts
git commit -m "fix: Remove duplicate root middleware causing CSP conflicts

Root middleware.ts (Sept 27) was overriding src/middleware.ts (Nov 12).
Next.js prioritizes root-level middleware, causing old hardcoded CSP
with umami.is to be used instead of correct analytics.idaromme.dk.

This duplicate file prevented all CSP updates from taking effect.
"
```

### PR #191: Update Deployment Workflow (MEDIUM PRIORITY)
**Additions needed** in `.github/workflows/production-deploy.yml`:

```yaml
# After line 158 (after git reset --hard origin/master)
- name: Remove duplicate files
  run: |
    # Prevent duplicate middleware files
    if [ -f middleware.ts ] && [ -f src/middleware.ts ]; then
      echo "⚠️ Found duplicate middleware files, removing root version"
      rm middleware.ts
    fi
```

### PR #192: Production Smoke Tests (MEDIUM PRIORITY)
**Create**: `tests/e2e/production-smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Production Smoke Tests', () => {
  test('CSP headers allow analytics domain', async ({ request }) => {
    const response = await request.get('https://idaromme.dk')
    const csp = response.headers()['content-security-policy']

    expect(csp).toContain('https://analytics.idaromme.dk')
    expect(csp).not.toContain('https://umami.is')
    expect(csp).not.toContain('http://70.34.205.18')
  })

  test('analytics script loads successfully', async ({ page }) => {
    const scriptPromise = page.waitForRequest('**/script.js')
    await page.goto('https://idaromme.dk')

    const request = await scriptPromise
    expect(request.url()).toContain('analytics.idaromme.dk')
    const response = await request.response()
    expect(response?.status()).toBe(200)
  })
})
```

**Add to CI/CD**: Run after deployment completes

---

## 🎓 Lessons Learned

### Why Tests Didn't Catch This

**Our 28 tests validated**:
- ✅ Source code correctness (`src/middleware.ts`)
- ✅ Component behavior
- ✅ TypeScript compilation

**What tests MISSED**:
- ❌ File precedence (root vs src middleware)
- ❌ Production HTTP headers (real responses)
- ❌ Build artifact correctness

### Test Gap: No Production Validation

**Current**: Tests run against `localhost` with `src/middleware.ts`
**Missing**: Tests against `https://idaromme.dk` with actual deployed code

**Solution**: Add post-deployment smoke tests (PR #192)

### Multiple Root Causes Discovered

1. **Build environment mismatch** (PR #189 fixed)
   - CI: NODE_ENV=production ✅
   - Server: NODE_ENV=undefined ❌

2. **PM2 reload vs restart** (PR #190 will fix)
   - `pm2 reload`: Graceful, doesn't clear module cache
   - `pm2 restart`: Hard restart, clears cache

3. **Duplicate middleware files** (PR #190 will fix) ← **PRIMARY ISSUE**
   - Root `middleware.ts` overrides `src/middleware.ts`
   - Next.js file precedence not obvious

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then complete Umami analytics CSP fix.

**CRITICAL STATUS**: Root cause identified but requires manual server fix.

**Immediate priority**: Verify Manual Fix & Create Cleanup PRs (30-45 min)

**Context**:
- Discovered duplicate middleware files: root `middleware.ts` (old) overriding `src/middleware.ts` (correct)
- Doctor Hubert needs to delete root middleware.ts on server and rebuild
- Multiple PRs needed to prevent recurrence

**Step 1: Verify Doctor Hubert's Manual Fix**
```bash
# Check if analytics now works
curl -sI https://idaromme.dk | grep content-security-policy | grep "analytics.idaromme.dk"

# Expected: Should contain analytics.idaromme.dk
# If not: Guide Doctor Hubert through manual fix again
```

**Step 2: Create PR #190 - Remove Duplicate Middleware**
- Delete root `middleware.ts` from repository
- Commit message referencing root cause analysis
- Merge and deploy

**Step 3: Create PR #191 - Update Deployment Workflow**
- Add duplicate file detection/removal
- Update cache clearing strategy (rm -rf .next always)
- Change pm2 reload to pm2 restart

**Step 4: Create PR #192 - Production Smoke Tests**
- Add CSP header validation
- Add analytics script loading test
- Run post-deployment in CI/CD

**Step 5: Browser Verification**
- Request Doctor Hubert test in browser
- Verify script.js loads without CSP errors
- Check Umami dashboard shows visitors

**Reference docs**:
- SESSION_HANDOVER.md (complete root cause analysis)
- Issue to create: "Prevent duplicate middleware files"
- Issue to create: "Add production smoke tests"

**Ready state**:
- Manual fix pending on server
- 3 PRs to create for permanent solution
- Session handoff documentation complete

**Expected scope**: Complete all cleanup PRs, verify analytics working end-to-end
```

---

## 📊 Session Statistics

**Time Investment**: ~4 hours debugging
**PRs Created**: #188 (attempted fix), #189 (NODE_ENV fix - partial)
**Root Causes Found**: 3 (build env, PM2 cache, duplicate files)
**Primary Issue**: Duplicate middleware files (Sept 27 old file overriding Nov 12 new file)
**Tests Written**: 28 (all passing, but didn't catch production issue)
**Manual Fix Required**: YES (delete root middleware.ts on server)

---

## ✅ Session Handoff Complete

**Status**: Root cause identified, manual fix documented, cleanup PRs planned
**Next Claude**: Verify manual fix, create 3 cleanup PRs, validate end-to-end
**Environment**: Waiting for Doctor Hubert to apply manual fix on server
