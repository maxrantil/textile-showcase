# Session Handoff: PR sweep, merging the open PR backlog

**Date**: 2026-11-15
**Issue**: #395, #429 (perf, open); #389, #397, #399, #404 (open, fixes in the Nov 6 stack)
**PR**: #437, #438, #432, #403, #439 (14 Dependabot bumps), #440 (re-land of #386) merged; re-landing #387 next
**Branch**: claude/hopeful-galileo-o7vj4m

---

## ✅ Completed This Session

- **Merged (squash)**: #437 font weight axis 400-500 (`8043011`), #438 `/projects` gallery preloads (`edba094`),
  #432 docs `middleware.ts` → `src/proxy.ts` (`e82631d`), #403 Cloudflare security-audit skill (`06947d5`).
  #432's body footer tripped the "AI attribution in PR body" check and was removed before merging.
- **#439 merged** (`9a71f4e`): the 14 Dependabot PRs (#369-#385) applied as one lockfile commit; all CI green
  including E2E. The 14 Dependabot PRs are closed with a pointer to #439.
- **#386 re-landed** as its own PR: dependencies redone with npm on current master (next 16.4.6, react 19.3.1,
  zod 4.6.7, sharp 0.35.5, `npm update` + `npm audit fix`); eslint-config-next stays 16.1.6 until the #387
  re-land. Conflicts resolved: the contact route keeps values raw and escapes at render, so `replyTo: email`
  covers what #409 added; the deploy workflow keeps Node 24 (#408) and gains #386's SSH host verification and
  least-privilege token; `/projects` keeps #438's preloads.
- **Nov 6 stack mapped**: #386 → #387 → #391 → #396 → #398 → #400 → #401 → #402 → #405 are stacked (each
  branch contains the previous one), plus #392 alone. All conflict with master's 18 later commits; #386's
  commits conflict in `eslint.config.mjs`, `src/app/api/contact/route.ts`, `production-deploy.yml`,
  `src/app/projects/page.tsx`. Doctor Hubert chose to re-land them one at a time through the claude/ branch,
  dropping what master already covers (#410 ESLint, #431/#433/#434 perf), and close the originals with a pointer.

- **#440 merged** (`1569adb`), the #386 re-land. Its E2E first failed on axe-core 4.14's
  `label-content-name-mismatch` (WCAG 2.5.3); the header logo and gallery links now start their
  `aria-label` with the visible text ("Ida Romme, home", "X, 2025, view project"). #386 closed.
- **#396 closed** as superseded (#425, #431, #434, #437); **issue #395 closed**.
- **#387 re-land**: only DesktopImageCarousel and OptimizedImage still tripped the React Compiler rule;
  eslint-config-next 16.4.6, unused `src/components/hydration` removed, `npm run lint` added to Unit Tests CI.

- **#444 merged** (`c73e574`), the #387 re-land; #387 closed. **#391 re-land** up next: Studio /studio fix (Sanity packages no longer mapped to null, unused Studio client removed, Sanity API origins allowed in CSP on /studio only), per-route JS budget check in CI, `check-bundle-size:strict` script. #391's vendor-chunking commit is already on master (#433).

- **#446 merged** (`3cc4a0d`), the #391 re-land; #391 and issue #389 closed. **#398 re-land** next: phones get the mobile project view in the server HTML (user-agent hint), no desktop-layout flash (#397).

- **#447 merged** (`68986b5`), the #398 re-land; #398 and issue #397 closed. **#400 re-land** next: a desktop project without gallery images shows its main image (#399).

- **#448 merged** (`1f210d7`), the #400 re-land; #400 and issue #399 closed. **#401 re-land** next: Sanity Studio 4 -> 6, next-sanity 11 -> 13, CLI 3 -> 8, @sanity/image-url 2; engines node >=22.12; supersedes Dependabot #445.

## 🎯 Current Project State

**Tests**: ✅ Jest passes locally on #439's branch
**Branch**: ✅ clean and pushed
**CI/CD**: 🔄 #439 running; all checks green except E2E still running when this was written

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. Finish re-landing the Nov 6 stack in order: #386, #387, #391, #396, #398, #400, #401, #402, #405, then #392
2. Close #389, #397, #399, #404 as their fixes land; close #395 (its three tasks are done with #438)
3. Look at a project page on idaromme.dk on a real desktop and phone after the next deploy
4. Confirm a visit under Realtime in Umami (carried over)
5. Next LCP levers: the two shared script chunks (62KB and 51KB)

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

Read CLAUDE.md to understand our workflow, then continue the PR backlog sweep (#437, #438, #432, #403 merged; #439 Dependabot combo).

**Immediate priority**: re-land the Nov 6 stack one PR at a time on a fresh claude/ branch from master (several hours)
**Context**: the stack conflicts with 18 later master commits; drop what #410/#431/#433/#434 already did
**Reference docs**: SESSION_HANDOVER.md, PRs #386-#405 and #392
**Ready state**: master includes everything merged above; check whether #439 merged

**Expected scope**: land #386 (security hardening) and #387 (lint fixes), close the originals with a pointer

## 📚 Key Reference Documents

- Issue #395, issue #429, PRs #434 and #436 (merged), PRs #437 and #438 (draft), issue #397 (layout swap on project pages)
- `src/components/server/GalleryImagePreloads.tsx`, `src/utils/gallery-images.ts`, `src/app/page.tsx`, `src/app/projects/page.tsx`
- `public/fonts/inter-400.woff2`, `src/styles/critical/critical.css` (the two `@font-face` rules)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/styles/desktop/project.css`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
- #435 (Umami back on, merged in #436): `tests/e2e/analytics-resilience.spec.ts`, issue #263. Left open there:
  `data-domains` on the script tag would stop local builds recording visits, and
  `tests/e2e/analytics-integration.spec.ts` asserts nothing against the dev server
