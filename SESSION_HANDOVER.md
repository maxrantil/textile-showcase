# Session Handoff: PR #434 merged, font weight axis (#429), /projects preloads (#395)

**Date**: 2026-11-14
**Issue**: #395 - duplicate font and wasted LCP image downloads (open); #429 - LCP in CI Lighthouse (open)
**PR**: #434 merged to master as `5814ffc`; #437 - font weight axis (draft); #438 - `/projects` preloads (draft)
**Branch**: perf/issue-429-font-weight-axis (#437) and perf/issue-395-projects-preload (#438), both from master

---

## ✅ Completed This Session

- **PR #434 merged** (squash, `5814ffc`): the project page's first image is fetched at high priority and at the size
  it is shown. Master had moved (#436, Umami back on), so master was merged into the branch first; Jest passed
  locally (1,299 tests) and in CI, and the E2E suite passed on Desktop Chrome, Mobile Chrome and Safari smoke, with
  the new `analytics-resilience` job.
- **CI Lighthouse on the final run of PR #434**, three runs per page:

  | | LCP |
  |---|---|
  | `/` | 5.11s, 3.20s, 3.74s |
  | `/about` | 2.65s, 2.65s, 2.65s |
  | `/contact` | 2.82s, 2.81s, 2.82s |
  | project page | 4.96s, 3.41s, 3.43s |

  The first run of the two image pages is slow because CI starts with an empty image cache. Layout shift is 0 in
  every run.
- **The font, checked** (draft PR #437, commit `c73f275`). `public/fonts/inter-400.woff2` was already limited to the
  Latin range: 230 code points, 518 glyphs. Its weight came from the weight axis, which ran from 100 to 900 while
  the CSS declares 400 and 500 only. With the axis limited to 400-500 the file is 32,136 bytes, down from 48,256.
  - Code points, glyphs, layout features and vertical metrics are unchanged (compared with fontTools).
  - Rendered in Chromium under the site's two `@font-face` rules: weights 300 and 400 are pixel-identical, 500 and
    600 keep the same line width and differ only in anti-aliasing.
  - Dropping the unused layout features (`frac`, `tnum`, `pnum`, `numr`, `dnom`) would save 3KB more; not done.
  - New test in `tests/unit/fonts-no-duplicates.test.ts`: the preloaded font stays within 36KB.
- **`/projects` preloads** (draft PR #438, commit `39db32e`). The page shows the same galleries as home but
  preloaded one image at a width and quality neither gallery requests, in CORS mode, so the preload failed and the
  image was fetched again. Home's preload links moved into `src/components/server/GalleryImagePreloads.tsx` and
  both pages render it. Home's output is unchanged.
  - New test file `src/app/projects/__tests__/page.test.tsx` (5 tests; 4 failed before the change).
  - Checked against a production build in Playwright Chromium at 1440x900 and 390x844: `/projects` and `/` make
    the same 5 image requests, none twice, and no CORS error is logged.

## 🎯 Current Project State

**Tests**: ✅ full Jest suite passes locally on both branches (1,295 tests on #438's branch before this handoff
commit; the font branch's three font tests pass), type-check clean. E2E not run locally on the two new branches
**Branch**: ✅ both clean and pushed
**CI/CD**: 🔄 #437 and #438 are drafts; E2E only runs once a PR is marked ready. The production deploy of `5814ffc`
was running when this was written and its result was not checked

**Not tested**: Firefox and Safari are not installed here. No Lighthouse run was made for #437 or #438; CI's
Lighthouse will show the figures on each PR. CI's Chrome runs with web security off, so the failing `/projects`
preload succeeded there: #438 will not show as a gain in CI, and `/projects` is not among the pages CI measures.

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. Confirm the production deploy of `5814ffc` succeeded and the project pages look right on idaromme.dk
2. Draft PRs #437 (font) and #438 (`/projects` preloads): review, mark ready so E2E runs, merge. Both carry this
   same handoff file, so the second one merges cleanly after the first
3. After the deploy that includes #436: open idaromme.dk without an ad blocker and confirm the visit under Realtime
   in Umami (carried over from the #435 session)
4. Next levers for LCP on every page: the two shared script chunks (62KB and 51KB)
5. Home LCP 3.2s to 3.7s in CI on warm runs: about 100KB of gallery images ahead of paint, plus three lazy ones
   (65KB) that start at hydration
6. LCP threshold in `lighthouserc.js` (last task of #429): draft PR #402 sets 2.5s; `/about` and `/contact` are at
   2.65s and 2.8s, the image pages at 3.2s to 3.7s
7. Close #395 once #438 is merged: its three tasks are then done (the task list in the issue is unticked)
8. Project page layout swap on phones: #397
9. Real iPhone check of `/contact`: tap the name field straight after load and type
10. The older draft PRs (#386 to #405) mostly conflict with master and need a decision: rebase or close. #396
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
  `src/utils/gallery-images.ts`; the page preloads (`src/components/server/GalleryImagePreloads.tsx` once PR #438
  is merged, used by `/` and `/projects`) and both gallery components read from it. The breakpoint there
  mirrors `src/components/adaptive/Gallery/index.module.css` (768px)
- Eager gallery images sit in a `<picture>` with an empty `<source>` for the hidden layout. Do not swap this for
  `loading="lazy"`: Lighthouse's `lcp-lazy-loaded` audit fails on a lazy LCP image
- Weights 400 and 500 of Inter are both served from `public/fonts/inter-400.woff2`, a variable font whose weight
  axis runs from 400 to 500 only (PR #437). Text set at 600 is the 500 face with synthetic bold, and 300 is the 400
  face, as before. A third weight needs a wider axis and a third `@font-face` rule
- To rebuild the font: `pip install fonttools brotli` in a venv, `fonttools varLib.instancer <file> wght=400:500`,
  then `pyftsubset <out> --unicodes='*' --layout-features='*' --flavor=woff2`
- Since #436 a local production build with the real `.env.local` loads Umami and records visits from localhost.
  Block the analytics host in the browser when checking a local build (Playwright `page.route`)
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

Read CLAUDE.md to understand our workflow, then continue from PR #434 (✅ merged as `5814ffc`) with draft PRs #437 and #438 open.

**Immediate priority**: confirm the production deploy, then mark #437 and #438 ready, let E2E run, merge both (1 hour)
**Context**: the font goes from 48KB to 32KB by limiting its weight axis to 400-500 (it was already Latin only); `/projects` gets home's gallery preloads instead of one that failed on CORS
**Reference docs**: SESSION_HANDOVER.md, issues #395 and #429, `src/components/server/GalleryImagePreloads.tsx`, `tests/unit/fonts-no-duplicates.test.ts`
**Ready state**: branches perf/issue-429-font-weight-axis and perf/issue-395-projects-preload pushed and clean; master at `5814ffc`

**Expected scope**: merge both PRs, close #395, confirm a visit in Umami Realtime, then look at the two shared script chunks (62KB and 51KB)

## 📚 Key Reference Documents

- Issue #395, issue #429, PRs #434 and #436 (merged), PRs #437 and #438 (draft), issue #397 (layout swap on project pages)
- `src/components/server/GalleryImagePreloads.tsx`, `src/utils/gallery-images.ts`, `src/app/page.tsx`, `src/app/projects/page.tsx`
- `public/fonts/inter-400.woff2`, `src/styles/critical/critical.css` (the two `@font-face` rules)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/styles/desktop/project.css`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
- #435 (Umami back on, merged in #436): `tests/e2e/analytics-resilience.spec.ts`, issue #263. Left open there:
  `data-domains` on the script tag would stop local builds recording visits, and
  `tests/e2e/analytics-integration.spec.ts` asserts nothing against the dev server
