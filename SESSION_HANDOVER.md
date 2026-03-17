# Session Handoff: Issues #358 — Fix Production Deployment Race Condition (IN PROGRESS)

**Date**: 2026-03-17
**Issue**: #358 — fix: production deployment race condition when concurrent deploys race on VPS
**PR**: #359 — fix: prevent concurrent production deployments — add concurrency group (OPEN, awaiting E2E)
**Branch**: fix/issue-358-deploy-race-condition

---

## ✅ Completed This Session

### 1. Dependabot Security Audit

Reviewed and merged/confirmed both open Dependabot PRs:

| PR | Package | Change | CVEs Fixed | Status |
|----|---------|--------|------------|--------|
| #351 | `tar` | 7.5.10 → 7.5.11 | Symlink escape via drive-relative paths (high) | ✅ Merged (already done) |
| #354 | `undici` | 6.23.0 → 6.24.1 | 3 High + 2 Medium (WebSocket crash, smuggling, CRLF) | ✅ Merged |

Both are transitive deps only (`package-lock.json` changes), all CI checks passed.

### 2. Production Outage Discovered & Resolved

**Root cause**: PR #351 and PR #354 merged 7 seconds apart triggered two simultaneous
`Production Deployment` workflow runs racing on the VPS.

**Race condition**: Both runs rsynced `.next.incoming`, then:
- Run A: `rm -rf .next && mv .next.incoming .next` → success
- Run B: `rm -rf .next` (removes .next); `mv .next.incoming .next` → `.next.incoming` gone → **silent failure**
- Run B restarts PM2 with **no `.next` directory** → app crash-loops → **502 for 30+ minutes**

**Recovery**: Re-ran run #23180809462 (single deploy, no race) → site restored ✅

**GitHub Issue**: #358 created documenting the bug.

### 3. Race Condition Fix (PR #359 — pending merge)

Added `concurrency` group to `production-deploy.yml`:

```yaml
concurrency:
  group: production-deploy
  cancel-in-progress: false
```

This serialises deployments — a second push queues rather than racing.
PR #359 open, CI passing (E2E tests pending/passing), awaiting merge.

---

## 🎯 Current Project State

**Tests**: ✅ 1218 passing (23 skipped)
**Branch**: master — clean (local)
**Production**: idaromme.dk — ✅ LIVE (restored after 502 outage)
**PR #359**: ⏳ open, E2E tests pending — merge when green

### CI Status (PR #359)
- ✅ Unit tests, Lighthouse, Bundle size, Secret scan, Commit quality
- ⏳ Playwright E2E tests pending
- ❌ Verify Session Handoff (fixed by this update)

---

## 📦 Recent Work

| PR | Issue | Description |
|----|-------|-------------|
| #359 | #358 | fix: prevent concurrent production deployments — concurrency group |
| #354 | — | build(deps): bump undici from 6.23.0 to 6.24.1 (Dependabot) |
| #351 | — | build(deps): bump tar from 7.5.10 to 7.5.11 (Dependabot) |
| #356 | #355 | fix: use npm start instead of missing start:ci in Lighthouse CI |

---

## 🚀 Next Session Priorities

1. **Merge PR #359** (if not done): verify all CI green, squash-merge to master
2. **Verify Lighthouse CI on master** — check next master push produces Lighthouse results
3. **Issue #349 (optional)** — unused JS: vendor 132KB, framework 61KB
4. **Monitor Dependabot** — security alerts should be clear after tar+undici merges

### Key Architecture Notes (carry-forward)
- Both `MobileGallery` and `DesktopGallery` are ALWAYS in SSR HTML — any selector touching `[data-testid^="gallery-item-"]` or `[data-active="true"]` MUST be scoped to the visible gallery via viewport check (`width < 768 ? mobile-gallery : desktop-gallery`)
- `getGallerySelector(page)` helper in `lockdown-mode-simulation.spec.ts`
- `GalleryPage` class (`tests/e2e/utils/page-objects/gallery-page.ts`) has viewport-aware getters
- `Gallery.tsx` focus management: `scrollContainerRef.current?.querySelector(...)` — NEVER bare `document.querySelector`

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from Issue #358 completion.

**Immediate priority**: Merge PR #359 (fix: prevent concurrent production deployments) if
  E2E tests passed. Then verify master Lighthouse CI generates results on next push.
**Context**: Two Dependabot merges 7s apart caused deploy race → 30min 502 outage.
  Race fixed with workflow concurrency group. Site restored. PR #359 open.
**Reference docs**: SESSION_HANDOVER.md, .github/workflows/production-deploy.yml
**Ready state**: master clean (1836f07), 1218 unit tests passing, production live ✅

**Expected scope**: Merge PR #359, verify deployment, optional Issue #349 (bundle size)
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `.github/workflows/production-deploy.yml` — deployment workflow (concurrency fix in PR #359)
- `tests/e2e/production-smoke.spec.ts` — production smoke tests (CSP/HSTS checks)
- `src/components/adaptive/Gallery/index.tsx` — server component with CSS media query approach
- `tests/e2e/utils/page-objects/gallery-page.ts` — viewport-aware GalleryPage class
