# Session Handoff: audit fixes #488–#495 (PR #497) and V-9 query cache (#498, PR stacked on #497)

**Date**: 2026-11-21
**Issue**: #488–#495 (fixed in #497); #498 (V-9)
**PR**: #497 (one commit per issue); #496 (audit docs and triage); V-9 PR based on #497's branch
**Branch**: fix/v9-sanity-query-cache (based on fix/issue-490-contact-content-type)

---

## ✅ Completed This Session

- **#497: eight issues, one commit each, every fix test-first** (precedent #483; one PR avoids
  `SESSION_HANDOVER.md` conflicts between parallel PRs):
  - **#490** `/api/contact` requires the exact media type `application/json` (as `csp-report` does);
    `text/plain; application/json` → 415.
  - **#491** `images.remotePatterns` pinned to `/images/<NEXT_PUBLIC_SANITY_PROJECT_ID>/<dataset>/**`; no project
    ID → no remote images. `next start` reads the VPS `.env.local`, so the pattern holds at runtime too.
  - **#492** sitemap URL-encodes slugs (Next writes `<loc>` unescaped); new `src/lib/slug.ts` shared by the
    projects API and a Studio validation rule on `textileDesign.slug` (relative import: the Sanity CLI has no `@/`).
  - **#495** proxy matcher lists skipped assets by path (`_next/static/`, `_next/image`, `favicon.ico`, `images/`,
    `fonts/`, app icons) instead of by extension. `tests/unit/middleware/matcher.test.ts` runs it through Next's
    `getMiddlewareMatchers`.
  - **#489** `checkRateLimit(..., { pinned: true })` keeps a counter in `pinnedRateLimitStore`, never evicted;
    the contact global cap uses it.
  - **#494** `vps-release.sh` moves `node_modules` to `node_modules.previous` before `npm ci`, restores it when
    npm ci or the PM2 start fails, deletes it after a good start (needs disk for two trees briefly). The pm2
    stub now refuses `start idaromme-website` without `node_modules/next/dist/bin/next`.
  - **#493** the deploy resets the VPS to `github.sha`, checks `HEAD`, and stops before writing `.env.local` if
    fetch, commit lookup or reset fails.
  - **#488** each client may send `CONTACT_PER_CLIENT_HOURLY_LIMIT` = 3 messages an hour (counted only for
    messages that would be sent, before the global cap); `clientRateLimitKey` in `src/lib/clientIp.ts` groups
    IPv6 by /64 and maps `::ffff:a.b.c.d` to the IPv4. Doctor Hubert first chose proof-of-work, then the
    per-client cap after I showed PoW costs an attacker under a second for 30 messages. The old per-minute tests
    now use unsent (400) requests. Multi-IP attackers can still drain the global 30/h; Turnstile is the next step
    if that ever happens.
- **#498 (V-9)** `src/sanity/dataFetcher.ts`: a successful `null` answer is cached for `NEGATIVE_CACHE_TTL_MS`
  (60 s; failures still uncached); `QueryCache` holds at most `QUERY_CACHE_MAX_ENTRIES` (1,000; expired first,
  then oldest insertion); identical concurrent fetches share one in-flight request. First test suite for the
  file: `src/sanity/__tests__/dataFetcher.test.ts` (11). Local build: missing slug 250 ms first, 6–8 ms after;
  50 concurrent requests for one missing slug 0.25 s; real project 200.
- **Verified**: Jest 1543 passed / 16 skipped (110 suites); lint 0 errors; local build on :3111: `/studio/x.png`
  now has a CSP, `text/plain; application/json` → 415, own Sanity image 200, foreign project 400, sitemap renders;
  Playwright Desktop Chrome: production-smoke, project-browsing, optimized-image-a11y, contact-form and
  alignment-and-contact, 42 passed / 5 skipped.
- **Seen in passing**: production sends HSTS twice (`...; preload, max-age=31536000`), presumably nginx and the
  proxy both set it. Harmless; drop one.

- **Triaged three model audits** of `62272db` (DeepSeek V4.1 Flash, GLM-5.3, Kimi K3.1 Pro; ~60 findings) in
  `docs/guides/SECURITY-AUDIT-TRIAGE-2026-11-21.md`. Every claim re-checked against source and installed Next 16.4.6.
  **No High/Critical survives**: 1 Medium, 9 Low, rest discarded with reasons.
- **Claims disproved**: GLM's quality-axis multiplication (Next 16 default `qualities: [75]`); GLM's 300 MB bodies
  (Next caps proxied bodies at 10 MB, `proxyClientMaxBodySize`); DeepSeek's "Next escapes sitemap XML" (it doesn't,
  `resolve-route-data.js:112`); DeepSeek's "PM2 gives up after 10 OOMs" (`min_uptime: 10s`); Kimi's deploy "gate
  bypass" High (master writers already deploy; kept as a Low reliability bug).
- **Old launch-prep doc credentials** (`docs/implementation/PUBLIC-LAUNCH-PREPARATION-2025-11-02.md`, gitignored,
  never committed): its Resend key differs from the current `.env.local` (hash compare), so likely rotated.
  Sanity/Cloudinary revocation not verified.
- **Issues opened**: #488 V-1 Medium (one IP exhausts the 30/h global contact cap in ~6 min, form locked for
  everyone), #489 V-2 rate-limit eviction resets the global counter, #490 V-3 `text/plain; application/json`
  passes the content-type check, #491 V-4 image optimizer accepts any Sanity project, #492 V-5 sitemap slug
  not encoded, #493 V-6 deploy resets to `origin/master` not `github.sha`, #494 V-7 failed `npm ci` leaves no
  `node_modules`, #495 V-8 proxy matcher skips CSP on `/studio/x.png`. V-9 (no negative cache on missing slugs)
  and V-10 (body read before size check) have no issue yet.
- **#487 deployed**: Production Deployment run 44143304443 for `62272db` succeeded (first runs of
  download-artifact v8 and ssh-action v1.2.5). #486 (weekly audit gate failing, 2026-11-17) predates the
  exception and can likely be closed after re-running the scan.

### Earlier sessions


- **#485 and #464 merged** by Doctor Hubert. Dependabot never acted on `@dependabot recreate`, but #464 still
  covered all `uses:` lines on master and merged cleanly. Release notes checked against our workflows: no
  `require('@actions/github')`/`getOctokit` redeclaration in github-script steps, no `pull_request_target` or
  `workflow_run` triggers (checkout v6+), no `packageManager` field (setup-node v5+ auto-cache), GitHub-hosted
  runners only (node24 actions need runner >= 2.327.1).
- **Both deploys failed** (runs 44136530750 for #485, 44136548548 for #464) at "Audit production dependencies":
  new high advisory **GHSA-fc5q-39xc-vjpf** (picomatch ReDoS, `<= 4.0.7`, no patched release). npm reports 23
  high, all from this one advisory. In production deps picomatch comes only via `@sanity/cli`. Production stayed
  on `654aaa5` and healthy. In run 44136548548 upload-artifact v7 worked; **download-artifact v8 and
  ssh-action v1.2.5 have not run yet**.
- **#487 (this PR)**: dated exception in `.github/audit-exceptions.json` (expires **2026-12-15**), approved by
  Doctor Hubert. `node scripts/audit-gate.js` passes locally (1 excepted, 0 blocking).

- **#484 deployed** (run 44044235230, `654aaa5`): `/privacy` 200 with `#english` and `#dansk` (`lang="da"`);
  `/contact` links to it. Deploy on VPS 3 s; live ~3 min 21 s after the workflow started.
- **Dependabot #464** (github-actions group, 37 `uses:` lines) is SHA-pinned already but was built on an old
  master; `@dependabot recreate` was posted 2026-11-17. The bumps are **majors**: checkout v7.0.1, setup-node
  v7.1.0, upload-artifact v7.0.2, download-artifact v8.0.2, github-script v9.0.0, codecov-action v7.1.1,
  appleboy/ssh-action v1.2.5. Review the release notes (artifact v7/v8 must interoperate; ssh-action runs the
  production deploy) and watch the first production deploy after merging.

- **#482 (this PR)**: `/privacy` (`src/app/privacy/page.tsx`), English then Danish (`lang="da"` section, anchors
  `#english`/`#dansk`). Doctor Hubert's decisions (2026-11-17): controller Ida Romme; contact emails kept until
  the conversation is finished; English and Danish; a `/privacy` page. No cookies: checked live, the site sends
  no `Set-Cookie` and Umami's script only reads `localStorage["umami.disabled"]`. The email address is not printed
  (it stays behind "Show email"); requests go through the contact page. Linked under the contact form. New
  `.nordic-link-inline` (always underlined) in `src/styles/utilities/nordic-buttons.css`; `.nordic-link` only
  underlines on hover. 9 page tests + 1 contact-page test; checked at 1280 and 390 px (no overflow).
  **Not verified from the repo**: Nginx log retention ("kept only as long as that requires") and that the VPS is
  in Stockholm (hostname `vps-sto-1`). A Danish native speaker should read the Danish text once.
- **#483 deployed** (run 43922686727): `/api/health` → `{"status":"healthy"}`; CSP report with `text/plain` → 415;
  no Google Analytics hints on `/` or in the CSP.

- **This PR, three commits, one per finding**:
  - **SEC-06** (#479): `/api/csp-report` returns 415 unless the media type is `application/csp-report`,
    `application/reports+json` or `application/json`; logged document/blocked/source URIs lose `?query` and
    `#fragment` (CSP keywords such as `inline` stay). The live CSP has no `report-uri` (`CSP_REPORT_URI` unset), so
    no browser posts reports today. 4 new tests in `tests/api/csp-report.test.ts`.
  - **SEC-13** (#480): `/api/health` answers only `{"status":"healthy"}` (200) or `{"status":"unhealthy"}` (503) from
    the cached Sanity check. Version, environment, uptime, response time and the security/SSE "statuses" (they
    only reported env vars) are gone. Nothing in the repo read them.
  - **SEC-15 part 1** (#481): removed `<link rel="preconnect" href="https://www.google-analytics.com">` and the
    `googletagmanager` dns-prefetch from `src/app/layout.tsx` (live on every page: each visitor's browser
    connected to Google though the site has no Google Analytics) and the two Google Analytics hosts from the CSP.
    `*.googleusercontent.com` stays (Studio editor avatars). `tests/unit/no-unused-third-parties.test.ts`.
- **SEC-15 part 2** (#482): the privacy notice needs Doctor Hubert's decisions (controller and contact, email
  retention, Umami cookie/IP settings, language, placement); the issue lists the facts from the code.
- **#478 deployed** (run 43919729313): honeypot live on `/contact`; a filled one gets the success body, no email.
  First CI run failed: the design E2E test reads the form's first input/label, and the honeypot was first; it is
  now last in the form. Local E2E needed `npx playwright install chromium` after `npm ci` moved Playwright to 1.65.1.

- **Audit status on master** (docs/guides/SECURITY-AUDIT-2026-11-15.md): fixed SEC-01–04, 07–12, SEC-05 with this
  PR; **SEC-14 was already fixed** (control characters stripped from the subject, `tests/api/contact.test.ts`
  "should strip control characters"). Remaining: SEC-06 (partly done), SEC-13, SEC-15. Doctor Hubert asked to work
  through them one by one without waiting for input (2026-11-16).
- **SEC-05 (this PR)**: hidden `website` honeypot in both contact-form layouts
  (`src/components/shared/Forms/HoneypotField.tsx`, name in `src/lib/honeypot.ts`; off-screen, `aria-hidden`,
  `tabIndex=-1`, `autocomplete=off`), placed **last** in the form: the design E2E test reads the form's first
  input and label. The hook sends it only when filled; the API answers a filled one with the
  normal success body, sends nothing and does not count it against the global cap. The Resend send is raced
  against `RESEND_TIMEOUT_MS` (10 s, in `src/lib/rateLimit.ts`: route files may only export handlers). Tests: 4 in
  `tests/api/contact.test.ts`, 4 in `AdaptiveContactForm.test.tsx`; 275/275 across the contact-form suites;
  local build checked (markup present, honeypot POST → success, no email).
- **SEC-05 proxy trust verified live**: 25 POSTs of `{}` to `/api/csp-report` (same `getClientIp`, 20/min), each
  with a different forged `X-Forwarded-For`/`X-Real-IP`, gave 20× 204 then 429: Nginx appends the real address.
- **#476 deployed** (run 43913955413): `/` is `private, no-cache, no-store`; 19 nonced scripts, none missing.
  production-validation **2 min 31 s** (npm cache restored: `npm ci` 22 s; image pull 36 s; smoke tests 85 s).

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

**Tests**: ✅ all local (Jest, lint, build, E2E subset); #497 CI running at handoff time
**Branch**: ✅ master clean at `62272db`; #496 and #497 open. Both change this file: if #496 merges first,
  keep #497's version on rebase (it already contains #496's handoff)
**CI/CD**: ✅ production on `62272db`, healthy. Dependabot alert #269 (1 moderate) on master

### Agent Validation Status

The named validation agents are not available in this environment and were not run.

## 🚀 Next Session Priorities

1. **Merge #496, then #497, and watch the deploy**: #497 is the first deploy with the `github.sha` reset (#493)
   and the `node_modules.previous` swap (#494). No lockfile change, so npm ci is skipped this time. Then check
   `/studio/x.png` has a CSP, project images load, `/sitemap.xml` renders.
2. **Watch the contact form after deploy**: a real visitor's 4th message within an hour now gets 429. If Ida
   hears of that happening, raise `CONTACT_PER_CLIENT_HOURLY_LIMIT`.
3. **On the VPS (Doctor Hubert)**: `ss -lntp | grep 3001`; `nginx -T | grep -E 'client_max_body_size|limit_req|proxy_add_x_forwarded_for|Strict-Transport'`.
   Consider `args: 'start -H 127.0.0.1'` in `ecosystem.config.js`. Confirm old Sanity/Cloudinary keys revoked,
   then redact the launch-prep doc. Drop the duplicate HSTS header.
4. Triage leftover: V-10 (body read before the size check; settle with the nginx check). V-9 is #498.
5. Carried over: picomatch exception expires **2026-12-15** (drop it or move `@sanity/cli` to devDependencies);
   Dependabot #269; close #486 if the weekly scan passes; PM2 log rotation; deploy speed-ups; Umami Realtime; LCP.

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then confirm PRs #496, #497 and the #498 PR (audit triage, its fixes, query cache) are merged in that order and the production deploy is green.

**Immediate priority**: watch the first deploy with the `github.sha` checkout and `node_modules.previous` swap, spot-check `/studio/x.png`, images and `/sitemap.xml` (30 min); then retarget/rebase the #498 PR onto master if #497 was squash-merged (15 min)
**Context**: triage issues #488–#495 fixed in #497 and V-9 in #498; only V-10 and the VPS host checks remain
**Reference docs**: SESSION_HANDOVER.md, docs/guides/SECURITY-AUDIT-TRIAGE-2026-11-21.md, scripts/deploy/vps-release.sh
**Ready state**: master at `62272db` until the merges; production healthy

**Expected scope**: all three PRs deployed and verified on production; then V-10 once the nginx `client_max_body_size` is known

## 🔍 Security review prompt

Used on 2026-11-20/21 for DeepSeek, GLM and Kimi; results triaged in `docs/guides/SECURITY-AUDIT-TRIAGE-2026-11-21.md`.
The prompt text is in git history (`513a34e`).

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

## 📚 Key Reference Documents

- `docs/guides/SECURITY-AUDIT-TRIAGE-2026-11-21.md` (current security state; issues #488–#495) and the three model reports beside it
- Issue #395, issue #429, PRs #434 and #436 (merged), PRs #437 and #438 (draft), issue #397 (layout swap on project pages)
- `src/components/server/GalleryImagePreloads.tsx`, `src/utils/gallery-images.ts`, `src/app/page.tsx`, `src/app/projects/page.tsx`
- `public/fonts/inter-400.woff2`, `src/styles/critical/critical.css` (the two `@font-face` rules)
- `src/components/desktop/Project/DesktopImageCarousel.tsx`, `src/styles/desktop/project.css`
- `lighthouserc.js`, `.github/workflows/lighthouse-ci.yml`
- #435 (Umami back on, merged in #436): `tests/e2e/analytics-resilience.spec.ts`, issue #263. Left open there:
  `data-domains` on the script tag would stop local builds recording visits, and
  `tests/e2e/analytics-integration.spec.ts` asserts nothing against the dev server
