# Session Handoff: Issue #342 — Performance Audit + Fixes (MERGED)

**Date**: 2026-03-09
**Issue**: #342 — closed ✅
**PRs**: #343 (avif→webp), #344 (TS fix) — both merged to master ✅
**Branch**: `master` (clean)
**Next Issue**: #345 — open, ready to implement

---

## ✅ Completed This Session

### Performance Audit (Lighthouse mobile, idaromme.dk)
- Ran full Lighthouse audit: Performance 54, LCP 6.5s, TBT 380ms, CLS 0.127, Speed Index 11.4s
- Root causes identified:
  1. avif encoding on VPS via `sharp` was taking 5+ seconds per image (LCP bottleneck)
  2. Sanity CDN returning 400 for `?fm=avif` (console errors, browser retry cascade)
  3. Aspect ratio hint mismatch in `MobileGalleryItem` (landscape 4:3 vs actual portrait images → CLS)

### Fixes — PR #343
- `next.config.ts`: `formats: ['image/webp']` — removed avif (encoding too slow on VPS)
- `FirstImage.tsx`: removed avif `<source>`, webp-only `<picture>`, updated JSDoc
- `page.tsx`, `projects/page.tsx`, `project/[slug]/page.tsx`: preload type `image/avif` → `image/webp`
- `MobileGalleryItem.tsx`: `width=800 height=600` → `width=600 height=800` (portrait 3:4 aspect ratio)
- `FirstImage.test.tsx`: updated tests — assert avif absent, webp present

### TypeScript Fix — PR #344
- `BaseFormField.test.tsx`: type assertions for `data-testid` in `extraInputProps`/`extraTextareaProps`
  (TS2353 excess property check blocked CI deployment)

### Lighthouse Re-run (after deploy)
| Metric | Before | After |
|---|---|---|
| Performance | 54 | 57 |
| Best Practices | 96 | **100** ✅ |
| LCP load time (image phase) | 5,509ms | **339ms** ✅ |
| Speed Index | 11.4s | **3.6s** ✅ |
| CLS | 0.127 | **0** ✅ |
| Console 400 errors | avif 400 | **None** ✅ |
| LCP total | 6.5s | 7.1s ⚠️ (bottleneck shifted) |

### Why LCP total didn't improve (new bottleneck discovered)
- The avif fix exposed a pre-existing problem: **no `/_next/image` preload in initial HTML**
- Preloads in `<head>` point to Sanity CDN URLs (`FirstImage`), but `MobileGalleryItem` uses `/_next/image`
- Browser must wait for React hydration (~2.7s) to discover the real LCP image URL
- Render delay (3.3s) = main thread blocked by JS execution (~3s of script eval + parsing)

---

## 🎯 Current Project State

**Tests**: ✅ 1211 passing (23 skipped)
**Branch**: `master` — clean, up to date with origin
**Open Issues**: #345 (ready to implement)
**Production**: idaromme.dk — stable, Best Practices 100, console errors clean

---

## 📦 Recent Merged Work

| PR | Issue | Description |
|----|-------|-------------|
| #344 | #342 | fix(tests): type assertions for data-testid in BaseFormField |
| #343 | #342 | perf: remove avif → webp (LCP load time 5.5s→0.3s, Speed Index 3.6s) |
| #341 | #339 | docs: session handoff |
| #340 | #339 | DesktopButton loadingText prop + 76 unit tests |

---

## 🚀 Next Session Priorities

1. **Issue #345** — Preload `/_next/image` URL in `page.tsx` to eliminate 2.7s LCP load delay
2. **JS code splitting** (separate future issue) — reduce Render Delay from 3.3s

### Issue #345 Implementation Notes
- In `page.tsx` (server component), generate `/_next/image` srcset URLs for first gallery image
- Add `<link rel="preload" as="image" imageSrcSet="..." imageSizes="100vw" fetchPriority="high">`
- Sizes to preload: 750w, 828w, 1080w, 1200w (covers mobile DPR 1–3)
- Quality: 75 (Next.js default)
- Base URL formula: `/_next/image?url=${encodeURIComponent(getOptimizedImageUrl(imageSource, { width: 800, quality: 80 }))}&w=BREAKPOINT&q=75`
- Expected: Load Delay 2,771ms → ~200ms, LCP 7.1s → ~3–4s, Performance score ~70+

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then implement Issue #345 — preload /_next/image URL for LCP.

**Immediate priority**: Issue #345 — add /_next/image preload to page.tsx (quick fix, ~1–2 hours)
**Context**: avif→webp (PR #343) fixed LCP load time (5.5s→0.3s) but exposed a missing preload — browser waits 2.7s for JS hydration to discover the LCP image URL; preloading /_next/image srcset in SSR HTML should cut that to ~200ms
**Reference docs**: SESSION_HANDOVER.md (has implementation notes), Issue #345 (has full spec)
**Ready state**: master branch clean, 1211 tests passing, idaromme.dk stable

**Expected scope**: Add /_next/image preload link to page.tsx, possibly projects/page.tsx; run Lighthouse to verify LCP improvement
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `src/app/page.tsx` — add /_next/image preload here (server component)
- `src/components/mobile/Gallery/MobileGalleryItem.tsx` — LCP element source
- `src/components/server/FirstImage.tsx` — server-rendered image (not the LCP element)
- `next.config.ts` — image config (webp only, deviceSizes, minimumCacheTTL)
