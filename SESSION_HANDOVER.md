# Session Handoff: Design review stack, merging to master (Issues #411, #413, #415)

**Date**: 2026-11-12
**Issues**: #411 and #413 closed; #415 closes with this PR; #418 and #417 follow
**PRs**: #412 and #414 merged; #416 (this PR) ready; #419 and #420 still stacked above it
**Branch**: feat/issue-415-desktop-project-image-size

---

## ✅ Completed This Session

- **#412 merged** (phone project page: lead image before the text). Full CI green, including E2E on Desktop Chrome, Mobile Chrome and Safari Smoke.
- **#414 merged** (two text sizes, 64px header, 70vh home images). E2E and Lighthouse budget green on the PR; Jest and the Lighthouse audit ran green on master after the merge.
- **#416** (desktop project image uses the window height, 700px at 1440x900) retargeted to master, master merged in, marked ready.
- **#417 decided**: Doctor Hubert approved putting the year back in the home captions (reverses #100). Implemented test-first in draft PR #420.
- Both production deploys (after #412 and #414) succeeded.

## 🎯 Current Project State

**Tests**: ✅ Jest passing in CI on this branch; 1245 passing locally at the top of the stack (#420)
**Branch**: ✅ clean, pushed
**CI/CD**: 🔄 running on #416

**Local E2E note**: on the development machine 14 E2E tests fail (all of `tests/e2e/accessibility/focus-restoration.spec.ts` on
Desktop Chrome and Mobile Chrome, and six submit tests of `tests/e2e/workflows/contact-form.spec.ts` on Mobile Chrome). The same
14 fail there on plain master and pass in CI, so they do not come from this stack. The cause is not investigated.

### Agent Validation Status

The named validation agents were not run this session.

## 🚀 Next Session Priorities

1. Merge #419 (one left edge, plainer contact page), then #420 (year in captions), each after a full green CI run
2. Check production at 1440x900 and on a phone
3. #393 together with left-aligning the first home image
4. Find out why the 14 E2E tests above fail on the development machine

### Carry-forward notes

- CI workflows only run on PRs that target master. After retargeting a stacked PR, merge master into its branch and push;
  a retarget alone triggers only some workflows (no Jest, no Lighthouse audit).
- The session-handoff check fails a PR that does not change `SESSION_HANDOVER.md`.
- Type tokens are defined in three places that must stay in step: `src/styles/base/typography.css`,
  `src/styles/critical/deferred.css` and `public/styles/critical/deferred.css`
- `src/styles/mobile/navigation.css` duplicates rules from `mobile/project.css` and loads after it
- The live header is `src/components/Header`; `components/desktop/Header` and `components/mobile/Header` are not rendered
- Layout (desktop or phone) is chosen after hydration, so E2E tests should target `.mobile-*` / `.desktop-*`
  containers by viewport rather than `:visible`
- Running E2E locally: start `npx next dev --webpack -p 3000` first; the Playwright config reuses it

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from the design-review stack (#412, #414 merged; #416 in CI).

**Immediate priority**: merge #416, then #419 and #420 bottom-up, each on a full green CI run (1 hour)
**Context**: all six design-review items are implemented; the year in captions (#417) is approved and sits in PR #420
**Reference docs**: SESSION_HANDOVER.md, tests/e2e/design/
**Ready state**: branches clean and pushed; Jest green; 14 E2E tests fail only on the development machine

**Expected scope**: the three remaining PRs merged, production checked at 1440x900 and on a phone

## 📚 Key Reference Documents

- Review artifact: https://claude.ai/artifact/RgjdJbMAPjrEDnwtK3mKuY
- `tests/e2e/design/type-and-frame.spec.ts`, `desktop-project-image.spec.ts`, `alignment-and-contact.spec.ts`
