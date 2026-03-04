# Session Handoff: Issue #320 — unreliable VPS production deploys (fix implemented)

**Date**: 2026-03-04
**Issue**: #320 — fix: unreliable VPS production deploys (OOM + no-backup-to-restore)
**PR**: #322 — fix: build on GHA runner, rsync artifact to VPS (draft)
**Branch**: `fix/issue-320-vps-deploy-reliability` at `f94a513`

---

## ✅ Completed This Session

- **Issue #320** — workflow rewritten, branch pushed, draft PR #322 opened

### What was done

Rewrote the `deploy` job in `.github/workflows/production-deploy.yml`:

**Before** (on-VPS build, OOM-prone):
```
SSH → git pull → npm ci (all deps) → npm run build → pm2 restart
```

**After** (artifact deploy, no OOM):
```
GHA runner: download .next artifact (built by 'build' job)
GHA runner: rsync .next → VPS as .next.incoming
SSH → git pull → npm ci --omit=dev → promote .next.incoming → pm2 restart
```

New deploy job steps:
1. `Download build artifact` — `actions/download-artifact@v4`, name `build-files`
2. `Set up SSH key for rsync` — writes `VULTR_SSH_KEY` to `~/.ssh/deploy_key`
3. `Rsync build artifact to VPS staging area` — rsync `.next/` → `.next.incoming/` on VPS
4. `Deploy on VPS` — SSH script: verify artifact arrived, backup/restore logic, `npm ci --omit=dev`, promote, `pm2 restart`

Safeguard added: if `.next.incoming` is missing when the SSH step runs, deploy aborts immediately (prevents proceeding with no recovery path).

---

## 🎯 Current Project State

**Tests**: ✅ All passing (982 / 982, unchanged)
**Branch**: `fix/issue-320-vps-deploy-reliability` — 1 commit ahead of master, clean
**Production**: idaromme.dk ✅ live on master (`5f52085`)
**CI**: PR #322 running on GHA — first live test of new deploy path

### Open issues / next steps
- #320 — PR #322 needs 3 consecutive clean deploy runs to verify reliability
- After 3 clean runs: mark PR ready → merge → close #320

---

## 🚀 Next Session Priorities

1. **Verify PR #322 passes CI** — check GHA run on the PR branch
2. **Merge PR #322** once CI is green and deploy succeeds
3. **Confirm reliability** — trigger 2 more deploys (small master commits) and confirm 0 OOM kills
4. **Close Issue #320** after verified runs

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then verify and merge PR #322 (Issue #320).

**Context**: Fix for OOM deploy failures is implemented — GHA now builds and rsyncs
the .next artifact to VPS; VPS only runs npm ci --omit=dev + pm2 restart.
**PR #322**: https://github.com/maxrantil/textile-showcase/pull/322 (draft, awaiting CI)
**Next step**: Check GHA run on PR branch; if green, mark ready → merge → close #320;
then trigger 2 more master deploys to confirm 3 consecutive clean runs.
**Reference**: SESSION_HANDOVER.md, .github/workflows/production-deploy.yml
**Ready state**: branch fix/issue-320-vps-deploy-reliability at f94a513, master clean at 5f52085

**Expected scope**: CI check, merge, reliability verification (3 clean deploy runs).
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `.github/workflows/production-deploy.yml` — the rewritten workflow
- `gh run list --workflow=production-deploy.yml --repo maxrantil/textile-showcase` — deploy history
- PR #322: https://github.com/maxrantil/textile-showcase/pull/322
