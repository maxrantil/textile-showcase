# Session Handoff: Issue #320 — unreliable VPS production deploys

**Date**: 2026-03-03
**Issue**: #320 — fix: unreliable VPS production deploys (OOM + no-backup-to-restore)
**PR**: none yet — issue opened, work deferred to next session
**Branch**: master at `d546572` (clean)

---

## ✅ Completed This Session

- **Issue #317** (project page SSR waterfall) — implemented, merged, deployed ✅
- **Issue #320** (unreliable VPS deploys) — diagnosed and opened; fix deferred

### Issue #317 recap
Replaced `ClientProjectContent` client-side fetch with server-side
`getProjectWithNavigation` in `page.tsx`. Images now load from initial HTML.
PR #318 merged, PR #319 (handoff) merged. Site serving 200s on all routes.

### Issue #320 diagnosis
4 of the last 8 production deploy runs failed before a manual rerun succeeded.
Two failure modes:

1. **OOM during `npm ci`** — npm v11 (recently upgraded alongside Node v22) uses
   significantly more memory than v10. The 964MB VPS gets OOM-killed consistently.

2. **No backup to restore** — when a previous deploy already deleted `.next` without
   creating a backup, rollback has nothing to restore. PM2 can't serve anything → site
   down. This happened on the SSR fix deploy (run #22590501837).

### Proposed fix (Issue #320)
Build on the GitHub Actions runner (plenty of memory), ship the artifact to the VPS
via rsync/scp. VPS only runs `npm ci --omit=dev` + `pm2 restart`.

```
Current:  VPS: git pull → npm ci (all deps) → npm run build → pm2 restart
Better:   GHA: npm ci → npm run build → rsync .next + package.json to VPS
          VPS: npm ci --omit=dev → pm2 restart
```

Also add a safeguard: abort the deploy if no `.next` exists at backup time rather
than proceeding without a recovery path.

---

## 🎯 Current Project State

**Tests**: ✅ All passing (982 / 982)
**Branch**: master at `d546572` (clean)
**Production**: idaromme.dk ✅ live (deployed via rerun of #22590599653)
**CI**: Deploy pipeline unreliable — see Issue #320

### Open issues
- #320 — unreliable VPS production deploys ← **next priority**

---

## 🚀 Next Session Priorities

1. **Fix Issue #320** — move build to GHA runner, rsync artifact to VPS
2. **Verify deployment reliability** — confirm 3+ consecutive deploys succeed

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then fix Issue #320.

**Context**: Production deploys have been failing consistently — OOM kills npm ci
on the 964MB VPS (npm v11 is too memory-hungry), and a missing-backup edge case
left the site down twice. Issue #320 has full diagnosis and proposed solution.
**Proposed fix**: build on the GHA runner, rsync .next artifact to VPS; VPS only
runs npm ci --omit=dev + pm2 restart.
**Reference**: SESSION_HANDOVER.md, .github/workflows/production-deploy.yml
**Ready state**: master at d546572, clean working directory, all tests passing,
site live at idaromme.dk

**Expected scope**: Rewrite the deploy job in production-deploy.yml, test by
merging a small change and watching 3 consecutive clean deploy runs.
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `.github/workflows/production-deploy.yml` — the deploy workflow to fix
- `gh run list --workflow=production-deploy.yml --repo maxrantil/textile-showcase` — deploy history
