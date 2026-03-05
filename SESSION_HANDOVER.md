# Session Handoff: Issue #325 — next.config.ts unconditional bundle-analyzer require

**Date**: 2026-03-05
**Issue**: #325 — fix: next.config.ts unconditionally requires @next/bundle-analyzer (devDep)
**PR**: #326 (pending creation) — fix: guard bundle-analyzer require behind ANALYZE env var
**Branch**: `fix/issue-325-bundle-analyzer-conditional-require`

---

## ✅ Completed This Session

- **Issue #320** — PR #322 merged to master (squash), issue auto-closed ✅
- **Issue #323** — follow-up: upload-artifact skips .next/ as hidden dir; PR #324 merged ✅
- **Issue #325** — follow-up: next.config.ts crashes next start with --omit=dev; fix branch created

### Root cause chain

1. **#320**: VPS `npm ci` OOM-kills during build → fix: build on GHA, rsync artifact
2. **#323**: `upload-artifact@v4` skips `.next/` (hidden dir) → fix: `include-hidden-files: true`
3. **#325**: `next.config.ts` unconditionally `require('@next/bundle-analyzer')` (devDep) → `next start` crashes with `MODULE_NOT_FOUND` → 502 Bad Gateway

`@next/bundle-analyzer` was previously installed via `npm ci` (all deps). Switching to `npm ci --omit=dev` exposed this latent bug: the package isn't available at VPS runtime.

**Fix**: Guard the `require` behind `process.env.ANALYZE === 'true'`, falling back to `(config) => config` identity function.

---

## 🎯 Current Project State

**Tests**: ✅ All passing
**Branch**: `fix/issue-325-bundle-analyzer-conditional-require` — clean, 1-line fix in next.config.ts
**Production**: idaromme.dk — **502 (DOWN)** — Next.js crashing on startup due to missing bundle-analyzer
**CI**: Fix branch not yet pushed

---

## 🚀 Next Session Priorities

1. **Push fix branch → create PR #326 → wait for CI → merge** (should be fast, 1-line fix)
2. **Confirm production deploy succeeds** after merge (no more 502)
3. **Run 3 consecutive clean deploys** to verify #320 reliability goal
4. **Close issue #325** after confirmed clean deploy

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then push and merge fix for Issue #325.

**Context**: 3 fix chain: #322 (build on GHA) → #324 (include-hidden-files) → #325 (guard bundle-analyzer require).
The site is currently 502 because next.config.ts require('@next/bundle-analyzer') crashes
next start when @next/bundle-analyzer is absent (devDep, not installed with --omit=dev).
**Fix**: already coded in next.config.ts on branch fix/issue-325-bundle-analyzer-conditional-require.
**Next step**: git push → gh pr create → CI green → merge → confirm production deploys clean.
**Reference**: SESSION_HANDOVER.md, next.config.ts (lines 1-8), .github/workflows/production-deploy.yml
**Ready state**: fix branch at local HEAD, SESSION_HANDOVER.md updated, production DOWN (502)

**Expected scope**: Push branch, PR, CI check, merge, watch 3 consecutive production deploy runs succeed.
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `next.config.ts` — the conditional require fix (lines 1-8)
- `.github/workflows/production-deploy.yml` — the rewritten workflow
- Issue #325: https://github.com/maxrantil/textile-showcase/issues/325
- PR #322 (merged): VPS build/rsync fix
- PR #324 (merged): include-hidden-files fix
