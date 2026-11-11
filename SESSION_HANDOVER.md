# Session Handoff: Issue #411 - Mobile project page shows the image first

**Date**: 2026-11-11
**Issue**: #411 - feat: show a photograph before the text on the mobile project page
**PR**: draft, see branch below
**Branch**: feat/issue-411-mobile-project-image-first

---

## ✅ Completed This Session

- **Front-end design review** of idaromme.dk against the two mood-board sites,
  https://margretheodgaard.com/ and https://malenebach.dk/. Doctor Hubert approved all six
  items. The review (with side-by-side screenshots) is a private artifact:
  https://claude.ai/artifact/RgjdJbMAPjrEDnwtK3mKuY. It is not committed, because this repo is
  public and the review contains screenshots of other artists' sites.
- **Issue #411 (review item 2)**:
  - Mobile project page order is now title and year, lead image, text sections, remaining images.
    `MobileImageStack` takes a `range` prop (`lead` / `rest`); `ProjectDetails` renders `children`
    between its header and first section.
  - Image containers use the real proportions parsed from the Sanity asset reference
    (`getImageAspectRatio` in `src/utils/image-helpers.ts`), falling back to 4:3.
  - The dark "Loading image N..." slab is gone; the container has a pale tint and `aria-busy`.
  - On `/project/composing-tones` at 390px the first image moved from about 1,390px down the page to 244px.

## 🎯 Current Project State

**Tests**: ✅ 1240 passing (23 skipped); `tsc --noEmit` clean
**Lint**: ✅ `npx eslint .` reports 0 errors
**Branch**: ✅ clean, pushed
**CI/CD**: 🔄 running on the draft PR
**Not run**: Playwright E2E suite locally. The change was checked by hand at 390x844 against a local dev server.

### Agent Validation Status

The named validation agents were not run this session.

## 🚀 Next Session Priorities

Approved order for the remaining review items, one issue and branch each:

1. **Items 3 and 4 together**: reduce type to two sizes and one voice; header from 100px to about 64px,
   side margins from 68px to about 24px, first home image aligned to the left margin
2. **Item 1**: enlarge the desktop project carousel (keep the carousel) and fix the clipped thumbnail strip
3. **Item 5**: add the year to home captions
4. **Item 6**: one left edge across Project, About and Contact; keep the contact form, with the
   email address and Instagram as plain text above it

### Carry-forward notes

- Both `MobileGallery` and `DesktopGallery` are always in the SSR HTML, so selectors must be viewport-scoped
- react-hooks v7 rules are enforced: prefer `useSyncExternalStore` or derived state over setState in effects
- Browser tooling: Playwright's Chromium is in `~/.cache/ms-playwright`; system deps were being installed
  with `sudo npx playwright install-deps` at the end of this session. The playwright MCP plugin also needs
  Google Chrome (`npx playwright install chrome`).

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from Issue #411 (mobile project page shows the image first, draft PR open).

**Immediate priority**: merge the #411 PR once CI is green, then open an issue for review items 3 and 4 (type and frame, 3-5 hours)
**Context**: all six design-review items are approved; the mood board is margretheodgaard.com and malenebach.dk
**Reference docs**: SESSION_HANDOVER.md, the review artifact linked above, issue #411
**Ready state**: feature branch clean and pushed; 1240 tests passing; ESLint at 0 errors

**Expected scope**: TDD, CSS-led changes across all pages, verify at 1440x900 and 390x844 with Playwright, run the E2E suite

## 📚 Key Reference Documents

- Review artifact: https://claude.ai/artifact/RgjdJbMAPjrEDnwtK3mKuY
- `src/styles/mobile/project.css`, `src/styles/desktop/project.css`, `src/styles/base/typography.css`
