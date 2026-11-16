# Session Handoff: security audit SEC-01/SEC-02, image optimizer limits (#452)

**Date**: 2026-11-15
**Issue**: #452 (open, closes when #453 merges)
**PR**: #453 (draft): `dangerouslyAllowSVG: false`, 256 MB image disk cache cap, 10 MB source cap
**Branch**: fix/issue-452-image-optimizer-limits (worktree `../textile-sec02`)

---

## ✅ Completed This Session

- A read-only security audit (`docs/guides/SECURITY-AUDIT-2026-11-15.md`, 15 findings) ran on the stale
  `perf/issue-429-font-weight-axis` checkout. Checked against master: the Next.js 16.4.6 / Sharp 0.35.5 upgrade
  (#440) and JSON-LD escaping (SEC-03, #450) were already merged, and the audit doc now says so at the top.
- #452/#453: `next.config.ts` turns SVG optimization off, caps `maximumDiskCacheSize` at 256 MB and
  `maximumResponseBody` at 10 MB. `tests/unit/next-config-images.test.ts` (TDD: 3 failures before the change).
- Verified locally: full Jest suite (1384 passed, 16 skipped), type-check, lint, prettier, `next build`. With
  `next start`, a Sanity JPEG through `/_next/image` returns 200 and `q=90` returns 400, because Next 16's default
  `qualities` is `[75]` and no component passes `quality`.

## 🎯 Current Project State

**Tests**: ✅ local suite green; CI Jest green on #453; Lighthouse/bundle were still running at handoff
**Branch**: ✅ #453 branch clean and pushed. The old checkout `../textile-showcase` (perf/issue-429) still has the
uncommitted pre-audit handoff edits. They are superseded by this file and the audit doc on #453, so discard them.
**CI/CD**: 🔄 #453 draft; E2E runs once it is marked ready

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. Mark #453 ready, wait for E2E, merge, deploy. Then look at `.next/cache/images` on the VPS and check that project images still load
2. Re-run `npm audit --omit=dev` / `npm audit` on master. The audit's counts (54/73) came from the stale branch
3. SEC-12 (remove `https: http:` from CSP `script-src`) and SEC-04 (IndexNow POST unauthenticated, no limits)
4. SEC-05/06, SEC-08 (pin actions to SHAs), SEC-09 (blocking audit gate), SEC-10/11 (verify live headers and nonce), SEC-13–15
5. Carried over: confirm a visit under Realtime in Umami; next LCP levers (the two shared script chunks)

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

Read CLAUDE.md to understand our workflow, then finish #452 (draft PR #453: image optimizer limits, SVG off).

**Immediate priority**: mark #453 ready, merge after E2E, deploy, then do SEC-12 + SEC-04 from the audit (2-3 hours)
**Context**: the audit ran on a stale branch. Master already has Next 16.4.6/Sharp 0.35.5 (#440) and safe JSON-LD (#450)
**Reference docs**: docs/guides/SECURITY-AUDIT-2026-11-15.md (status note at top), SESSION_HANDOVER.md
**Ready state**: work in worktree ../textile-sec02; discard the stale uncommitted docs in ../textile-showcase

**Expected scope**: #453 merged and deployed, `npm audit` re-run on master, CSP fallback origins removed, IndexNow protected

## 📚 Key Reference Documents

- Issue #395, issue #429, PRs #434 and #436 (merged), PRs #437 and #438 (draft), issue #397 (layout swap on project pages)
- `src/components/server/GalleryImagePreloads.tsx`, `src/utils/gallery-images.ts`, `src/app/page.tsx`, `src/app/projects/page.tsx`
- `public/fonts/inter-400.woff2`, `src/styles/critical/critical.css` (the two `@font-face` rules)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/styles/desktop/project.css`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
- #435 (Umami back on, merged in #436): `tests/e2e/analytics-resilience.spec.ts`, issue #263. Left open there:
  `data-domains` on the script tag would stop local builds recording visits, and
  `tests/e2e/analytics-integration.spec.ts` asserts nothing against the dev server
