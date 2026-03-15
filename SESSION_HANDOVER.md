# Session Handoff: Issue #355 — Fix Lighthouse CI start:ci missing script

**Date**: 2026-03-15
**Issue**: #355 — fix: Lighthouse CI on master — 'npm run start:ci' missing script — CLOSED ✅
**PR**: #356 — fix: use npm start instead of missing start:ci in Lighthouse CI — OPEN (pending CI)
**Branch**: fix/issue-355-lighthouse-ci-start-script

---

## ✅ Completed This Session

### 1. Production Lighthouse Verification (Issue #348 follow-up)

Manual Lighthouse run on idaromme.dk confirmed Issue #348 LCP fix is working in production:

**Desktop (simulated throttling):**
| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Performance | 86 | ≥75 | ✅ |
| LCP | 1,710ms | <3,000ms | ✅ |
| FCP | 1,257ms | <2,500ms | ✅ |
| CLS | 0.047 | <0.2 | ✅ |
| TBT | 0ms | — | ✅ |

**LCP sub-parts (desktop):**
- TTFB: 441ms
- Resource load delay: 14ms
- Resource load duration: 506ms
- **Element render delay: 38ms** ✅ (<500ms target)

**Mobile (simulated 3G + 4x CPU):**
| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Performance | 75 | ≥75 | ✅ |
| LCP | 6,610ms | — (mobile 3G baseline) | — |
| CLS | 0.000 | <0.2 | ✅ |
| **Render Delay** | **477ms** | **<500ms** | ✅ |

Issue #348 LCP fix confirmed working. All desktop targets met.

### 2. Lighthouse CI Fix (Issue #355, PR #356)

**Root cause identified:** `lighthouserc.js` CI override set `startServerCommand` to `npm run build && npm run start:ci`, but `start:ci` does not exist in `package.json`. This caused `lhci autorun` to fail with "Missing script: start:ci" on every master push, producing no Lighthouse results (with `continue-on-error: true` masking the failure).

**Evidence:** Run [23084232751](https://github.com/maxrantil/textile-showcase/actions/runs/23084232751) log shows:
```
npm error Missing script: "start:ci"
```

**Fix applied:** Changed `lighthouserc.js` line 169-170 from:
```js
module.exports.ci.collect.startServerCommand =
  'npm run build && npm run start:ci'
```
to:
```js
module.exports.ci.collect.startServerCommand = 'npm start'
```

The workflow already builds in the "Build Application" step before `lhci autorun`, so `npm start` (using the pre-built `.next`) is sufficient.

---

## 🎯 Current Project State

**Tests**: ✅ 1218 passing (23 skipped)
**Branch**: fix/issue-355-lighthouse-ci-start-script
**Production**: idaromme.dk — live, LCP fix verified ✅
**Issue #348**: CLOSED ✅ (production verified this session)
**Issue #355**: CLOSED ✅
**PR #356**: OPEN — Lighthouse CI pending (will confirm fix works)

---

## 📦 Recent Work

| PR | Issue | Description |
|----|-------|-------------|
| #356 | #355 | fix: use npm start instead of missing start:ci in Lighthouse CI |
| #350 | #348 | perf: reduce LCP render delay — server-render gallery via CSS media queries |
| #347 | #345 | perf: preload `/_next/image` URL — Load Delay 2.7s → 432ms |
| #344 | #342 | fix(tests): type assertions for data-testid in BaseFormField |
| #343 | #342 | perf: remove avif → webp (LCP load time 5.5s→0.3s) |

---

## 🚀 Next Session Priorities

1. **Merge PR #356** — once Lighthouse CI confirms results appear (not "No results found")
2. **Dependabot vulnerabilities** — 4 high + 3 moderate severity on master; investigate `gh api repos/maxrantil/textile-showcase/vulnerability-alerts`
3. **Issue #349 (optional)** — unused JS: vendor 132KB, framework 61KB — if Performance still < 75 after all fixes

### Key Architecture Notes (carry-forward)
- Both `MobileGallery` and `DesktopGallery` are ALWAYS in SSR HTML — any selector touching `[data-testid^="gallery-item-"]` or `[data-active="true"]` MUST be scoped to the visible gallery via viewport check (`width < 768 ? mobile-gallery : desktop-gallery`)
- `getGallerySelector(page)` helper pattern is in `lockdown-mode-simulation.spec.ts`
- `GalleryPage` class (`tests/e2e/utils/page-objects/gallery-page.ts`) has viewport-aware getters
- `Gallery.tsx` focus management: `scrollContainerRef.current?.querySelector(...)` — NEVER use bare `document.querySelector` for gallery items
- `format: 'auto'` kept in `MobileGalleryItem` to match preload URL in `page.tsx`

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from Issue #355 (Lighthouse CI fix, PR #356).

**Immediate priority**: Merge PR #356 once Lighthouse CI passes — confirms lhci autorun now
  produces results on master push. Then investigate Dependabot vulnerabilities (4 high, 3 moderate).
**Context**: lighthouserc.js CI startServerCommand was 'npm run start:ci' (missing script → no
  results). Fixed to 'npm start'. Desktop LCP verified at 1,710ms/86 perf on idaromme.dk.
**Reference docs**: SESSION_HANDOVER.md, PR #356
**Ready state**: fix/issue-355-lighthouse-ci-start-script branch, CI pending on PR #356,
  master clean, 1218 unit tests passing

**Expected scope**: Merge #356, Dependabot security audit, optional Issue #349 JS bundle
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `lighthouserc.js` — Lighthouse CI config (fixed in PR #356)
- `src/components/adaptive/Gallery/index.tsx` — server component with CSS media query approach
- `src/components/desktop/Gallery/Gallery.tsx` — scrollContainerRef-scoped focus management
- `tests/e2e/utils/page-objects/gallery-page.ts` — viewport-aware GalleryPage class
