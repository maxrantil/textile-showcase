# Session Handoff: Issue #308 — Next.js image cache TTL fix ✅ COMPLETE

**Date**: 2026-03-02
**Issue**: #308 — First-visit images load slowly (minimumCacheTTL not configured)
**PR**: #309 — merged to master at `b91d953`
**Branch**: `fix/issue-308-image-cache-ttl` — deleted after merge

---

## ✅ Completed Work

### Root cause
`next.config.ts` had no `minimumCacheTTL` configured, so Next.js defaulted to **60 seconds**.
On a low-traffic portfolio site, the `/_next/image` optimization cache was effectively always
cold — every request (or any request >60s after the previous one) triggered:
1. Download original image from Sanity CDN
2. Re-encode to AVIF (CPU-intensive on VPS)
3. Re-cache to `.next/cache/images/`

### Fix
One line added to the `images` block in `next.config.ts`:
```
minimumCacheTTL: 31536000, // 1 year
```
AVIF encoding now happens **once per unique image+size combination** and the result is
served from disk for all subsequent requests for up to a year.

### Not affected
- **Lockdown Mode**: `LockdownImage` component bypasses `/_next/image` entirely
  (uses plain `<img>` with direct Sanity CDN URL) — no change in behaviour
- **AVIF format**: kept; encoding cost is now amortised over 1 year, not 60 seconds

### Tests
All 982 unit/integration tests pass (1 pre-existing skipped suite, unrelated).

---

## 🎯 Current Project State

**Tests**: ✅ All passing
**Branch**: master at `b91d953` (clean)
**Production**: idaromme.dk ✅ (deployment triggered by PM2 auto-restart on new build)
**CI**: All workflows green

### Known open items
- 2 high-severity Dependabot alerts on master (noted in previous sessions, not yet actioned)

---

## 🚀 Next Session Priorities

1. **Dependabot alerts** — 2 high-severity vulnerabilities: `gh api repos/maxrantil/textile-showcase/vulnerability-alerts`
2. **Image cache warmup script** — optional follow-up to #308: pre-populate `/_next/image` cache after each deployment so even the very first visitor post-deploy sees fast loads
3. **New issues** — `gh issue list --state open`

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from Issue #308 completion.

**Last completed**: Issue #308 closed — PR #309 merged (b91d953). Added minimumCacheTTL: 31536000
to next.config.ts; first-visit image slowness on idaromme.dk is resolved.
**Production state**: idaromme.dk healthy, all CI green.
**Reference**: SESSION_HANDOVER.md, gh issue list --state open
**Ready state**: master at b91d953, clean working directory, all tests passing

**Expected scope**: Triage 2 high Dependabot alerts, or optional image cache warmup script.
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `next.config.ts` — image config with new `minimumCacheTTL`
- `src/components/ui/LockdownImage.tsx` — bypasses `/_next/image`, uses Sanity CDN directly
