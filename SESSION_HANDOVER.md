# Session Handoff: Issue #388 merged, project page LCP image (#395, #429)

**Date**: 2026-11-14
**Issue**: #388 - forced vendor chunking (closed); #395 - duplicate font and wasted LCP image downloads (open); #429 - LCP in CI Lighthouse (open)
**PR**: #433 merged to master as `c8cac4e`; #390 closed as superseded; #434 - project page LCP image (draft)
**Branch**: perf/issue-395-project-lcp-image

---

## ✅ Completed This Session

- **PR #433 merged** (squash, `c8cac4e`): per-route JavaScript 541KB to about 140KB. Before the merge the pages were
  checked in Playwright Chromium against a production build at 1440px and 390px (all pages hydrate with 8 to 12
  scripts, gallery, project, menu, contact form typing and browser back work, every navigation stays client-side),
  and the E2E suite passed on Desktop Chrome, Mobile Chrome and Safari smoke.
- **PR #390 closed** as superseded. Its branch `perf/reduce-client-js` is kept: it still holds the per-route
  JavaScript budget check (`scripts/route-js-budget.mjs`), not brought over.
- **Project page, first image** (`perf/issue-395-project-lcp-image`, commit `771a927`):
  - The desktop carousel's main image is the LCP element. It was fetched at low priority: in Next 16.1.6 the
    `priority` prop adds a preload but no `fetchpriority`. It now carries `fetchPriority="high"`.
  - `sizes` was a fixed 800px, so every image was requested 828px wide: too large for a portrait image shown 493px
    wide, too small for a landscape one shown 1070px wide. `sizes`, `width` and `height` now come from the asset's
    own dimensions and mirror `.desktop-project-img` in `src/styles/desktop/project.css`.
  - The neighbouring images are fetched after the first main image has loaded, with the same `sizes`, so stepping
    to the next image reuses that request (checked in the browser: no new request for the shown image).
  - The page no longer preloads the cover image, which neither layout shows first and which failed on CORS.
- **Measured** (local production build on top of `c8cac4e`, CI Lighthouse settings, 5 runs per page, warm image cache):

  | | LCP image | Before paint also | LCP before | LCP after |
  |---|---|---|---|---|
  | `composing-tones` (portrait) | 121KB low priority, now 86KB high | next image 41KB, now after paint | 3.0-4.5s (median 3.65s) | 3.2-3.7s (median 3.55s) |
  | `what-if-the-future-is-made-of-salt` (landscape) | 41KB at 828px, now 61KB at 1080px | | 2.8-4.3s (median 3.45s) | 3.4-3.7s (median 3.62s) |

  The medians did not move. The spread narrowed: the worst run dropped by 0.6s to 0.8s, and on the landscape page the
  best run rose because the image is now requested at the width it is shown (it was upscaled before). What is counted
  before paint is now about 290KB to 310KB: document 20KB, font 48KB, LCP image 61-86KB, CSS 14KB, scripts 144KB.
- **CI Lighthouse on PR #434** (run 43595519010), project page `what-if-the-future-is-made-of-salt`, three runs,
  against the last run on PR #433: 4.90s, 3.43s, 3.42s against 4.42s, 3.80s, 3.80s. The two warm runs are 0.37s
  lower; the first run is slow in both because CI starts with an empty image cache. Layout shift in the first run
  went from 0.019 to 0. The other pages are unchanged (`/` 3.7s, `/about` 2.6s, `/contact` 2.8s).
- A side effect on phones: the server renders the desktop layout first (#397), and its main image is now requested
  128px wide there instead of 640px before the layout swap.

## 🎯 Current Project State

**Tests**: ✅ full Jest suite passes locally (1,283 tests, 23 skipped), type-check and lint clean. E2E not run locally; CI runs it once the PR is marked ready
**Branch**: ✅ clean, pushed
**CI/CD**: ✅ PR #434 (draft): Jest, Lighthouse audit, bundle size pass. E2E only runs once the PR is marked ready

**Not tested**: Firefox and Safari are not installed here. The project page change was checked in Playwright Chromium
at 1440x900, 1350x940, 1024x700 and 390x844 (no layout shift on desktop, no console errors).

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. Draft PR #434: mark ready so E2E runs (not within a second of a push, see carry-forward notes), then merge
2. Next levers for LCP on every page, by weight counted before paint: the font (48KB; whether the file holds
   more than the Latin range the CSS declares was not checked, fontTools is not installed here), then the two shared
   script chunks (62KB and 51KB)
3. `/projects` still preloads a Sanity image with `crossorigin="anonymous"`; the CDN sends no CORS header for it, so
   the preload fails in a normal browser and the image is fetched twice (#395)
4. Home LCP 3.7s in CI: about 100KB of gallery images ahead of paint, plus three lazy ones (65KB) that start at
   hydration
5. LCP threshold in `lighthouserc.js` (last task of #429): draft PR #402 sets 2.5s; decide once CI shows the figure
6. Project page layout swap on phones: #397
7. Real iPhone check of `/contact`: tap the name field straight after load and type
8. The older draft PRs (#386 to #405) mostly conflict with master and need a decision: rebase or close. #396 overlaps
   with #431

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

- CI's Lighthouse runs Chrome with `--disable-web-security`, so a preload that fails on CORS in a normal browser
  succeeds there and its bytes are counted.
- `next start` processes from earlier sessions may still be listening on ports 3001, 3100 and 3101. After a rebuild
  they serve the old page HTML, so check the port before measuring (this session used 3111).
- A rebuild keeps `.next/cache/images`, but an image width that was never requested is generated on first request
  (1.3s to 1.5s here). Request each page once before measuring, or the first Lighthouse run is an outlier.
- The CI Lighthouse figures per run are in the bot's "Lighthouse Performance Report" comment on the PR. GitHub's
  storage host for artifacts and job logs timed out from this machine on 2026-11-14.
- `gh` here is 2.4.0: no `gh pr checks --watch`, no `gh run list --branch`. Use `gh api repos/.../actions/runs`.
- Pushing and marking a PR ready within a second of each other cancels the E2E run for the "ready" event; re-run it
  with `gh api -X POST repos/maxrantil/textile-showcase/actions/runs/<id>/rerun`.
- The carousel's `sizes` in `DesktopImageCarousel.tsx` repeats the 200px and 280px from `.desktop-project-img` in
  `src/styles/desktop/project.css`; they must stay in step.

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

Read CLAUDE.md to understand our workflow, then continue from Issue #395 (draft PR #434: project page LCP image at high priority and at its shown size; PR #433 merged, #390 closed).

**Immediate priority**: mark PR #434 ready so E2E runs, merge it (1 hour)
**Context**: CI LCP on the project page went from 3.8s to 3.4s in warm runs (first run 4.9s on a cold image cache); about 300KB is still counted before paint, half of it scripts
**Reference docs**: SESSION_HANDOVER.md, issues #395 and #429, `src/components/desktop/Project/DesktopImageCarousel.tsx`, lighthouserc.js
**Ready state**: branch perf/issue-395-project-lcp-image pushed and clean; master at `c8cac4e` with PR #433 merged

**Expected scope**: merge the project page PR, then check whether the font file (48KB) can be cut to the Latin range, and remove the failing preload on `/projects`

## 📚 Key Reference Documents

- Issue #395 (duplicate font and image downloads), issue #429, PR #433 (merged), issue #397 (layout swap on project pages)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/app/project/[slug]/page.tsx`, `src/styles/desktop/project.css`
- `src/utils/gallery-images.ts`, `src/app/page.tsx`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
