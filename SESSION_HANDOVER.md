# Session Handoff: security audit follow-up, SEC-07/08/09/12 live, deploys fixed

**Date**: 2026-11-16
**Issue**: closed #452, #454, #456, #458, #460, #462; #465 (workflow permissions) closes with this PR
**PR**: merged #453, #457, #455, #459, #461, #463; this PR: workflow-level read-only permissions (#465)
**Branch**: fix/issue-465-workflow-permissions (worktree `../textile-sec08`)

---

## ✅ Completed This Session

- **Production deploys were broken since #403** (stuck on #437, `8043011`): the deploy's CLI
  `--testPathIgnorePatterns` replaced jest.config's list, so Jest ran the vendored `.claude/` node:test files.
  **#457** fixed it and shipped 13 pending commits, incl. #440 (Next 16.4.6 / Sharp 0.35.5, SEC-01) and #449 (Sanity 6).
- **#453** (SEC-01/02 config): SVG optimization off, image disk cache 256 MB, source 10 MB.
- **SEC-12** (#455): live `script-src` has no `https: http:` fallback.
- **SEC-04**: already fixed on master by #440 (bearer secret, fails closed, URL cap, timeout); no change.
- **SEC-07** (#459): the deploy fails unless `VULTR_KNOWN_HOSTS` and `VULTR_HOST_FINGERPRINT` are set on the
  `production` environment. Both are set (2026-11-16), checked against the Vultr console: known_hosts has the
  ED25519 and ECDSA keys for `70.34.205.18,idaromme.dk`; the fingerprint is **ECDSA**
  (`SHA256:wzd1YXe3sDEoWyL7/qhNGjyN4vI1/A/IhtAFXGFNVdw`) because appleboy/ssh-action's Go client prefers
  ecdsa-sha2-nistp256 over ssh-ed25519. If the VPS host keys are ever regenerated, update both secrets.
- **SEC-09** (#461): `scripts/audit-gate.js` fails on high/critical production advisories unless
  `.github/audit-exceptions.json` lists them with `advisory`, `reason` and `expires` (YYYY-MM-DD). It gates
  Production Deploy (`security-scan`), Unit Tests on PRs, and the weekly monitor (opens/comments on an open
  "Weekly npm audit gate failing" issue). First deploy run: 19 total, 0 high, 0 critical.
- **SEC-08** (#463): all 54 `uses:` pinned to commit SHAs (version in a comment); shared `maxrantil/.github`
  workflows pinned to `0075ab5`; `@lhci/cli@0.12.0`; `.github/dependabot.yml` bumps github-actions weekly (grouped).
- **#465** (this PR): every workflow has a workflow-level `permissions: contents: read`; `bundle-size-check` is
  explicitly read-only. Its PR comment has never posted (no write permission) and stays off by Doctor Hubert's
  decision. Every existing job-level `write` grant was checked against the shared workflows and is used.
- `tests/unit/ci-pinned-actions.test.ts` fails on an unpinned `uses:`, a ranged `npm install -g`, a missing
  Dependabot config, or a workflow without workflow-level `permissions:`.
- `npm audit` on master: `--omit=dev` 19 (4 low, 15 moderate); all deps 42. Remaining: minimatch via the Sanity CLI
  tooling and deepmerge via `resend`; npm's only "fix" is a major downgrade for both.

## 🎯 Current Project State

**Tests**: ✅ Jest 1403 passed / 16 skipped on this branch
**Branch**: ✅ clean and pushed; `../textile-sec02` (merged #459 branch) and `../textile-sec08` can be removed after merge
**CI/CD**: ✅ production on `3c58f2e` (#463), every deploy job green, host key verified, audit gate passing

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. **Faster deploys on the 2 GB VPS** (Doctor Hubert asked; not started). Measured on run 43861604493: site live
   after ~2.5 min (tests/audit/build in parallel ~76 s, rsync ~19 s, "Deploy on VPS" ~40 s); smoke tests add ~3.5 min
   after that. Ideas, best first:
   - Skip `rm -rf node_modules && npm ci --omit=dev` on the VPS when `package-lock.json` is unchanged (store its hash).
     PM2 is stopped *before* `npm ci`, so this also cuts the downtime window from ~30 s to a few seconds.
   - `ecosystem.config.js` still has 1 GB values (`--max-old-space-size=512`, `max_memory_restart: '400M'`); ~1024 /
     ~800M fit 2 GB. Check `pm2 describe idaromme-website` first: the deploy restarts an existing process, so it is
     unknown whether ecosystem.config.js is in effect.
   - Optional: PM2 cluster mode, 2 instances + `pm2 reload` for zero downtime (depends on the vCPU count).
   - Cache Playwright browsers in production-validation (~31 s, after go-live).
2. Remaining audit items: SEC-05/06, SEC-10/11 (verify live headers and nonce), SEC-13–15; `set -e` for the VPS script
3. The actions inside `maxrantil/.github`'s reusable workflows still use tags (change in that repo)
4. Carried over: `.next/cache/images` on the VPS after #453, Umami Realtime check, LCP levers

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

Read CLAUDE.md to understand our workflow, then speed up production deploys for the 2 GB VPS (security follow-up #452–#465 complete).

**Immediate priority**: skip the VPS `npm ci` when `package-lock.json` is unchanged, and update `ecosystem.config.js` memory limits for 2 GB after checking `pm2 describe` (2-3 hours)
**Context**: deploys work again (#457), host key pinned (SEC-07), audit gate blocking (SEC-09), actions SHA-pinned (SEC-08)
**Reference docs**: SESSION_HANDOVER.md (timings in Next Session Priorities), `.github/workflows/production-deploy.yml`, `ecosystem.config.js`
**Ready state**: master in ../textile-showcase, production on the latest master, all deploys green

**Expected scope**: "Deploy on VPS" under ~15 s for lockfile-unchanged deploys with a shorter downtime window, memory limits fitted to 2 GB

## 📚 Key Reference Documents

- Issue #395, issue #429, PRs #434 and #436 (merged), PRs #437 and #438 (draft), issue #397 (layout swap on project pages)
- `src/components/server/GalleryImagePreloads.tsx`, `src/utils/gallery-images.ts`, `src/app/page.tsx`, `src/app/projects/page.tsx`
- `public/fonts/inter-400.woff2`, `src/styles/critical/critical.css` (the two `@font-face` rules)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/styles/desktop/project.css`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
- #435 (Umami back on, merged in #436): `tests/e2e/analytics-resilience.spec.ts`, issue #263. Left open there:
  `data-domains` on the script tag would stop local builds recording visits, and
  `tests/e2e/analytics-integration.spec.ts` asserts nothing against the dev server
