# Session Handoff: SEC-10 and SEC-11 fixed (#475); deploy speed-ups landed (#467, #470, #473)

**Date**: 2026-11-16
**Issue**: #475 (open, closes with this PR); #465, #467, #470, #473 closed
**PR**: this PR (#475); merged #466, #468, #469, #471, #472, #474 (`c78516d`)
**Branch**: fix/issue-475-cache-and-nonce

---

## ✅ Completed This Session

- **SEC-10 (this PR)**: the catch-all Cache-Control was already gone, but production served `/` with
  `public, max-age=31536000, immutable`. Cause: the icon rule `source: '/(favicon|apple-touch-icon|icon)*'` in
  `next.config.ts`; with Next's matcher `(…)*` is zero-or-more, so it matched `/` and `/favicon` and none of the
  icon files. It now names the files (`favicon.ico`, `apple-touch-icon.(png|webp)`, `icon-NxN.(png|webp)`).
  `tests/unit/next-config-cache-headers.test.ts` runs every Cache-Control rule through Next's `getPathMatch`:
  none may match a page, API route, `sw.js` or `manifest.json`; each icon file in `public/` must match once.
  Checked on a local production build: `/` is `private, no-cache, no-store`, icons `public, max-age=31536000, immutable`.
- **SEC-11 (this PR)**: production already had a fresh nonce per request on all 19 nonced scripts, so it worked,
  but `src/proxy.ts` set `x-nonce` only on the response while `layout.tsx` reads `headers()` (the request). The
  proxy now forwards `x-nonce` and `Content-Security-Policy` with `NextResponse.next({ request: { headers } })`
  (CSP building moved to `buildContentSecurityPolicy`). `tests/unit/middleware/csp-nonce-forwarding.test.ts` runs
  the real proxy with real `next/server` classes. The older proxy suites' request mocks are now real `Headers`.
  The home page's 2 project JSON-LD blocks have no nonce: they are data blocks, which CSP does not govern.
- **Not in the repo**: `/favicon.ico`, `/apple-touch-icon.png` and `/manifest.json` also get
  `max-age=31536000` + `public, immutable` from a second source on the VPS (likely Nginx `expires`). For
  `manifest.json` that means changes reach browsers only after a year; check the Nginx site config.
- **#474 deployed** (run 43906909396, `c78516d`): production-validation in the Playwright container passed.
  "Initialize containers" (image pull) 21 s vs 25–69 s for the old install; smoke tests 79 s; total 3 min 13 s,
  because `npm ci` took 74 s: `npm cache is not found` (the cache path is `/root/.npm` in the container, a
  different Actions cache). That run saved the new cache; the next deploy should restore it (~2 min 15 s total).

- **#473 (this PR)**: production-validation runs in `mcr.microsoft.com/playwright:v1.65.1-noble` (pinned by digest,
  `--ipc=host`, `HOME=/root` for Firefox as root); the "Install Playwright" step is gone. Reason: that step took
  25 s, 49 s, 69 s on runs 43883724418, 43888666218, 43892053247; browser downloads stayed ~10 s, apt system
  packages went ~16.5 s → ~38 s → ~57 s (Ubuntu mirror at 4 MB/s vs 13–18 MB/s). The image is ~1 GB compressed
  and ships Node 26, curl and git; setup-node still installs Node 24 for `npm ci`.
  `tests/unit/deploy-playwright-container.test.ts` (5) fails when the image tag differs from `@playwright/test` in
  package-lock.json (a Dependabot Playwright bump needs the tag and digest updated too; the test has the curl
  command for the digest). **Not yet run**: production-validation only runs on master, so the PR's CI cannot
  exercise it.
- **#470** (#471, `4f1649c`): production-validation's fixed `sleep 30` ("Wait for deployment to stabilize") is replaced by
  "Wait for production to answer": `curl --fail --max-time 10` on `https://idaromme.dk/` every 2 s, up to 30
  attempts, then `::error::` and exit 1. The deploy job only ends after PM2 has started the new build, and the
  poll runs after `npm ci` and the Playwright install (~45 s later), so it should answer on attempt 1 and save
  ~30 s per deploy. `tests/unit/deploy-production-readiness.test.ts` (6) runs the step with stub `curl`/`sleep`.
- **First deploy with the poll** (run 43888666218, `4f1649c`): all jobs green. "Wait for production to answer"
  took **1 s** ("answered on attempt 1"; the `sleep 30` step took 31 s). "Deploy on VPS" 4 s. production-validation
  was still **3 min 12 s** (2 min 44 s on run 43883724418) because the runner was slower on everything else:
  Install Playwright 49 s (was 25 s), setup + checkout + Node + `npm ci` 39 s (was 23 s), smoke tests 93 s (was 85 s).
- **#471 CI**: the first Lighthouse Performance Budget (mobile) run failed with `NO_NAVSTART` (Lighthouse could not
  record the trace; it says to run again) and cancelled desktop. A re-run of the whole run (attempt 2) passed both.
- **Playwright browser cache considered and dropped**: of the 25 s "Install Playwright" step (run 43883724418),
  ~16.5 s is apt system deps (`--with-deps`, not cacheable) and ~8 s browser downloads, about what an Actions
  cache restore of the same files costs.
- **#466 merged first** (`8bd0d79`), then **#468 rebased on it** and merged (`1344370`). Only
  `SESSION_HANDOVER.md` conflicted; `production-deploy.yml` keeps #466's `permissions: contents: read`.
  Lighthouse Performance CI does not run on PRs that only touch deploy files (path filter).
- **"Deploy on VPS" timings**: ~40 s before #468 (run 43861604493); **36 s** on the first deploy of
  `scripts/deploy/vps-release.sh` (run 43878817878, `npm ci` ran: no stamp yet); **3 s** on the second
  (run 43883724418, `ed70168`, `npm ci` skipped). All jobs green on all three.
- **VPS checked** (Doctor Hubert, after the first deploy): `pm2 describe idaromme-website` (as `deploy`) runs
  `node_modules/next/dist/bin/next start` with `--max-old-space-size=1024`, max memory restart 800M, fork mode,
  Node 24.22.2, ~55 MiB heap at idle. `free -m`: 1968 MB total, 1414 available; swap 374 of 5399 MB used.
  `pm2-deploy` is enabled in systemd. `/etc/hosts` now has the `vps-sto-1` hostname.

## 🎯 Current Project State

**Tests**: ✅ middleware, next-config and analytics-provider suites 108/108 locally; local production build OK
**Branch**: ✅ clean and pushed
**CI/CD**: ✅ production on `c78516d`; #475 not deployed yet

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. **After #475 deploys**: `curl -sI https://idaromme.dk/ | grep -i cache-control` should be `private, no-cache,
   no-store…`, and the page's script nonces should match the CSP header. On that same run, production-validation's
   `npm ci` should restore the `/root/.npm` cache (~20 s, not 74 s).
2. Optional deploy speed-ups: the build job (~2 min) gates go-live; carry `.next/cache/images` from the old build
   into the new one (the swap drops it, so every image is re-optimised after each deploy); PM2 cluster mode +
   `pm2 reload` for zero downtime (check `nproc`); smoke tests take ~85–93 s (Desktop Chrome + Desktop Firefox).
3. Remaining audit items: SEC-05/06, SEC-13–15; then a full re-audit (a prompt for that was drafted in chat)
4. The actions inside `maxrantil/.github`'s reusable workflows still use tags (change in that repo)
5. Carried over: Umami Realtime check, LCP levers

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then confirm #475 (SEC-10/SEC-11) in production and pick the next audit item.

**Immediate priority**: check `/` is no longer cached immutable and nonces match on the live site; check the container `npm ci` hit its cache (15 min)
**Context**: SEC-01–04, 07–12 are fixed; SEC-05, 06, 13, 14, 15 remain (docs/guides/SECURITY-AUDIT-2026-11-15.md)
**Reference docs**: SESSION_HANDOVER.md, docs/guides/SECURITY-AUDIT-2026-11-15.md
**Ready state**: master clean, production green on the latest merge

**Expected scope**: SEC-05 + SEC-06 (contact rate limiting behind Nginx, bounded CSP reports) as one issue + PR with tests

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
