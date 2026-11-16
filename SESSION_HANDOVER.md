# Session Handoff: production deployed again (#457), SEC-12 live (#455), SEC-07 waiting on secrets (#459)

**Date**: 2026-11-16
**Issue**: #452, #454, #456 closed; #458 (SEC-07) open, closes with #459
**PR**: merged #453 (`09337fd`), #457 (`887e26e`), #455 (`1749bb1`); #459 draft (deploy fails without host key secrets)
**Branch**: fix/issue-458-ssh-host-verification (worktree `../textile-sec02`)

---

## ✅ Completed This Session

- **#453 merged**: image optimizer limits and SVG off (#452).
- **Production was stuck on #437** (`8043011`, 2026-11-15 08:41): every Production Deploy since #403 failed in its
  `test` job, because the workflow's CLI `--testPathIgnorePatterns` replaces jest.config's list and so ran the
  vendored `.claude/` node:test files. **#457** repeats the config's entries in the workflow. Its deploy
  (run 43841367319) shipped all 13 pending commits, including #440 (Next 16.4.6 / Sharp 0.35.5, SEC-01) and #449
  (Sanity 6). The VPS runs Node v24.22.2 (Sanity 6 needs >= 22.12).
- **SEC-12** (#454 → #455, deploy run 43842525810): live `script-src` is
  `'self' 'nonce-…' 'strict-dynamic' https://analytics.idaromme.dk`, without `https: http:`.
- **SEC-04** needed no change: master's IndexNow POST already has a bearer secret, a 100-URL cap, dedupe and a timeout (#440).
- **`npm audit` on master**: `--omit=dev` 19 (4 low, 15 moderate, 0 high, 0 critical); all 42. What is left is
  minimatch via the Sanity CLI tooling and deepmerge via `resend`; npm's only "fix" is a major downgrade for both.
- **SEC-07** (#458 → draft #459): the host verification step now fails unless `VULTR_KNOWN_HOSTS` and
  `VULTR_HOST_FINGERPRINT` are both set. `tests/unit/deploy-ssh-host-verification.test.ts` runs the step's script
  with bash (3 of 6 failed on the old workflow).

- **SEC-09** (#460): `scripts/audit-gate.js` fails on high/critical advisories in production dependencies unless
  `.github/audit-exceptions.json` lists them with a reason and an unexpired `expires` date (expired or incomplete
  entries fail too). It gates Production Deploy (`security-scan`, a `needs` of `deploy`), Unit Tests on PRs, and the
  weekly monitor, which now opens or comments on an open "Weekly npm audit gate failing" issue (#45 is closed).

## 🎯 Current Project State

**Tests**: ✅ Jest 1390 passed / 16 skipped on #459; production deploys green
**Branch**: ✅ worktrees clean and pushed; `../textile-sec12` (#455, merged) can be removed
**CI/CD**: ✅ production on `1749bb1`; ⏸️ #459 must not merge before both secrets are set on the `production` environment

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. SEC-07: Doctor Hubert checks the host key on the Vultr console (`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`;
   the 2026-11-16 scan saw ED25519 `SHA256:QjynehVtlq1cUETAKfWsMmAeRvRfuXvZ633OevMgKHE`), sets both secrets, then
   #459 is marked ready, merged, and its deploy watched. A fingerprint the Go SSH client does not pick (it may
   negotiate ECDSA) fails the "Deploy on VPS" step after rsync; the live site is untouched in that case
2. SEC-08 (pin actions to SHAs), SEC-09 (blocking `npm audit` gate)
3. SEC-05/06, SEC-10/11 (verify live headers and nonce), SEC-13–15; `set -e` for the VPS deploy script (separate change)
4. Look at `.next/cache/images` on the VPS after #453; carried over: Umami Realtime check, LCP levers

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
- Pushing and marking a PR ready close together races: the push run passes the draft gate, then the "ready" run
  cancels it and itself skips as draft. Re-run the cancelled push run (`gh run rerun <id>`).
- Production Deploy runs on every push to master. Check it after a merge: a failed `test` job skips `deploy` silently
  (that is how #403–#453 went undeployed). Its test step passes its own `--testPathIgnorePatterns`, which replaces
  jest.config's list; a new ignore entry in jest.config must also go into `production-deploy.yml`.
- Local Jest runs with many suites can time out the contact-form suites (17–34 s each); they pass alone and in CI.
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

Read CLAUDE.md to understand our workflow, then finish SEC-07 (#458, draft PR #459: deploy fails without the VPS host key).

**Immediate priority**: once both host key secrets are set on the `production` environment, mark #459 ready, merge, watch the deploy; then SEC-08/SEC-09 (2-3 hours)
**Context**: production runs current master again (#457 fixed the deploy test step); SEC-12 is live, SEC-04 was already fixed
**Reference docs**: SESSION_HANDOVER.md, docs/guides/SECURITY-AUDIT-2026-11-15.md, `.github/workflows/production-deploy.yml`
**Ready state**: master in ../textile-showcase; #459 in ../textile-sec02; ../textile-sec12 can be removed

**Expected scope**: #459 merged with a verified host key, actions pinned to SHAs, `npm audit` gate blocking in CI

## 📚 Key Reference Documents

- Issue #395, issue #429, PRs #434 and #436 (merged), PRs #437 and #438 (draft), issue #397 (layout swap on project pages)
- `src/components/server/GalleryImagePreloads.tsx`, `src/utils/gallery-images.ts`, `src/app/page.tsx`, `src/app/projects/page.tsx`
- `public/fonts/inter-400.woff2`, `src/styles/critical/critical.css` (the two `@font-face` rules)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/styles/desktop/project.css`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
- #435 (Umami back on, merged in #436): `tests/e2e/analytics-resilience.spec.ts`, issue #263. Left open there:
  `data-domains` on the script tag would stop local builds recording visits, and
  `tests/e2e/analytics-integration.spec.ts` asserts nothing against the dev server
