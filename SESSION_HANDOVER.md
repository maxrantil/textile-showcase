# Session Handoff: Issue #293 — CI Shell Injection + Deploy Cleanup ✅ MERGED

**Date**: 2026-02-28
**Issue**: #293 — CI shell injection in branch-protection + node_modules cleanup in production deploy
**PR**: #294 — merged to master at 21:05 UTC
**Branch**: `master` (clean, post-merge at `5a4e766`)

---

## ✅ Completed This Session

### CI Workflow Fixes (Issue #293, PR #294) — MERGED

Fixed two CI failures that appeared on the master push after PR #291 (Next.js 16 upgrade):

| Workflow | Problem | Fix |
|----------|---------|-----|
| `branch-protection.yml` | `${{ github.event.head_commit.message }}` inlined raw commit body into shell — backticks (e.g. `` `proxy` ``) were executed as bash commands, causing `proxy: command not found` | Pass via `env: COMMIT_MSG:` so bash treats the value as a plain string |
| `production-deploy.yml` | VPS build failed with `ENOENT: polyfill-nomodule.js` — stale Next.js 15 node_modules not fully replaced during upgrade | Add explicit `rm -rf node_modules` before `npm ci` in VPS deploy step |

**CI verification on merge**: Branch Protection ✅ immediately passed (first run post-merge confirms fix).

---

## 🎯 Current Project State

**Tests**: ✅ 959 passing (unit tests)
**Branch**: `master` ✅ clean at `5a4e766`
**CI post-PR #294 merge**:
  - ✅ Branch Protection — passing (fix confirmed)
  - ✅ Secret Scanning — passing
  - ✅ Security Monitoring — passing
  - 🔄 Unit Tests — in progress
  - 🔄 Performance Budget — in progress
  - 🔄 Production Deployment — in progress (first deploy with node_modules cleanup)

**Open issues**:
- #287 — still open, pending successful VPS deployment confirmation
- #270 — pre-existing event loop leak in QueryCache (low priority, tracked separately)

**Dependabot**: Two automated Dependabot runs failing (`glob`, `serialize-javascript`) — these are internal Dependabot infrastructure failures, unrelated to our code. GitHub will retry automatically.

---

## 🚀 Next Session Priorities

1. **Verify Production Deployment** — Check CI run for PR #294 merge completed successfully (the `rm -rf node_modules` fix should resolve the `polyfill-nomodule.js` error)
2. **Close Issue #287** — Once VPS deployment is confirmed green, close the Next.js 16 issue
3. **Pre-existing E2E failures** — Desktop/Mobile Chrome gallery tests failing due to Sanity CI credentials. Not a regression. Worth creating a dedicated issue if Doctor Hubert wants to track/fix
4. **Issue #270** — Event loop leak in QueryCache (pre-existing, priority: high label — ask Doctor Hubert if this is next)

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then verify PR #294 deployment and close Issue #287.

**Last completed**: PR #294 merged (CI fixes — shell injection in branch-protection, node_modules cleanup in deploy)
**Immediate priority**: Check Production Deployment CI run for PR #294 merge succeeded, then close Issue #287
**Context**: Next.js 16.1.6 on master since PR #291; VPS deploy was failing with polyfill-nomodule.js ENOENT — fix deployed in #294
**Reference**: SESSION_HANDOVER.md, gh run list to check latest CI
**Ready state**: master clean at 5a4e766, Branch Protection ✅ confirmed fixed

**Expected scope**: Confirm green CI → close #287 → assess Issue #270 (event loop leak) or other work.
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `.github/workflows/branch-protection.yml` — shell injection fix
- `.github/workflows/production-deploy.yml` — node_modules cleanup fix

---

**Session ended**: 2026-02-28
**Status**: CI fixes merged. VPS deployment in progress. Issue #287 pending deployment confirmation.
