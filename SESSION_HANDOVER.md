# Session Handoff: Issue #426 - contact form keeps text and focus across the desktop-to-mobile swap

**Date**: 2026-11-13
**Issue**: #426 - fix: text typed into the contact form on a phone is lost when the mobile form replaces the desktop one
**PR**: #428 - fix: keep contact form text and focus when the mobile form replaces the desktop one (draft)
**Branch**: fix/issue-426-contact-form-swap

---

## ✅ Completed This Session

- **Cause narrowed down with a probe** (scripts held back 2.5s so the server HTML stays unhydrated). Two faults, not one:
  1. Text typed before hydration never reached React state. The field kept showing it until the next render, then it
     was emptied. This happened on desktop too (type a name early, then type in the email field: the name vanished).
  2. On a phone the mobile form replaced the desktop one right after hydration. Different elements with their own
     state, so the text and the focus were both dropped.
- **Fix** in `src/components/adaptive/Forms/index.tsx`: the wrapper owns the single `useContactForm` state and passes it
  to `DesktopContactFormView` or `MobileContactFormView`. On mount it reads what is already in the three fields into
  that state and notes which field has focus. After a swap it focuses the replacement field and restores the caret.
- `DesktopContactForm` and `MobileContactForm` still exist and still own their state when used alone; each now renders
  its `...View`. Their existing test files pass unchanged.
- **Tests added first, seen failing, then passing**:
  - `src/components/adaptive/Forms/__tests__/AdaptiveContactForm.test.tsx` (6 tests): text, validation errors, focus
    and caret across the swap; text typed before hydration on desktop and on a phone
  - `tests/e2e/workflows/contact-form.spec.ts`: "Text typed into the server-rendered form is kept and can be sent".
    Failed on Desktop Chrome and Mobile Chrome before the fix
- **`ContactPage.goto()`** now waits for hydration (React's key on `#field-name`) plus two animation frames for the
  layout swap. Without the two frames "Mobile form has proper touch targets" caught the submit button mid-swap once.

## 🎯 Current Project State

**Tests**: ✅ Jest 1265 passed, 23 skipped (78 suites). Contact-form E2E spec on Mobile Chrome and Desktop Chrome:
26 of 26, and 78 of 78 with `--repeat-each=3`. `tsc --noEmit` clean, eslint clean on the changed files
**Branch**: ✅ clean
**CI/CD**: 🔄 running on the draft PR

**Not tested**: Safari and Firefox projects were not run locally. Focus carry-over on a real iPhone is untested: the
replacement field is focused in the same task as the swap, but whether iOS keeps the on-screen keyboard up through it
is unknown.

### Agent Validation Status

The named validation agents are not available in this environment and were not run. The change was reviewed by hand.

## 🚀 Next Session Priorities

1. Get PR #428 through CI and merged, then check `/contact` on production with Pixel 5 emulation and, if possible,
   on a real iPhone (tap the name field straight after load and type)
2. PR #427 (handoff after #425) is superseded by this file; close it once this PR is merged
3. Home LCP in CI Lighthouse is now measurable and was high on PR #425 (seconds, not the 1s target): read the figure
   from the master run for `7156a67` and open an issue if it is still high
4. The older draft PRs (#386 to #405) mostly conflict with master now and need a decision: rebase or close

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
- Running E2E locally: start `npx next dev --webpack -p 3000` first; the Playwright config reuses it
- Desktop gallery scroll positions are defined twice and must stay in step: the snap rules in
  `src/styles/desktop/gallery.css` and `src/components/desktop/Gallery/scrollTargets.ts`
- The gallery margin (24px) repeats the header's desktop side padding (`1.5rem` in `src/components/Header/Header.css`)
- Both galleries are always in the page and share the `galleryFocusIndex` session key; only the visible one can take focus
- `src/hooks/useHorizontalScroll.ts` and `src/hooks/gallery/useGalleryNavigation.ts` still centre every item, but no
  component uses them

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from Issue #426 (fix in draft PR #428, tests green locally, not merged).

**Immediate priority**: get PR #428 through CI, merge it, and check `/contact` in production on a phone (1 hour)
**Context**: the contact form now keeps text typed before hydration and keeps text and focus when the mobile form replaces the desktop one
**Reference docs**: SESSION_HANDOVER.md, src/components/adaptive/Forms/index.tsx, tests/e2e/pages/ContactPage.ts
**Ready state**: branch fix/issue-426-contact-form-swap pushed and clean; Jest and the contact-form E2E spec pass locally

**Expected scope**: merge #428, close #427 as superseded, production check on Pixel 5 emulation, then read the home LCP figure from CI

## 📚 Key Reference Documents

- Issue #426 (measurements), issue #397 (same root cause on project pages)
- `src/components/adaptive/Forms/index.tsx`, `src/components/adaptive/Forms/__tests__/AdaptiveContactForm.test.tsx`
- `tests/e2e/workflows/contact-form.spec.ts`, `tests/e2e/pages/ContactPage.ts`
