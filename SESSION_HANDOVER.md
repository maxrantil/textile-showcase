# Session Handoff: Design review implemented (Issues #411, #413, #415, #418)

**Date**: 2026-11-11
**Issues**: #411, #413, #415, #418 implemented; #417 on hold
**PRs**: #412, #414, #416, #419 (all draft, stacked in that order)
**Branch**: feat/issue-418-alignment-and-contact (top of the stack)

---

## ✅ Completed This Session

Front-end design review of idaromme.dk against the mood board (https://margretheodgaard.com/ and
https://malenebach.dk/), then five of its six items implemented. The review with side-by-side
screenshots is a private artifact (https://claude.ai/artifact/RgjdJbMAPjrEDnwtK3mKuY); it is not in
the repo because the repo is public and the review contains screenshots of other artists' sites.

| PR | Issue | Base | What it does |
| --- | --- | --- | --- |
| #412 | #411 | master | Phone project page: lead image before the text, real image proportions, pale loading placeholder |
| #414 | #413 | #412 | Two text sizes (16px, 20px), regular weight, no capitals or tracking; 64px header anchored to the corners; home gallery images 70vh |
| #416 | #415 | #414 | Desktop project image uses the window height (700px at 1440x900, was 540px); thumbnail strip back on screen |
| #419 | #418 | #416 | Project, About and Contact share one left edge; contact page leads with email reveal and Instagram; plain form fields |

**Merge order**: #412 first, then retarget each following PR to master (or merge the stack bottom-up).
"Fixes #N" only closes an issue when its PR merges into master.

### Decisions and things left out

- **#417 (year in home captions) is on hold, no code written.** The year was removed from the home
  gallery on purpose in #100, and `MobileGalleryItem.test.tsx` asserts it stays hidden. Needs an
  explicit yes from Doctor Hubert.
- **First home image aligned to the left margin** was not done. The gallery's scroll, focus and
  restore logic assumes a centred item; it belongs with #393.
- **Italics for work titles** were not used: only Inter 400 and 500 upright are loaded, so italics
  would be synthesised.
- **The email address stays behind "Show email"** (it was moved above the form, not exposed as plain text).
- The "About This Piece" heading is visually hidden (`sr-only`) and kept for screen readers.

## 🎯 Current Project State

**Tests**: ✅ Jest 1242 passing (23 skipped); `tsc --noEmit` clean
**Lint**: ✅ `npx eslint .` reports 0 errors
**E2E**: design specs (`tests/e2e/design/`) pass on Desktop Chrome and Mobile Chrome. For #414 the smoke,
mobile-navigation and project-browsing specs also passed. **The full E2E suite was not run locally**, and
CI skips it on draft PRs; mark the PRs ready to run it. Firefox and WebKit were not run locally.
**Branch**: ✅ clean, pushed
**CI/CD**: #412 passed its non-Lighthouse checks; the others were still running at handoff

### Agent Validation Status

The named validation agents were not run this session.

## 🚀 Next Session Priorities

1. Review the four draft PRs (on a phone and a laptop), mark ready, let the full E2E suite and Lighthouse run, merge bottom-up
2. Watch Lighthouse on #416: the project page's main image is now requested 1200px high (was 800px)
3. Decide #417 (year in captions)
4. #393 together with left-aligning the first home image

### Carry-forward notes

- Type tokens are defined in three places that must stay in step: `src/styles/base/typography.css`,
  `src/styles/critical/deferred.css` and `public/styles/critical/deferred.css`
- `src/styles/mobile/navigation.css` duplicates rules from `mobile/project.css` and loads after it
- The live header is `src/components/Header`; `components/desktop/Header` and `components/mobile/Header` are not rendered
- Layout (desktop or phone) is chosen after hydration, so E2E tests should target `.mobile-*` / `.desktop-*`
  containers by viewport rather than `:visible`
- Running E2E locally: start `npx next dev --webpack -p 3000` first; the Playwright config reuses it

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from the design-review stack (draft PRs #412, #414, #416, #419).

**Immediate priority**: mark the four PRs ready, fix anything the full E2E suite or Lighthouse reports, merge bottom-up (1-2 hours)
**Context**: five of six design-review items are implemented; #417 (year in captions) waits for a decision because it reverses #100
**Reference docs**: SESSION_HANDOVER.md, tests/e2e/design/, the review artifact linked above
**Ready state**: branch feat/issue-418-alignment-and-contact clean and pushed; Jest 1242 passing; ESLint 0 errors

**Expected scope**: green CI on all four PRs, merged to master, production checked at 1440x900 and on a phone

## 📚 Key Reference Documents

- Review artifact: https://claude.ai/artifact/RgjdJbMAPjrEDnwtK3mKuY
- `tests/e2e/design/type-and-frame.spec.ts`, `desktop-project-image.spec.ts`, `alignment-and-contact.spec.ts`
