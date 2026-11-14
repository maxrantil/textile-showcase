# Session Handoff: Issue #429 - LCP spread explained, per-route JavaScript (#388)

**Date**: 2026-11-14
**Issue**: #429 - perf: home page LCP is 5-10s in CI Lighthouse while FCP is 1.1s (open); #388 - forced vendor chunking
**PR**: #431 merged to master as `9c53155`; #433 - perf: remove forced vendor chunking (draft)
**Branch**: perf/issue-388-route-chunks

---

## ✅ Completed This Session

- **PR #431 merged** (squash, `9c53155`) after the E2E suite passed on Desktop Chrome, Mobile Chrome and Safari smoke.
  PR #430 closed as superseded.
- **The LCP spread is explained.** It is produced by Lighthouse's network simulation, not by the pages:
  - In the 12 CI runs of PR #431 every run of a page made the same requests with the same sizes. The browser painted
    the LCP element at 0.11s to 0.24s in 10 of the 12 runs.
  - Lighthouse then replays, at 1.6 Mbps, the requests that had finished before that paint. On localhost the 43 script
    chunks (541KB) finish within the same 0.1s to 0.2s, so a paint 60ms later counts several hundred KB more.
  - `/contact` in CI: 151KB finished before paint gave 2.8s, 305KB gave 3.7s, 493KB gave 6.4s. `/about`: 150KB 2.7s,
    301KB 3.8s, 418KB 5.5s. Home and the project page follow the same order.
  - The upper end of the spread is therefore the page weight: 663KB on `/contact`, 847KB on home.
- **The chunking change from draft PR #390 tested on its own**, on top of master (local production build, CI Lighthouse
  settings, 5 runs per page, before and after):

  | | JavaScript | Page weight | Time to interactive | LCP range (median) |
  |---|---|---|---|---|
  | `/contact` before | 541KB, 43 scripts | 663KB | 8.0-8.5s | 1.7-2.9s (2.2s) |
  | `/contact` after | 136KB, 10 scripts | 257KB | 3.2-3.7s | 1.6-2.9s (2.3s) |
  | `/` before | 541KB, 43 scripts | 814KB | 5.9-9.0s | 2.3-5.4s (4.3s) |
  | `/` after | 141KB, 11 scripts | 413KB | 3.4-3.7s | 2.9-4.3s (3.5s) |

  This machine paints later than the CI runner (0.2s to 0.5s), so the local `/contact` runs never reached the slow end
  seen in CI and its LCP range did not move. On home the worst run dropped from 5.4s to 4.3s. The change lowers the
  ceiling; it does not remove the run-to-run variation locally.
- **CI Lighthouse on PR #433** (run 43569766855), three runs per page, against PR #431's run:

  | | PR #431 | PR #433 |
  |---|---|---|
  | `/contact` | 2.8s, 3.7s, 6.4s | 2.80s, 2.81s, 2.81s |
  | `/about` | 2.7s, 3.8s, 5.5s | 2.65s, 2.65s, 2.66s |
  | `/` | 4.2s, 6.0s, 8.4s | 3.7s, 3.7s, 5.2s |
  | project page | 2.7s, 6.3s, 6.5s | 3.6s, 4.7s, 5.7s |

  The spread on the text pages is gone: all of each page's 10 or so scripts now finish before paint in every run, so
  the same weight is counted each time. Time to interactive went from about 7.4s to 2.7s. The slow home and project runs
  (5.2s, 5.7s) are the first run of each, where the server took 0.3s to 0.4s to answer and paint came at 0.8s.
- `.github/workflows/lighthouse-ci.yml` listed `next.config.js` in its path filter; the file is `next.config.ts`, so a
  config-only change skipped the Lighthouse audit. Fixed in PR #433.
- **Decision on #390**: its chunking commit is the right change, but the PR carries 17 commits stacked on #386 and #387
  and conflicts with master. The one commit is now on `perf/issue-388-route-chunks` from master (`next.config.ts` and
  two tests). #390 still holds the per-route JavaScript budget check (`scripts/route-js-budget.mjs`), not brought over.

## 🎯 Current Project State

**Tests**: ✅ the two changed suites pass (16 tests), type-check clean. Full Jest and E2E not run locally on this branch; CI runs them
**Branch**: ✅ clean, pushed
**CI/CD**: ✅ PR #433 (draft): Jest, Lighthouse audit, bundle size pass. E2E only runs once the PR is marked ready

**Not tested**: the chunking change in a browser by hand (PR #390 records a Chromium check of the same commit on its
own base, at 1440px and 390px). Firefox and Safari not installed here.

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. PR #433: check the pages by hand at desktop and phone widths, mark ready (starts E2E), then merge
2. Close #390 once #388 is merged; decide whether to bring over its route JavaScript budget check as its own PR
3. Home LCP is now 3.7s in CI with about 250KB of images and fonts counted before paint, and the project page 3.6s to
   4.7s. Next lever is the image weight ahead of the LCP image (#429, #395 task 3)
4. LCP threshold in `lighthouserc.js` (last task of #429): draft PR #402 sets 2.5s; decide once CI shows the figure
5. Project page LCP: #395 task 3 and #397
6. Real iPhone check of `/contact`: tap the name field straight after load and type
7. The older draft PRs (#386 to #405) mostly conflict with master and need a decision: rebase or close. #396 overlaps
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

Read CLAUDE.md to understand our workflow, then continue from Issue #388 (draft PR #433: per-route JavaScript 541KB to about 140KB; CI LCP on `/contact` and `/about` now 2.7-2.8s in every run).

**Immediate priority**: check pages by hand, mark PR #433 ready so E2E runs, merge it, then close #390 (1-2 hours)
**Context**: the 3s-9s LCP spread comes from Lighthouse replaying whatever finished before paint at 1.6 Mbps; less JavaScript lowers the ceiling
**Reference docs**: SESSION_HANDOVER.md, PR #433, issue #429, draft PR #390, lighthouserc.js
**Ready state**: branch perf/issue-388-route-chunks pushed and clean; master at `9c53155` with PR #431 merged

**Expected scope**: merge #433, then cut the image weight ahead of the LCP image on home (3.7s) and the project page (3.6-4.7s)

## 📚 Key Reference Documents

- Issue #388 and PR #433, PR #431 (merged), issue #429, issue #395 (duplicate font and image downloads), issue #397 (layout swap on project pages)
- `src/utils/gallery-images.ts`, `src/app/page.tsx`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
