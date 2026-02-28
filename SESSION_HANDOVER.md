# Session Handoff: Issue #288 — Batch Dependabot Security/Minor Dependency Updates

**Date**: 2026-02-28
**Issue**: #288 — batch Dependabot security/minor dependency updates
**PR**: #289 — chore: batch Dependabot security/minor dependency updates
**Branch**: `master` (squash-merged, clean)
**Commit**: `bf16dac`

---

## ✅ Completed This Session

### Dependabot PR Batch (Issue #288, PR #289)

Consolidated 7 conflicting Dependabot PRs into a single clean update:

| Package | Change | Type |
|---------|--------|------|
| webpack | 5.101.3 → 5.105.0 | Direct dev dep |
| lodash | 4.17.21 → 4.17.23 | Transitive security fix |
| lodash-es | 4.17.21 → 4.17.23 | Transitive security fix |
| rollup | 4.50.2 → 4.59.0 | Transitive |
| minimatch | 9.0.5 → 9.0.9 | Transitive security fix |
| tar | 6.2.1 → 7.5.9 | Transitive |
| @isaacs/brace-expansion | 5.0.0 → 5.0.1 | Transitive security fix |

Individual Dependabot PRs #272, #273, #276, #277, #278, #280, #282 closed (all commented).

### Next.js 16 Upgrade — Issue #287 Created

PR #274 (next 15→16) was closed. Issue #287 tracks the full migration with all breaking changes documented:
- Turbopack now default for `next build` (our webpack config will fail the build)
- `middleware.ts` → `proxy.ts` rename required
- `eslint` option in `next.config.js` must be removed
- `next lint` script must be updated
- Async params/searchParams synchronous compat removed
- `eslint-config-next` version bump needed

### Remaining audit issues (13) — acceptable, not fixable without breaking changes
- `glob` deep in `sanity` dep tree — needs upstream sanity update
- `serialize-javascript` — npm "fix" would downgrade webpack to 4.x
- `undici` in GitHub Actions CI packages — not runtime

---

## 🎯 Current Project State

**Tests**: ✅ 959 passing, 0 failing (1 suite skipped — analytics, intentional)
**Branch**: `master` ✅ clean at `bf16dac`
**VPS**: ✅ Running on previous master (`0c5327f`) — no deployment needed (lock file / dev deps only)
**Open issues**: #287 (Next.js 16 upgrade — planned, not urgent today)

---

## 🚀 Next Session Priorities

1. **Issue #287: Next.js 16 upgrade** — major version migration with breaking changes. Key work:
   - Add `--webpack` flag to build scripts (quick unblock) or migrate to Turbopack
   - Rename `middleware.ts` → `proxy.ts`
   - Remove `eslint` option from `next.config.js`
   - Fix `"lint": "next lint"` script
   - Audit async `params`/`searchParams` usage in pages/layouts
   - Update `eslint-config-next` to `^16.x`
   - Security CVEs addressed: CVE-2025-59471, CVE-2025-59472, CVE-2026-23864
2. Any new feature/content work from Doctor Hubert

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then pick up from Issue #288 completion.

**Last completed**: Issue #288 (✅ closed) — batch Dependabot security/minor dep updates merged to master
**Commit**: bf16dac on master, VPS still on 0c5327f (no redeploy needed — lock file only)
**Open work**: Issue #287 — Next.js 16 upgrade (major migration, breaking changes documented)
**Reference**: SESSION_HANDOVER.md, Issue #287

**Next priority**: Issue #287 Next.js 16 upgrade — involves webpack config strategy,
middleware.ts rename, eslint config cleanup, async params audit, security CVE fixes.

**Expected scope**: Plan and implement the Next.js 16 migration carefully.
```

---

**Session ended**: 2026-02-28
**Status**: Dependabot batch complete. Next.js 16 upgrade planned in Issue #287.
