# Session Handoff: Design review merged, phone left edge (Issues #411, #413, #415, #418, #417, #421)

**Date**: 2026-11-12
**Issues**: #411, #413, #415, #418 and #417 closed; #421 closes with this PR
**PRs**: #412, #414, #416, #419 and #420 merged; this PR fixes #421
**Branch**: fix/issue-421-phone-left-edge

---

## ✅ Completed This Session

All six items of the front-end design review are implemented and on master. This PR is a follow-up found in the production check.

| PR | Issue | What it does | State |
| --- | --- | --- | --- |
| #412 | #411 | Phone project page: lead image before the text, real image proportions, pale loading placeholder | merged |
| #414 | #413 | Two text sizes (16px, 20px), regular weight; 64px header anchored to the corners; home gallery images 70vh | merged |
| #416 | #415 | Desktop project image uses the window height (700px at 1440x900); thumbnail strip back on screen | merged |
| #419 | #418 | Project, About and Contact share one left edge; contact page leads with email reveal and Instagram | merged |
| #420 | #417 | Home gallery captions show the year after the title ("Composing Tones, 2025"), desktop and phone | merged |
| this PR | #421 | Phone: home gallery, project page and contact form start at the page gutter (16px), like the header, About and Contact | open |

- Each PR was merged on a green CI run: Jest, E2E on Desktop Chrome, Mobile Chrome and Safari Smoke, Lighthouse budget and audit.
  Exception: on #414 Jest and the Lighthouse audit did not run on the PR (see the retarget note below); both ran green on master
  right after its merge.
- Lighthouse passed on #416, which requests the project page's main image 1200px high (was 800px).
- **#417 reverses #100** (year removed from the phone gallery). Doctor Hubert approved it on 2026-11-12. The old test that
  asserted the year stays hidden is replaced; a work without a year shows the title alone.
- All five production deploys succeeded. Production was checked at 1440x900 and on a Pixel 5 viewport after the last one:
  pages load without script errors, header 64px on desktop, project image 700px high, captions read "Title, year".
- **#421**: that check showed four left edges on the phone (header, About and Contact text 16px; home images 20px with
  captions at 23px; contact form 32px; project page 40px). All now use the gutter of `.nordic-container`,
  `clamp(16px, 4vw, 40px)`. Guarded by `tests/e2e/design/phone-left-edge.spec.ts`.

## 🎯 Current Project State

**Tests**: ✅ Jest 1245 passing (23 skipped); `tsc --noEmit` clean
**Branch**: ✅ clean, pushed
**CI/CD**: 🔄 running on this PR

**Local E2E note**: on the development machine 14 of 330 E2E tests fail (all of `tests/e2e/accessibility/focus-restoration.spec.ts`
on Desktop Chrome and Mobile Chrome, and six submit tests of `tests/e2e/workflows/contact-form.spec.ts` on Mobile Chrome). The
same 14 fail there on plain master and pass in CI, so they do not come from this work. The cause is not investigated.

### Agent Validation Status

The named validation agents were not run this session.

## 🚀 Next Session Priorities

1. If not already done: merge this PR and look at the phone pages in production
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
- The phone header is 72px high, the desktop one 64px; not checked whether #413 meant 64px for both
- A caption whose title ends in a question mark reads "...SALT?, 2022"
- On the phone project page the "Next" button ends 32px from the right edge, not at the gutter
- `src/styles/mobile/gallery.css` still has an unused `.mobile-gallery-year` rule; the year now sits inside the title heading
- The live header is `src/components/Header`; `components/desktop/Header` and `components/mobile/Header` are not rendered
- Layout (desktop or phone) is chosen after hydration, so E2E tests should target `.mobile-*` / `.desktop-*`
  containers by viewport rather than `:visible`
- Running E2E locally: start `npx next dev --webpack -p 3000` first; the Playwright config reuses it

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from the design review (✅ all six items implemented, PRs #412 to #420, plus the phone left edge #421).

**Immediate priority**: Issue #393 with left-aligning the first home image (2-4 hours)
**Context**: the design-review stack is on master; the home gallery still centres its first image because scroll, focus and restore logic assume it
**Reference docs**: SESSION_HANDOVER.md, tests/e2e/design/, tests/e2e/accessibility/focus-restoration.spec.ts
**Ready state**: master clean, Jest 1245 passing, CI green; 14 E2E tests fail only on the development machine

**Expected scope**: first home image on the left margin with scroll and focus restoration intact, E2E green in CI

## 📚 Key Reference Documents

- Review artifact: https://claude.ai/artifact/RgjdJbMAPjrEDnwtK3mKuY
- `tests/e2e/design/type-and-frame.spec.ts`, `desktop-project-image.spec.ts`, `alignment-and-contact.spec.ts`
