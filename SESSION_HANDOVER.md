# Session Handoff: Design review implemented and merged (Issues #411, #413, #415, #418, #417)

**Date**: 2026-11-12
**Issues**: #411, #413, #415 and #418 closed; #417 closes with this PR
**PRs**: #412, #414, #416 and #419 merged; #420 (this PR) is the last of the stack
**Branch**: feat/issue-417-year-in-captions

---

## ✅ Completed This Session

All six items of the front-end design review are implemented. Five are on master; the sixth is this PR.

| PR | Issue | What it does | State |
| --- | --- | --- | --- |
| #412 | #411 | Phone project page: lead image before the text, real image proportions, pale loading placeholder | merged |
| #414 | #413 | Two text sizes (16px, 20px), regular weight; 64px header anchored to the corners; home gallery images 70vh | merged |
| #416 | #415 | Desktop project image uses the window height (700px at 1440x900); thumbnail strip back on screen | merged |
| #419 | #418 | Project, About and Contact share one left edge; contact page leads with email reveal and Instagram | merged |
| #420 | #417 | Home gallery captions show the year after the title ("Composing Tones, 2025"), desktop and phone | this PR |

- Each PR was merged on a green CI run: Jest, E2E on Desktop Chrome, Mobile Chrome and Safari Smoke, Lighthouse budget and audit.
  Exception: on #414 Jest and the Lighthouse audit did not run on the PR (see the retarget note below); both ran green on master
  right after its merge.
- Lighthouse passed on #416, which requests the project page's main image 1200px high (was 800px).
- **#417 reverses #100** (year removed from the phone gallery). Doctor Hubert approved it on 2026-11-12. The old test that
  asserted the year stays hidden is replaced; a work without a year shows the title alone.
- Production deploys after #412, #414 and #416 succeeded.

## 🎯 Current Project State

**Tests**: ✅ Jest 1245 passing (23 skipped); `tsc --noEmit` clean
**Branch**: ✅ clean, pushed
**CI/CD**: 🔄 running on #420

**Local E2E note**: on the development machine 14 of 330 E2E tests fail (all of `tests/e2e/accessibility/focus-restoration.spec.ts`
on Desktop Chrome and Mobile Chrome, and six submit tests of `tests/e2e/workflows/contact-form.spec.ts` on Mobile Chrome). The
same 14 fail there on plain master and pass in CI, so they do not come from this work. The cause is not investigated.

### Agent Validation Status

The named validation agents were not run this session.

## 🚀 Next Session Priorities

1. If not already done: merge #420 and check production at 1440x900 and on a phone
2. #393 together with left-aligning the first home image (the gallery's scroll, focus and restore logic assumes a centred item)
3. Find out why the 14 E2E tests above fail on the development machine
4. The older draft PRs (#386 to #405) mostly conflict with master now and need a decision: rebase or close

### Carry-forward notes

- CI workflows only run on PRs that target master. For a stacked PR: merge master into its branch, retarget it to master,
  then mark it ready. A retarget of an already-ready PR without a new push skips Jest and the Lighthouse audit.
- The session-handoff check fails a PR that does not change `SESSION_HANDOVER.md`.
- Italics for work titles are not used: only Inter 400 and 500 upright are loaded, so italics would be synthesised.
- The email address stays behind "Show email" (above the form, not plain text).
- Type tokens are defined in three places that must stay in step: `src/styles/base/typography.css`,
  `src/styles/critical/deferred.css` and `public/styles/critical/deferred.css`
- `src/styles/mobile/navigation.css` duplicates rules from `mobile/project.css` and loads after it
- `src/styles/mobile/gallery.css` still has an unused `.mobile-gallery-year` rule; the year now sits inside the title heading
- The live header is `src/components/Header`; `components/desktop/Header` and `components/mobile/Header` are not rendered
- Layout (desktop or phone) is chosen after hydration, so E2E tests should target `.mobile-*` / `.desktop-*`
  containers by viewport rather than `:visible`
- Running E2E locally: start `npx next dev --webpack -p 3000` first; the Playwright config reuses it

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from the design review (✅ all six items implemented, PRs #412 to #420).

**Immediate priority**: Issue #393 with left-aligning the first home image (2-4 hours)
**Context**: the design-review stack is on master; the home gallery still centres its first image because scroll, focus and restore logic assume it
**Reference docs**: SESSION_HANDOVER.md, tests/e2e/design/, tests/e2e/accessibility/focus-restoration.spec.ts
**Ready state**: master clean, Jest 1245 passing, CI green; 14 E2E tests fail only on the development machine

**Expected scope**: first home image on the left margin with scroll and focus restoration intact, E2E green in CI

## 📚 Key Reference Documents

- Review artifact: https://claude.ai/artifact/RgjdJbMAPjrEDnwtK3mKuY
- `tests/e2e/design/type-and-frame.spec.ts`, `desktop-project-image.spec.ts`, `alignment-and-contact.spec.ts`
