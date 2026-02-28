# Session Handoff: Issue #296 — proxy.ts wrong location (CSP/HSTS missing) 🔄 IN PROGRESS

**Date**: 2026-02-28
**Issue**: #296 — proxy.ts at project root not detected by Next.js 16 (CSP/HSTS headers missing)
**PR**: #297 — fix/issue-296-proxy-location (open, CI running)
**Branch**: `fix/issue-296-proxy-location`

---

## ✅ Completed This Session

### Context: Starting point
- Session started to verify PR #294 deployment and close Issue #287
- PR #294 deploy succeeded (✅), but production-validation step revealed 22 test failures: no CSP header on idaromme.dk
- Issue #287 was already closed
- Discovered new bug: proxy.ts was never being executed on production

### Root Cause Analysis (Issue #296)

Next.js 16.1.6 renamed `middleware.ts` → `proxy.ts` (confirmed via official docs). The Next.js 16 upgrade (PR #291) correctly renamed the file to `proxy.ts`, BUT placed it at the project root instead of `src/proxy.ts`.

**Why it broke**: Next.js computes `rootDir = path.join(appDir, '..')`. Since `app/` and `pages/` are both in `src/`, `rootDir = src/`. The build scans only immediate children of `rootDir` (non-recursive `opendir`). `proxy.ts` at the project root (`/`) was never in the scan path.

**Evidence**: `middleware-manifest.json` showed `"middleware": {}` — no proxy registered. No CSP/HSTS/Permissions-Policy headers in production curl output. Build output showed no `ƒ Proxy (Middleware)` line.

**Fix applied** (PR #297):
- Moved `proxy.ts` → `src/proxy.ts` (correct location)
- Deleted root `proxy.ts` (was dead code — never executed since Next.js 16 upgrade)
- Fixed HSTS check: added `x-forwarded-proto` header check (nginx terminates SSL, forwards HTTP to Node.js, so `request.nextUrl.protocol` was always `http:`)
- Updated `tests/build/middleware-compilation.test.ts` to expect `src/proxy.ts`
- Updated `tests/unit/middleware/*.test.ts` import paths: `../../../proxy` → `../../../src/proxy`

**Verification**:
- Build output: `ƒ Proxy (Middleware)` ✅
- Local server: CSP header present with `analytics.idaromme.dk` ✅
- 948 unit tests passing ✅
- 10/10 middleware build validation tests passing ✅

---

## 🎯 Current Project State

**Tests**: ✅ 948 passing (unit tests)
**Branch**: `fix/issue-296-proxy-location` — PR #297 open
**CI on PR #297**: Running (unit tests, E2E, Lighthouse, performance budget)

**Issues**:
- #296 — open (fix in PR #297)
- #270 — pre-existing event loop leak in QueryCache (low priority)

---

## Agent Validation Status

- [ ] architecture-designer: Not started
- [ ] security-validator: Not started (CSP/HSTS fix — should validate)
- [ ] code-quality-analyzer: Not started
- [ ] test-automation-qa: Not started
- [ ] performance-optimizer: Not started
- [ ] documentation-knowledge-manager: Not started

---

## 🚀 Next Session Priorities

1. **Verify PR #297 CI passes** — all jobs should pass including production-validation smoke tests
2. **Merge PR #297** — once CI green
3. **Close Issue #296** — after merge
4. **Issue #270** — event loop leak in QueryCache (ask Doctor Hubert if this is next priority)

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then verify PR #297 and merge if CI is green.

**Last completed**: Issue #296 fix — moved proxy.ts to src/proxy.ts (CSP/HSTS headers were missing from production because Next.js 16 couldn't find proxy.ts at project root)
**Immediate priority**: Check PR #297 CI results, merge if green, close Issue #296
**Context**: proxy.ts was at project root but Next.js scans rootDir=src/ so it was never detected; 948 tests pass, local server confirms CSP header works
**Reference**: SESSION_HANDOVER.md, gh pr checks 297
**Ready state**: Branch fix/issue-296-proxy-location, PR #297 open with CI running

**Expected scope**: Merge PR #297 → close Issue #296 → assess Issue #270 (event loop leak) or other work.
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `src/proxy.ts` — the proxy file (moved from root)
- `tests/build/middleware-compilation.test.ts` — build validation tests
- Next.js 16 docs: `proxy.ts` is at `src/proxy.ts` for projects with `src/` layout

---

**Session status**: PR #297 open, CI running
