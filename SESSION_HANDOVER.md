# Session Handoff: Issue #323 — upload-artifact skips .next/ as hidden dir

**Date**: 2026-03-04
**Issue**: #323 — fix: upload-artifact skips .next/ as hidden dir (deploy broken after #322)
**PR**: #324 — fix: include .next/ in upload-artifact (Fixes #323)
**Branch**: `fix/issue-323-upload-artifact-hidden-next`

---

## ✅ Completed This Session

- **Issue #320** — PR #322 merged to master (squash), issue auto-closed ✅
- **Issue #323** — follow-up bug discovered and fixed: PR #324 open, awaiting CI + merge

### Issue #320 recap

PR #322 rewrote the `deploy` job in `production-deploy.yml`:

**Before** (on-VPS build, OOM-prone):
```
SSH → git pull → npm ci (all deps) → npm run build → pm2 restart
```

**After** (artifact deploy, no OOM):
```
GHA runner: build job uploads .next/ as 'build-files' artifact
GHA runner: deploy job downloads artifact → rsync .next.incoming to VPS
SSH → git pull → npm ci --omit=dev → promote .next.incoming → pm2 restart
```

### Issue #323 — the follow-up bug

After merging #322, the first production deploy failed:
```
Unable to download artifact(s): Artifact not found for name: build-files
```

Root cause: `actions/upload-artifact@v4` defaults to `include-hidden-files: false`.
The `.next/` path starts with `.` — treated as a hidden directory — so zero files
were uploaded despite `npm run build` succeeding.

Fix: add `include-hidden-files: true` to the upload step (1-line change).

---

## 🎯 Current Project State

**Tests**: ✅ All passing
**Branch**: `fix/issue-323-upload-artifact-hidden-next` — clean
**Production**: idaromme.dk — still on previous build (deploy broken since #322 merge)
**CI**: PR #324 running on GHA

### Open issues / next steps
- #323 — PR #324 awaiting CI + merge
- After merge: confirm 3 consecutive clean production deploys to verify full reliability

---

## 🚀 Next Session Priorities

1. **Confirm PR #324 CI is green** and merge
2. **Watch the post-merge production deploy** — should succeed with artifact found
3. **Trigger 2 more deploys** (small master commits) for 3 consecutive clean runs
4. **Close Issue #323** after verified runs (and confirm #320 still closed)

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then verify and merge PR #324 (Issue #323).

**Context**: PR #322 (Issue #320) merged but introduced a follow-up bug — upload-artifact
skips .next/ as a hidden directory; PR #324 is the 1-line fix.
**PR #324**: https://github.com/maxrantil/textile-showcase/pull/324 (awaiting CI)
**Next step**: Check CI; if green, merge; watch production deploy succeed; then trigger
2 more master deploys to confirm 3 consecutive clean runs (reliability verification for #320).
**Reference**: SESSION_HANDOVER.md, .github/workflows/production-deploy.yml
**Ready state**: master at fe0e8ee, fix branch at 55ff330, production deploy currently broken

**Expected scope**: Merge #324, confirm 3 clean deploy runs, close #323.
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `.github/workflows/production-deploy.yml` — the rewritten workflow
- PR #322: https://github.com/maxrantil/textile-showcase/pull/322 (merged)
- PR #324: https://github.com/maxrantil/textile-showcase/pull/324 (open)
- Issue #323: https://github.com/maxrantil/textile-showcase/issues/323
