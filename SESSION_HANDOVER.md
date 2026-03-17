# Session Handoff: Issue #358 — Production Deployment Race Condition (CLOSED)

**Date**: 2026-03-17
**Issue**: #358 — fix: production deployment race condition — CLOSED ✅
**PR**: #359 — fix: prevent concurrent production deployments — MERGED ✅
**Branch**: master (squash-merged from fix/issue-358-deploy-race-condition)

---

## ✅ Completed This Session

### 1. Dependabot Security Audit

Reviewed and merged both open Dependabot PRs:

| PR | Package | Change | CVEs Fixed | Status |
|----|---------|--------|------------|--------|
| #351 | `tar` | 7.5.10 → 7.5.11 | Symlink escape via drive-relative paths (high) | ✅ Merged |
| #354 | `undici` | 6.23.0 → 6.24.1 | 3 High + 2 Medium (WebSocket crash, smuggling, CRLF) | ✅ Merged |

Both are transitive deps only (`package-lock.json` changes). All security vulnerabilities cleared.

### 2. Production Outage Discovered & Resolved

**Root cause**: PR #351 and PR #354 merged 7 seconds apart triggered two simultaneous
`Production Deployment` workflow runs racing on the same VPS.

**Race condition sequence**:
1. Both runs rsynced `.next.incoming` to the VPS (each overwrote the other)
2. Run A: `rm -rf .next && mv .next.incoming .next` → success
3. Run B: `rm -rf .next` → removes the active `.next`; `mv .next.incoming .next` → `.next.incoming` already gone → **silent failure**
4. Run B restarts PM2 with **no `.next` directory** → app crash-loops → **502 for 30+ minutes**

**Recovery**: Re-ran deployment run #23180809462 (single run, no race) → site restored ✅

### 3. Race Condition Fix (Issue #358, PR #359 — MERGED)

Added `concurrency` group to `.github/workflows/production-deploy.yml`:

```yaml
concurrency:
  group: production-deploy
  cancel-in-progress: false
```

`cancel-in-progress: false` ensures pending deploys queue (not dropped) — the latest commit will deploy once the current deploy finishes. Simple 7-line fix to a structural deployment reliability issue.

---

## 🎯 Current Project State

**Tests**: ✅ 1218 passing (23 skipped)
**Branch**: master — clean (a377349)
**Production**: idaromme.dk — ✅ LIVE (HTTP 200)
**Issue #358**: CLOSED ✅
**PR #359**: MERGED ✅ (squash `a377349`)

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

1. **Verify master Lighthouse CI** — check that next master push produces Lighthouse results (not "No results found" as before PR #356 fix)
2. **Issue #349 (optional)** — unused JS: vendor 132KB, framework 61KB
3. **Monitor Dependabot** — security alerts should be clear after tar+undici merges

### Key Architecture Notes (carry-forward)
- Both `MobileGallery` and `DesktopGallery` are ALWAYS in SSR HTML — any selector touching `[data-testid^="gallery-item-"]` or `[data-active="true"]` MUST be scoped to the visible gallery via viewport check (`width < 768 ? mobile-gallery : desktop-gallery`)
- `getGallerySelector(page)` helper in `lockdown-mode-simulation.spec.ts`
- `GalleryPage` class (`tests/e2e/utils/page-objects/gallery-page.ts`) has viewport-aware getters
- `Gallery.tsx` focus management: `scrollContainerRef.current?.querySelector(...)` — NEVER bare `document.querySelector`

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from Issue #358 completion.

**Immediate priority**: Verify Lighthouse CI on master now produces results.
  Check recent master push CI run to confirm Lighthouse audit runs (not "No results found").
**Context**: Issue #358 closed — deploy race condition fixed with concurrency group.
  Dependabot security updates merged (tar, undici — 4 high + 2 moderate CVEs cleared).
**Reference docs**: SESSION_HANDOVER.md, .github/workflows/production-deploy.yml
**Ready state**: master clean (a377349), 1218 unit tests passing, production live ✅

**Expected scope**: Lighthouse CI verification, optional Issue #349 (bundle size optimisation)
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `.github/workflows/production-deploy.yml` — deployment workflow (concurrency fix in `a377349`)
- `tests/e2e/production-smoke.spec.ts` — production smoke tests (CSP/HSTS checks)
- `src/components/adaptive/Gallery/index.tsx` — server component with CSS media query approach
- `tests/e2e/utils/page-objects/gallery-page.ts` — viewport-aware GalleryPage class
