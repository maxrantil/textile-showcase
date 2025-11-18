# Session Handoff: Issue #136 - Mobile Visibility Fix Required

**Date**: 2025-11-18 (Session 11)
**Issue**: #136 - Investigate systematic visibility pattern in E2E tests ⚠️ PARTIAL FIX
**PR**: #226 - https://github.com/maxrantil/textile-showcase/pull/226 🔄 DRAFT (converted back)
**Branch**: fix/issue-136-visibility-pattern (pushed to origin)
**Status**: ⚠️ **DESKTOP FIXED, MOBILE BROKEN** - Requires mobile CSS investigation

---

## 🚨 Current Situation (Session 11 Update)

### What Happened This Session

1. ✅ **Fixed ESLint Error**: Changed `@ts-ignore` to `@ts-expect-error` in Gallery.tsx:107
2. ✅ **All Draft CI Checks Passed**: Bundle Size, Jest, Lighthouse, all validations ✅
3. ✅ **Marked PR Ready for Review**: Triggered full E2E test suite
4. ❌ **E2E Tests Failed**: Mobile visibility issue discovered
5. ✅ **Converted PR Back to Draft**: Following "do it by the book" motto

### E2E Test Results Analysis

**Desktop Chrome (101/118 tests passing):**
- ✅ **Visibility Test PASSES** (line 247: FirstImage visible)
- ❌ **Loading Test FAILS** (line 263: Image loading timeout - Issue #225, NOT related to visibility)
- ✅ **Desktop viewport fix WORKS**

**Mobile Chrome (FAILED):**
- ❌ **Visibility Test FAILS** (line 247: FirstImage hidden when should be visible)
- **Root Cause**: Mobile CSS still hiding FirstImage despite media query fix
- **Element State**: `Expected: visible, Received: hidden`
- **Viewport**: 375x667 (Mobile Chrome simulation)

### Decision Made: Option C - Complete Fix Before Merge

**Rationale (per /motto):**
- ✅ Maintains quality standards (no failing tests)
- ✅ Complete solution (fixes all viewports)
- ✅ Follows CLAUDE.md ("complete the task")
- ✅ Would pass all agent validations
- ✅ "Low time-preference" - quality over speed
- ✅ "Slow is smooth, smooth is fast" - fix right once

**Rejected Options:**
- ❌ Option A (Fix mobile now, no analysis): Complex, timeline uncertain
- ❌ Option B (Merge desktop only): Violates TDD, creates technical debt, would fail agents

---

## 🔍 Mobile Visibility Issue - Investigation Needed

### Known Facts

1. **Desktop Viewport**: ✅ FirstImage visible and working correctly
2. **Mobile Viewport**: ❌ FirstImage hidden (should be visible)
3. **Test Location**: `tests/e2e/workflows/image-user-journeys.spec.ts:247`
4. **Element**: `<div data-first-image="true" class="first-image-container FirstImage-module__IQkVPW__container">`

### Current Mobile CSS Fix (Not Working)

**File**: `src/styles/mobile/gallery.css:362-390`

```css
@media (max-width: 768px) {
  /* Mobile-specific styles that should NOT affect FirstImage */
  .first-image-container {
    display: none !important; /* ← This may still be applying */
  }
}
```

### Hypotheses for Mobile Failure

1. **CSS Specificity**: Mobile `display: none !important` has higher specificity than expected
2. **Media Query Threshold**: 768px breakpoint not matching Mobile Chrome viewport (375px)
3. **CSS Cascade Order**: Mobile CSS loading after FirstImage module CSS
4. **Missing Override**: Need explicit mobile visibility rule for FirstImage
5. **Class Name Conflict**: FirstImage-module CSS not overriding mobile styles

### Files to Investigate

1. `src/styles/mobile/gallery.css` - Mobile CSS rules
2. `src/components/server/FirstImage.module.css` - FirstImage component CSS
3. `src/styles/global.css` - Global CSS rules
4. Build output - Check CSS bundling order

---

## ✅ Completed Work (Sessions 9-11)

### Session 9-10: Desktop Visibility Fix

**Fixed 5 Critical Issues:**
1. ✅ CSS position conflict (FirstImage.module.css)
2. ⚠️ Mobile CSS bleeding (PARTIAL - desktop works, mobile broken)
3. ✅ Network-aware MIN_DISPLAY_TIME
4. ✅ Proper image load detection
5. ✅ Corrected test timing expectations

**Commits:**
1. `1b40b75` - "fix: resolve systematic visibility pattern in E2E tests"
2. `251cd36` - "fix: use @ts-expect-error instead of @ts-ignore for ESLint compliance"

### Session 11: CI Validation & Mobile Discovery

**Actions Taken:**
1. ✅ Fixed ESLint compliance issue
2. ✅ Pushed ESLint fix to remote
3. ✅ Verified all draft CI checks pass
4. ✅ Marked PR ready for review
5. ✅ Full E2E suite ran in CI
6. ✅ Analyzed E2E failures
7. ✅ Performed systematic option analysis
8. ✅ Converted PR back to draft

**CI Results:**
- Bundle Size Validation: ✅ PASS
- Jest Unit Tests: ✅ PASS
- Lighthouse Performance: ✅ PASS
- E2E Desktop Chrome: ⚠️ 101/118 PASS (visibility ✅, loading ❌ Issue #225)
- E2E Mobile Chrome: ❌ FAIL (visibility issue)

---

## 🎯 Current Project State

**Branch**: `fix/issue-136-visibility-pattern` (pushed to origin, 2 commits)
**PR**: #226 (DRAFT) - https://github.com/maxrantil/textile-showcase/pull/226
**Working Directory**: Clean (playwright-report is test artifact)
**Tests**: Desktop ✅ Visibility passing, Mobile ❌ Visibility failing

**Issue Status:**
- Issue #136: ⚠️ PARTIAL (desktop fixed, mobile broken)
- Issue #225: ⏳ OPEN (image loading timeout - separate concern)

**Latest Commits:**
1. `1b40b75` - Original visibility fixes
2. `251cd36` - ESLint compliance fix

**PR Status**: DRAFT (converted back from ready)

---

## 🚀 Next Session Action Plan

### Immediate Priority: Fix Mobile Visibility

**Step 1: Investigate Mobile CSS Cascade** (30-60 min)
1. Read `src/styles/mobile/gallery.css` - Examine all FirstImage-related rules
2. Read `src/components/server/FirstImage.module.css` - Check specificity
3. Read `src/styles/global.css` - Look for conflicting rules
4. Check CSS bundling order in build output

**Step 2: Run Local Mobile Test** (15 min)
```bash
npx playwright test tests/e2e/workflows/image-user-journeys.spec.ts \
  -g "slow 3G" --project="Mobile Chrome" --debug
```
- Inspect element in DevTools
- Check computed styles
- Identify which CSS rule is hiding FirstImage

**Step 3: Implement Fix** (30-60 min)
- Based on investigation findings
- Likely need to add explicit mobile override for FirstImage
- May need to adjust media query or specificity

**Step 4: Validate Fix** (30 min)
```bash
# Test mobile viewport
npx playwright test tests/e2e/workflows/image-user-journeys.spec.ts \
  -g "slow 3G" --project="Mobile Chrome"

# Test desktop still works
npx playwright test tests/e2e/workflows/image-user-journeys.spec.ts \
  -g "slow 3G" --project="Desktop Chrome"
```

**Step 5: Commit, Push, Mark Ready** (15 min)
```bash
git add [fixed files]
git commit -m "fix: resolve mobile FirstImage visibility issue"
git push
gh pr ready 226
```

### Expected Outcome

- ✅ Desktop viewport: FirstImage visible (already working)
- ✅ Mobile viewport: FirstImage visible (fixed)
- ✅ All E2E visibility tests pass
- ⏳ Image loading tests still fail (Issue #225 - separate)

### Agent Consultations Required

Before finalizing mobile fix:
- **`test-automation-qa`**: Validate mobile test coverage
- **`code-quality-analyzer`**: Review CSS fix quality
- **`ux-accessibility-i18n-agent`**: Ensure mobile UX not compromised

---

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then fix mobile FirstImage visibility issue for PR #226.

**Immediate priority**: Fix Mobile Visibility (2-3 hours)
**Context**: Desktop visibility ✅ works, Mobile visibility ❌ broken - FirstImage hidden on 375px viewport when should be visible
**Root Cause**: Mobile CSS in `src/styles/mobile/gallery.css` still hiding FirstImage despite media query fix
**Test Failing**: `tests/e2e/workflows/image-user-journeys.spec.ts:247` on Mobile Chrome (375x667 viewport)
**Reference docs**: SESSION_HANDOVER.md, PR #226, mobile/gallery.css, FirstImage.module.css
**Ready state**: PR #226 in DRAFT, 2 commits on branch, all non-E2E CI checks passing

**Expected scope**:
1. Investigate mobile CSS cascade (read files)
2. Run local mobile test with debugger
3. Fix mobile CSS specificity/cascade issue
4. Validate both desktop and mobile viewports pass
5. Commit, push, mark PR ready for final review

**Success criteria**: Both desktop AND mobile E2E visibility tests pass in CI

---

## 📚 Key Files Reference

### CSS Files (Investigation Priority)
1. `src/styles/mobile/gallery.css:362-390` - Mobile styles (suspected culprit)
2. `src/components/server/FirstImage.module.css` - FirstImage component styles
3. `src/styles/global.css` - Global CSS rules

### Test Files
1. `tests/e2e/workflows/image-user-journeys.spec.ts:247` - Failing mobile test

### Component Files
1. `src/components/desktop/Gallery/Gallery.tsx:105-131` - Network-aware timing (working)
2. `src/components/server/FirstImage.tsx` - FirstImage component

---

## 🔧 Debugging Commands for Next Session

```bash
# Run failing mobile test with debug
npx playwright test tests/e2e/workflows/image-user-journeys.spec.ts \
  -g "slow 3G" --project="Mobile Chrome" --debug

# Check CSS specificity in mobile styles
grep -A 10 "first-image" src/styles/mobile/gallery.css

# Verify media query breakpoint
grep "max-width" src/styles/mobile/gallery.css | grep -E "(768|767)"

# Check mobile viewport config
grep -A 5 "Mobile Chrome" playwright.config.ts
```

---

## 🎯 Systematic Option Analysis (Completed)

**Decision: Option C - Draft & Complete Fix** ✅

| Criteria | Score | Rationale |
|----------|-------|-----------|
| Simplicity | ✅ | One complete solution |
| Robustness | ✅ | Fixes all viewports |
| Alignment | ✅ | Matches CLAUDE.md standards |
| Testing | ✅ | All tests pass |
| Long-term | ✅ | No technical debt |
| Agent Validation | ✅ | Would pass all agents |

**Agents Would Approve**: ✅
- `code-quality-analyzer`: Complete fix
- `test-automation-qa`: All tests passing
- `architecture-designer`: Clean approach

---

**Last Updated**: 2025-11-18 (Session 11 - Complete)
**Next Review**: After mobile fix complete
