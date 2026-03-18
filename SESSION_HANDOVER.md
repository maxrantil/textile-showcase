# Session Handoff: Issue #363 — LCP Direct CDN Preload (IN PROGRESS)

**Date**: 2026-03-18
**Issue**: #363 — perf: preload LCP image via direct Sanity CDN URL instead of /_next/image proxy
**PR**: #364 — perf: preload LCP image via direct Sanity CDN URL — bypass /_next/image proxy (OPEN)
**Branch**: perf/issue-363-lcp-direct-cdn-preload

---

## ✅ Completed This Session

### 1. Home Page LCP Investigation

Diagnosed why home page CI Lighthouse LCP (5.7–9.0s) is so much worse than /about (2.8–4.2s):

- **LCP type**: home = gallery image (needs download), about = text h1 (in critical CSS)
- **Five bottlenecks identified** — largest: `/_next/image` proxy overhead (~1.5–2s)
- **Root cause**: preload in `page.tsx` pointed to `/_next/image?url=...` proxy URLs;
  `<Image>` fetched via proxy even though Sanity CDN already serves optimised WebP

### 2. LCP Fix (Issue #363, PR #364 — OPEN)

**Two-file change:**

`MobileGalleryItem.tsx` — add `unoptimized={isPriority}`:
- LCP `<Image>` (index 0, isPriority=true) now renders `<img src="https://cdn.sanity.io/...">` directly
- Eliminates `/_next/image` proxy from the LCP critical path

`page.tsx` — replace `/_next/image` srcset preload with direct CDN href:
```html
<!-- Before: multi-entry /_next/image srcset -->
<link rel="preload" as="image" imageSrcSet="/_next/image?url=...&w=750 750w, ..." />

<!-- After: single href matching unoptimized <img> src exactly -->
<link rel="preload" as="image" href="https://cdn.sanity.io/...?w=800&q=80" fetchpriority="high" />
```

**Tests** (TDD — RED → GREEN):
- `MobileGalleryItem.test.tsx`: mock updated with `data-unoptimized`; 2 new tests
- `page.test.tsx`: all 6 tests rewritten for new direct CDN preload; React 19 hoists
  `<link rel="preload">` to `document.head` — tests updated to query `document.head`

**All 1206 unit tests passing** ✅

### 3. Context: Prior Session Work (2026-03-17)

- PR #354 (undici) + PR #351 (tar) — Dependabot security updates merged ✅
- Issue #358 + PR #359 — production deploy race condition fixed (concurrency group) ✅
- Production idaromme.dk: live, HTTP 200 ✅

---

## 🎯 Current Project State

**Tests**: ✅ 1206 passing (23 skipped)
**Branch**: perf/issue-363-lcp-direct-cdn-preload
**Production**: idaromme.dk — ✅ LIVE
**PR #364**: ⏳ open — E2E + Lighthouse CI pending

### CI Status (PR #364)
- ✅ Unit tests, Bundle size, Safari Smoke, Secret scan, Commit quality
- ⏳ Playwright Desktop/Mobile Chrome pending
- ⏳ Lighthouse Performance Budget pending
- ❌ Verify Session Handoff (fixed by this update)

---

## 📦 Recent Work

| PR | Issue | Description |
|----|-------|-------------|
| #364 | #363 | perf: preload LCP via direct Sanity CDN — bypass /_next/image proxy |
| #359 | #358 | fix: prevent concurrent production deployments — concurrency group |
| #354 | — | build(deps): bump undici 6.23.0→6.24.1 (Dependabot) |
| #351 | — | build(deps): bump tar 7.5.10→7.5.11 (Dependabot) |

---

## 🚀 Next Session Priorities

1. **Merge PR #364** (if CI green): verify Lighthouse CI score improvement on home page
2. **Verify production LCP**: run Lighthouse on idaromme.dk after deploy to confirm ≤1.7s
3. **Issue #349 (optional)** — unused JS: vendor 132KB, framework 61KB

### Key Architecture Notes (carry-forward)
- `MobileGalleryItem`: `unoptimized={isPriority}` — LCP image bypasses `/_next/image`
- Both `MobileGallery` and `DesktopGallery` ALWAYS in SSR HTML — selectors must be viewport-scoped
- `getGallerySelector(page)` helper in `lockdown-mode-simulation.spec.ts`
- `GalleryPage` class (`tests/e2e/utils/page-objects/gallery-page.ts`) — viewport-aware getters
- `Gallery.tsx` focus management: `scrollContainerRef.current?.querySelector(...)` — never bare `document.querySelector`

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from Issue #363 completion.

**Immediate priority**: Merge PR #364 if all CI checks green. Then verify Lighthouse CI
  improvement on home page (expected: ~1.5–2s LCP reduction from direct CDN preload).
**Context**: Issue #363 implemented — LCP image now fetches Sanity CDN directly
  (unoptimized={isPriority} + matching preload href), bypassing /_next/image proxy.
**Reference docs**: SESSION_HANDOVER.md
**Ready state**: perf/issue-363-lcp-direct-cdn-preload pushed, 1206 unit tests passing

**Expected scope**: Merge PR #364, check Lighthouse results, optional Issue #349 bundle size
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `src/app/page.tsx` — LCP preload (direct CDN href, Issue #363)
- `src/components/mobile/Gallery/MobileGalleryItem.tsx` — `unoptimized={isPriority}`
- `.github/workflows/production-deploy.yml` — concurrency group (Issue #358)
- `tests/e2e/utils/page-objects/gallery-page.ts` — viewport-aware GalleryPage
