# Session Handoff: #453 merged, production deploy unblocked (#456), SEC-12 (#454)

**Date**: 2026-11-16
**Issue**: #452 closed (#453 merged); #456 (deploy test step) closes with #457; #454 (SEC-12) closes with #455
**PR**: #453 merged (`09337fd`); #457 deploy fix; #455 CSP `script-src` without `https: http:`
**Branch**: fix/issue-456-deploy-test-ignore (worktree `../textile-sec02`), fix/issue-454-csp-script-fallback (`../textile-sec12`)

---

## ✅ Completed This Session

- **#453 merged** (`09337fd`): master merged into the branch first (only `SESSION_HANDOVER.md` conflicted; the #452
  text was kept). CI E2E green on all three projects after a re-run (see the push/ready race note below).
- **Production had not deployed since #437** (`8043011`, 2026-11-15 08:41). Every Production Deploy since #403
  failed in its `test` job: the workflow's CLI `--testPathIgnorePatterns` replaces jest.config's list, so the
  vendored `.claude/skills/security-audit/*.test.cjs` (node:test files) ran under Jest. #457 repeats the config's
  entries (`/\.claude/|/node_modules/|/\.next/`) in the workflow pattern. The step's exact command passes locally.
  Merging #457 deploys 13 master commits at once, including #440 (Next 16.4.6 / Sharp 0.35.5, SEC-01) and #449 (Sanity 6).
- **SEC-12** (#454 → #455): `script-src` is `'self' 'nonce-…' 'strict-dynamic' https://analytics.idaromme.dk`.
  `csp-nonce.test.ts` asserts that the fallback is absent (failed first); `csp-analytics.test.ts` now compares whole
  sources (its `toContain('https:')` was matching `https://analytics…`). `X-XSS-Protection: 0` was already set.
- **SEC-04** needed no change: master's IndexNow POST already has a bearer secret (`INDEXNOW_API_SECRET`, fails closed
  with 503), a 100-URL cap, dedupe and a 10 s timeout (#440). The audit read the stale branch.
- **`npm audit` on master** (`09337fd`): `--omit=dev` 19 (4 low, 15 moderate, 0 high, 0 critical); all 42
  (4 low, 38 moderate). The audit's 54/73 came from the stale branch. What is left: minimatch ReDoS via the Sanity
  CLI/oclif tooling (build/CLI, not request path) and deepmerge via `resend` → `html-to-text` (our own templates).
  npm's only "fix" for both is a major downgrade, so neither is actionable yet.
- The stale handoff edit and audit doc in `../textile-showcase` were discarded (the committed versions superseded them).
  That checkout is on master now (another session switched it on 2026-11-16 07:01).

## 🎯 Current Project State

**Tests**: ✅ Jest 1380+ passing on #455 and #457; E2E green on #453 and #455
**Branch**: ✅ worktrees clean and pushed
**CI/CD**: 🔄 #457 waiting for merge → first successful deploy since #437. Then #455.

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. If not already done: merge #457, confirm the deploy succeeds and the site serves Next 16.4.6
   (`/_next/image` with an SVG `url` returns 400), then merge #455 and check the live `script-src` has no `https: http:`
2. SEC-07: set `VULTR_KNOWN_HOSTS` (`ssh-keyscan <host>`) and `VULTR_HOST_FINGERPRINT` on the `production`
   environment. Neither is set, so the deploy's SSH host key is not verified (it warns and continues)
3. Confirm the VPS Node version is >= 22.12 (Sanity 6 `engines`); the deploy log prints it in "Deploy on VPS"
4. SEC-05/06, SEC-08 (pin actions to SHAs), SEC-09 (blocking audit gate), SEC-10/11 (verify live headers and nonce), SEC-13–15
5. Look at `.next/cache/images` on the VPS after the #453 deploy; carried over: Umami Realtime check, LCP levers

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

Read CLAUDE.md to understand our workflow, then continue the security follow-up after the deploy fix (#457) and SEC-12 (#455).

**Immediate priority**: verify production runs current master (Next 16.4.6, SVG optimization off, CSP without `https: http:`), then SEC-07 host key secrets (1-2 hours)
**Context**: production was stuck on #437 because the deploy test step ran `.claude/` node:test files; #457 fixed it
**Reference docs**: SESSION_HANDOVER.md, docs/guides/SECURITY-AUDIT-2026-11-15.md, `.github/workflows/production-deploy.yml`
**Ready state**: master in ../textile-showcase; worktrees ../textile-sec02 and ../textile-sec12 can be removed once #457/#455 are merged

**Expected scope**: production verified, SEC-07 closed, then SEC-08/SEC-09 (pinned actions, blocking audit gate)

## 📚 Key Reference Documents

- Issue #395, issue #429, PRs #434 and #436 (merged), PRs #437 and #438 (draft), issue #397 (layout swap on project pages)
- `src/components/server/GalleryImagePreloads.tsx`, `src/utils/gallery-images.ts`, `src/app/page.tsx`, `src/app/projects/page.tsx`
- `public/fonts/inter-400.woff2`, `src/styles/critical/critical.css` (the two `@font-face` rules)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/styles/desktop/project.css`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
- #435 (Umami back on, merged in #436): `tests/e2e/analytics-resilience.spec.ts`, issue #263. Left open there:
  `data-domains` on the script tag would stop local builds recording visits, and
  `tests/e2e/analytics-integration.spec.ts` asserts nothing against the dev server
