# Session Handoff: Issue #429 - home page LCP and layout shift

**Date**: 2026-11-13
**Issue**: #429 - perf: home page LCP is 5-10s in CI Lighthouse while FCP is 1.1s (open until PR #431 merges)
**PR**: #431 - perf: load only the visible home gallery's images, one font file, no layout shift (draft)
**Branch**: perf/issue-429-home-lcp

---

## ✅ Completed This Session

- **LCP element found**: the second desktop gallery image (`img.desktop-gallery-img`, 57KB through `/_next/image`).
  Measured on a local production build with the `lighthouserc.js` settings (Lighthouse 10.1 through `lhci` 0.12).
- **Cause of the 5-10s figure**: the image paints at about 0.4s in the browser; the large figure is Lighthouse's
  1.6 Mbps simulation, where the image shared the line with 308KB the page never shows on desktop: two hidden phone
  gallery images (166KB preloaded at high priority, 94KB) and the same 48KB font twice.
- **Cause of the 0.122 layout shift**: every desktop gallery image had `width=800 height=600`. The first image is
  portrait, so the second item moved when it loaded. Reproduced in 3 of 3 local runs.
- **Fix in PR #431** (two commits):
  - Image preloads scoped by `media` to the layout that shows the image
  - Eager images in a `<picture>` with an empty source for the hidden layout
  - Desktop gallery images take width and height from the Sanity asset reference
  - Inter 500 served from `inter-400.woff2`; `inter-500.woff2` and a stray copy under `public/fonts/public/fonts/` removed
- **Measured before and after** (local, same settings): LCP median 5.7s (3 runs: 2.8, 5.7, 6.6) to 3.1s (5 runs:
  2.6 to 3.8); CLS 0.122 to 0; page weight 1121KB to 813KB; FCP unchanged at 1.1s.
- **Browser check** (Chromium, 393px and 1350px): each viewport requests only its own gallery's images, one font file,
  no unused-preload warnings.
- This covers tasks 1 and 2 of #395. Its task 3 (project page preload) is untouched, so #395 stays open.

## 🎯 Current Project State

**Tests**: ✅ Jest 1274 passed, 23 skipped; type-check clean; lint 0 errors (25 warnings, none new)
**Branch**: ✅ clean, pushed
**CI/CD**: 🔄 PR #431 is a draft; CI Lighthouse has not run on it yet

**Not tested**: Firefox and Safari (not installed here). E2E suite not run locally.

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. PR #431: read the CI Lighthouse figures for `/`, then mark ready and merge. Close #430 (handoff after #428) as
   superseded by this file
2. Remaining LCP spread: about 560KB of JavaScript in 50 chunks still loads alongside the LCP image. Draft PR #390
   (remove forced vendor chunking) addresses it but conflicts with master
3. LCP threshold in `lighthouserc.js` (last task of #429): draft PR #402 sets 2.5s; decide once CI shows the figure
4. Project page LCP is 8.5-10.2s in CI: #395 task 3 and #397
5. Real iPhone check of `/contact`: tap the name field straight after load and type
6. The older draft PRs (#386 to #405) mostly conflict with master and need a decision: rebase or close. #396 now
   overlaps with #431

### Possible follow-up

- One contact form styled per breakpoint would remove the swap altogether, so focus would never have to be moved. It
  means replacing `MobileContactForm`, `DesktopContactForm` and about 1,700 lines of their tests, so it was left out
  of #426. Same root cause as #397.

### Known behaviour, not changed

- Left/right arrow keys move focus to the new image only when the index did not change: the keydown effect's cleanup
  cancels the pending focus timer on every index change. Same on master.
- When two images share the end of the track, the "Next image" arrow hides at the first of them; the keyboard still
  steps to the last one.

### Carry-forward notes

- CI workflows only run on PRs that target master. For a stacked PR: merge master into its branch, retarget it to master,
  then mark it ready. A retarget of an already-ready PR without a new push skips Jest and the Lighthouse audit.
- The session-handoff check fails a PR that does not change `SESSION_HANDOVER.md`.
- Italics for work titles are not used: only Inter 400 and 500 upright are loaded, so italics would be synthesised.
- The email address stays behind "Show email" (above the form, not plain text).
- Type tokens are defined in three places that must stay in step: `src/styles/base/typography.css`,
  `src/styles/critical/deferred.css` and `public/styles/critical/deferred.css`
- `src/styles/mobile/navigation.css` duplicates rules from `mobile/project.css` and loads after it
- A caption whose title ends in a question mark reads "...SALT?, 2022"
- On the phone project page the "Next" button ends 32px from the right edge, not at the gutter
- `src/styles/mobile/gallery.css` still has an unused `.mobile-gallery-year` rule; the year now sits inside the title heading
- The live header is `src/components/Header`; `components/desktop/Header` and `components/mobile/Header` are not rendered
- Layout (desktop or phone) is chosen after hydration, so E2E tests should target `.mobile-*` / `.desktop-*`
  containers by viewport rather than `:visible`
- The contact form's state lives in `src/components/adaptive/Forms/index.tsx`; the desktop and mobile forms are views
  over it (`DesktopContactFormView`, `MobileContactFormView`). The two layouts are still separate elements, so the
  wrapper moves focus to the replacement field after a swap. Both layouts must keep the field ids `field-name`,
  `field-email`, `field-message`
- E2E tests that use the contact form should go through `ContactPage.goto()`, which waits for hydration and the
  layout swap. `#field-name` being visible does not mean the page is hydrated
- Both home galleries are always in the HTML. Their image URLs, sizes and layout media queries live in
  `src/utils/gallery-images.ts`; the page preloads and both gallery components read from it. The breakpoint there
  mirrors `src/components/adaptive/Gallery/index.module.css` (768px)
- Eager gallery images sit in a `<picture>` with an empty `<source>` for the hidden layout. Do not swap this for
  `loading="lazy"`: Lighthouse's `lcp-lazy-loaded` audit fails on a lazy LCP image
- Weights 400 and 500 of Inter are both served from `public/fonts/inter-400.woff2`
- Measuring locally with the CI Lighthouse settings: build, `npx next start -p 3100`, then `lhci collect` (0.12.x) with a
  config that reuses `lighthouserc.js` without `startServerCommand`, and `CHROME_PATH` set to Playwright's Chromium
- `src/components/ui/ImageNoStyle.tsx` is not used by any component
- Running E2E locally: start `npx next dev --webpack -p 3000` first; the Playwright config reuses it
- Desktop gallery scroll positions are defined twice and must stay in step: the snap rules in
  `src/styles/desktop/gallery.css` and `src/components/desktop/Gallery/scrollTargets.ts`
- The gallery margin (24px) repeats the header's desktop side padding (`1.5rem` in `src/components/Header/Header.css`)
- Both galleries are always in the page and share the `galleryFocusIndex` session key; only the visible one can take focus
- `src/hooks/useHorizontalScroll.ts` and `src/hooks/gallery/useGalleryNavigation.ts` still centre every item, but no
  component uses them

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from Issue #429 (fix in draft PR #431, local LCP median 5.7s to 3.1s, CLS 0.122 to 0).

**Immediate priority**: read CI Lighthouse on PR #431, mark it ready and merge; close #430 as superseded (1 hour)
**Context**: desktop no longer downloads the hidden phone gallery or a duplicate font; JavaScript weight is what remains ahead of the LCP image
**Reference docs**: SESSION_HANDOVER.md, PR #431, issue #395, draft PR #390, lighthouserc.js
**Ready state**: branch perf/issue-429-home-lcp pushed and clean, Jest green; master at `6b97223`

**Expected scope**: merge #431, then decide between #390 (JavaScript chunking) and the project page LCP (#395 task 3, #397)

## 📚 Key Reference Documents

- PR #431, issue #429, issue #395 (duplicate font and image downloads), issue #397 (layout swap on project pages)
- `src/utils/gallery-images.ts`, `src/app/page.tsx`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
