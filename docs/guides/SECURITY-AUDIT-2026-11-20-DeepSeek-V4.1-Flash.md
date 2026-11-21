# Security Audit Report — textile-showcase / idaromme.dk

**Date**: 2026-11-20
**Model**: DeepSeek V4.1 Flash (`numes/deepseek/deepseek-v4.1-flash:free`)
**Target**: `/home/mr/workspace/textile-showcase`, commit `62272db`
**Production reference**: `https://idaromme.dk`; handover says production is on `654aaa5` (see §10)
**Method**: source review, local production build (`next start -p 3999`), `curl`, Playwright 1.65.1, `npm audit`, lockfile review, git-history review
**Safety**: no production probes, no contact-form emails sent, no live credentials used, no DoS run against production. All dynamic tests were against `127.0.0.1:3999`. Secret values are redacted in this report.

---

## 0. Scope correction: there is no Bitcoin/crypto backend here

The review prompt asks for wallet, signature-verification, nonce, serialization and fund-loss analysis. **This repository contains none of that.** It is a Next.js 16.4.6 portfolio site with:

- App Router pages (`/`, `/projects`, `/project/[slug]`, `/about`, `/contact`, `/privacy`, `/studio`)
- A small number of API routes (`/api/contact`, `/api/csp-report`, `/api/indexnow`, `/api/projects/*`, `/api/health`)
- Sanity CMS as the content backend (public dataset, read via `@sanity/client`)
- Resend for contact-form email
- Self-hosted Umami analytics
- PM2 + nginx on a 2 GB Vultr VPS, deployed by GitHub Actions

There is no wallet, private-key handling, transaction signing, nonce state machine, RPC node, or on-chain logic. The findings below cover the actual production attack surface.

**Overall verdict:** no confirmed Critical remote-code-execution or fund-loss issue. The most serious confirmed risks are **unauthenticated availability attacks**, **production credentials retained in a world-readable local audit document**, and a **CSP/auth matcher bypass on the Sanity Studio path**. A conditional origin-exposure issue (Next.js on `0.0.0.0:3001`) could be High or Critical if the VPS firewall is not restricting it; that needs host-side validation.

**Finding counts (confirmed unless noted):**

| Severity | Count |
|---|---:|
| Critical | 0 confirmed (1 conditional escalation, DS-02) |
| High | 3 |
| Medium | 9 |
| Low | 11 |
| Informational | 8 |
| Needs validation | 11 |

---

## 1. Architecture and trust boundaries

```
Internet
  │
  ├─ HTTPS :443 ──► nginx (TLS, headers, possibly rate/body limits — config not in repo)
  │                    │
  │                    └─ proxy_pass ──► next start :3001 (0.0.0.0 by default)
  │                                          │
  │                                          ├─ Sanity API / CDN (public dataset, optional token)
  │                                          ├─ Resend API (RESEND_API_KEY in .env.local)
  │                                          └─ Umami at analytics.idaromme.dk (script.js in browser)
  │
  ├─ Browser ──► cdn.sanity.io (images), analytics.idaromme.dk (script), api.sanity.io (/studio auth)
  │
  └─ GitHub Actions (master push) ──► SSH/rsync ──► VPS deploy user ──► PM2 restart
```

**Assets and trust boundaries**

| Asset | Where it lives | Who can reach it |
|---|---|---|
| Contact-form PII (name, email, message) | In memory, then Resend/Gmail | Anyone on the internet (by design) |
| `RESEND_API_KEY` | VPS `.env.local` (mode 600) and GitHub secret | Next.js process, deploy user, any install script during `npm ci` |
| `SANITY_API_TOKEN` | Local `.env.local`; not written by the deploy workflow | Local developer, Next.js process |
| Sanity Studio session | Browser localStorage/cookies on `idaromme.dk` | Admin browser; **any same-origin script** |
| Portfolio content | Public Sanity dataset | Anyone (by design) |
| Umami script | `analytics.idaromme.dk` | Every visitor's browser, including `/studio` |
| Deploy SSH key / host secrets | GitHub `production` environment | Deploy workflow |
| Old GPG credential file | Deleted from HEAD; still in git history (encrypted) | Anyone with the repo/history; no private key found |

**Attackers considered**

1. Unauthenticated internet user (primary).
2. Cross-site attacker (victim's browser).
3. CMS editor / compromised Sanity account.
4. Local user or process on the developer/deploy host.
5. Compromised npm dependency or CI tool.
6. Compromised `analytics.idaromme.dk` or DNS takeover.
7. Network attacker if the origin port 3001 is reachable directly.

---

## 2. Findings summary

| ID | Severity | Finding | Primary location | Status |
|---|---|---|---|---|
| DS-01 | **High** | Unauthenticated project route amplification → Sanity quota exhaustion / PM2 OOM | `src/app/project/[slug]/page.tsx`, `src/app/api/projects/[slug]/route.ts`, `src/sanity/dataFetcher.ts`, `ecosystem.config.js` | Confirmed locally |
| DS-02 | **High** (Critical if keys valid) | Production-looking Sanity/Resend/Cloudinary credentials in a world-readable, untracked audit document | `docs/implementation/PUBLIC-LAUNCH-PREPARATION-2025-11-02.md:77-87`; `.env.local` | Needs rotation check |
| DS-03 | **High** (conditional) | Next.js origin likely bound to `0.0.0.0:3001`; direct-origin bypass of nginx/TLS/rate limits | `ecosystem.config.js:9,15-18`, `SECURITY.md:92` | Needs host validation |
| DS-04 | **Medium** | Middleware matcher skips any path ending in an image extension → no CSP on `/studio/*.png`; latent auth bypass for `/security/*.png` | `src/proxy.ts:315-325` | Confirmed locally |
| DS-05 | **Medium** | Contact global cap (30/hour) is cheap to exhaust; IPv6 `/64` defeats per-IP limit; 30 spam emails | `src/app/api/contact/route.ts:146-155`, `src/lib/rateLimit.ts:14-16` | Confirmed code/tests |
| DS-06 | **Medium** | Rate-limit map eviction deletes active keys, including the global contact counter, resetting quotas | `src/lib/rateLimit.ts:27-44,53-56` | Confirmed with real module |
| DS-07 | **Medium** | CSRF/content-type substring bypass on `/api/contact`: `text/plain; application/json` is accepted without preflight | `src/app/api/contact/route.ts:96-99` | Confirmed in Chromium |
| DS-08 | **Medium** | Request bodies buffered up to 10 MB before the 16 KB / 8 KB checks; chunked bodies bypass `Content-Length` | `contact/route.ts:101-110`, `csp-report/route.ts:117-126`, `proxy.ts:43-47` | Confirmed locally |
| DS-09 | **Medium** | Analytics script loads on `/studio`; same-origin Studio + CSP bypass → CMS session theft if analytics is compromised | `layout.tsx:108`, `analytics-provider.tsx:13-47`, `proxy.ts:260-290` | Needs analytics-host validation |
| DS-10 | **Medium** | Secret-scanning gaps: gitleaks allowlists docs/workflows/README; pre-commit omits `.md`/`.env` and unquoted values | `.gitleaks.toml:8-14`, `.pre-commit-config.yaml:383` | Confirmed config |
| DS-11 | **Medium** | `.env.local` with `RESEND_API_KEY` is written before `npm ci`; install scripts can read/exfiltrate it | `production-deploy.yml:206-223`, `vps-release.sh:23-34` | Confirmed order; supply-chain dependent |
| DS-12 | **Medium** | `npm ci` failure rollback removes `node_modules` and does not restore it; deploy can leave the site down | `vps-release.sh:23-36,58-70` | Confirmed |
| DS-13 | Low | `SECURITY_ENABLED` fail-open demo mode + static-token auth stub (latent; deleted security routes still in history) | `src/proxy.ts:33-78,119-140` | Latent |
| DS-14 | Low | Historical unauthenticated credential API and encrypted GPG file remain in git history; no private key found | History of `src/app/api/security/credentials/route.ts`, `credentials/encrypted.gpg` | Latent |
| DS-15 | Low | Honeypot can silently drop legitimate messages and is trivially bypassed | `HoneypotField.tsx`, `contact/route.ts:119-123` | Code review |
| DS-16 | Low | HSTS and several security headers only exist in the proxy; image-suffix paths lose HSTS/COOP/Permissions-Policy | `proxy.ts:210-222`, `next.config.ts` headers | Needs header check |
| DS-17 | Low | Image optimizer has no request rate limit; any Sanity project's images are allowed | `next.config.ts:20-39` | Confirmed bounds |
| DS-18 | Low | PM2 logs are unbounded in-repo; Next image-optimizer errors can fill disk | `ecosystem.config.js:31-33` | Needs host validation |
| DS-19 | Low | `getClientIp` trusts `X-Real-IP` fallback; CDN/proxy changes can collapse all clients into one bucket | `src/lib/clientIp.ts:19-27` | Needs nginx/CDN validation |
| DS-20 | Low | IndexNow public key permits external submissions; API has no body limit (authenticated) and exposes key info | `src/app/api/indexnow/route.ts:7,31-49,88-102` | Code review |
| DS-21 | Low | CSP uses `style-src 'unsafe-inline'`, broad `*.googleusercontent.com`, and analytics host on all paths | `src/proxy.ts:245-290` | Defense-in-depth |
| DS-22 | Low | Sitemap does not URL-encode CMS slugs and can emit invalid `lastModified` dates | `src/app/sitemap.ts:70-76` | Code review |
| DS-23 | Low | Dead `public/sw.js` cache logic would cache HTML despite `no-store` if ever registered | `public/sw.js` | Not registered |
| DS-24 | Info | `next.config` `ignoreBuildErrors: true`; `removeConsole` strips security logs; unused Server Actions | `next.config.ts:12-19,41-45` | Code review |
| DS-25 | Info | `SECURITY.md` claims Cloudflare DDoS protection; no evidence in repo; direct-origin bypass would negate it | `SECURITY.md:92` | Documentation |
| DS-26 | Info | Dead code (`ClientProjectContent`, legacy `ContactForm`, `ProjectView`, lazy form) with minor latent issues | various | Code review |
| DS-27 | Info | `@sanity/cli` in production deps; audit gate only scans `--omit=dev`; `gitleaks latest` / `@lhci` unpinned | `package.json`, `audit-gate.js`, workflows | Code review |
| DS-28 | Info | CSP reporting is effectively unused (`CSP_REPORT_URI` unset, logs stripped) | `proxy.ts:291-295`, `csp-report/route.ts` | Code review |
| DS-29 | Info | No `Cross-Origin-Resource-Policy`; `X-DNS-Prefetch-Control: on`; no PWA manifest link | `next.config.ts`, `layout.tsx` | Privacy/defense |
| DS-30 | Info | Production handover references `654aaa5`, while HEAD is `62272db`; verify deployed commit | `SESSION_HANDOVER.md` | Operations |

---

## 3. High-severity findings

### DS-01 — Unauthenticated project-route amplification can exhaust Sanity and OOM PM2

**Severity:** High (availability)
**Access:** Unauthenticated network user
**Confidence:** Confirmed locally; production impact depends on nginx/CDN limits

**Locations**

- `src/app/project/[slug]/page.tsx:17-31` — `dynamic = 'force-dynamic'`; every request calls `getProjectWithNavigation(slug)`
- `src/app/project/[slug]/hooks/use-project-data.ts:86-135` — two `resilientFetch` calls per page; retries 3 and 2, timeouts 15 s and 10 s
- `src/app/api/projects/[slug]/route.ts:16-70` — same two-query pattern on the API
- `src/sanity/dataFetcher.ts:105-177` — no single-flight/dedupe, no negative cache, retries all errors, no request abort
- `ecosystem.config.js:11,22-28` — one fork, `max_memory_restart: 800M`, `max_restarts: 10`

**Root cause**

A request for any slug (real, nonexistent, or invalid) causes two or three Sanity GROQ queries:

1. `generateMetadata` calls `getProject(slug)` (`project-metadata.tsx:2,13-17`).
2. The page calls `getProjectWithNavigation(slug)`, which queries the project again and runs the navigation query.
3. `resilientFetch` caches only truthy results (`dataFetcher.ts:151`). A `null` 404 is never cached, so the same nonexistent slug is queried again on every request.
4. There is no rate limit, concurrency cap, or slug allowlist on `/project/[slug]` or `/api/projects/[slug]`. `force-dynamic` disables route caching.
5. On any Sanity error/timeout the fetcher retries with 1–5 s backoff, so an overloaded Sanity makes each request hold a Node request slot longer.

**Attack scenario**

An unauthenticated attacker sends a burst of requests to a single URL, for example `/project/nope`:

```bash
# Do NOT run this against production without written authorization.
seq 1 600 | xargs -P 200 -I{} curl -s -o /dev/null "https://idaromme.dk/project/nope"
```

Each request still queries Sanity because `null` is not cached. There is no app-level or obvious nginx-level rate limit in the repo. The same applies to `/api/projects/nope`.

**Measured local evidence**

On a local production build (`next start -p 3999`):

- 100 concurrent requests to `/project/loadtest-*` completed in ~3 s and raised `next-server` RSS from **190 MB to 276 MB**.
- The VPS PM2 cap is 800 MB with only 10 restarts allowed. A few hundred concurrent requests is credible; once PM2 restarts, the in-memory Sanity cache and rate-limit state reset, and after 10 restarts PM2 gives up.

**Impact**

- Site-wide slowdown or outage, including the home page and contact form.
- Sanity API quota/rate-limit exhaustion, causing `/`, `/projects`, `/sitemap.xml` and project pages to degrade or return empty content.
- PM2 restart loop; after `max_restarts: 10`, the site can stay down until manual intervention.
- No authentication or special tooling required.

**Suggested fix (defense in depth)**

1. Add nginx `limit_req` and `limit_conn` for `/project/` and `/api/projects/`; consider a small CDN/edge cache.
2. Add an app-level token bucket keyed by IP or `/64` for project routes.
3. Cache negative results for a short TTL (e.g., 30–60 s) and add single-flight/dedupe for identical cache keys.
4. Validate slugs against a cached set of known slugs before querying Sanity; return 404 for unknown slugs.
5. Reduce retries/timeouts and abort the underlying request when the timeout fires.
6. Lower `max_memory_restart`/heap settings and add an external health watch that alerts on restart loops.

---

### DS-02 — Production-looking credentials in a world-readable, untracked audit document

**Severity:** High under local-access/shared-workspace assumption; **Critical if the keys are still valid and the workspace/backups are accessible**
**Access:** Local filesystem user or process; accidental commit/archive/backup; not remotely reachable from the site
**Confidence:** Values look real by format/length; validity not tested

**Locations**

- `docs/implementation/PUBLIC-LAUNCH-PREPARATION-2025-11-02.md:77-87` — an incident report that includes a Sanity token (50 chars), a Cloudinary API secret (27 chars), and a Resend key (36 chars) in plaintext, marked “EXPOSED”.
- The file is **untracked and gitignored** (`.gitignore:51`), mode `644` — readable by any local user/process.
- `.env.local` is mode `600` and contains a 180-char Sanity token; it is not in git history.

**Root cause**

A historical launch-readiness report retained the actual production secret values instead of redacting them. Because the file is gitignored, it was not committed (verified: `git log -S` finds zero commits containing the exact values), but it remains in the working tree and can leak through:

- a shared development machine or CI workspace,
- backups/snapshots/archives that include ignored files,
- `git add -f` or a tool that ignores `.gitignore`,
- editor/agent context exfiltration.

**Attack scenario**

A local unprivileged user, compromised editor extension, or backup reader obtains the doc and uses the keys:

- **Sanity token** — depending on role, read drafts/private data or modify/delete portfolio content.
- **Resend key** — send email from the verified `idaromme.dk` sender, enabling phishing/spam and damaging domain reputation.
- **Cloudinary secret** — access/delete assets or incur billing (the app no longer uses Cloudinary, but the account may still be active).

The document itself says: “Anyone with repository access can steal credentials.”

**Evidence (redacted)**

```bash
stat -c '%a %n' docs/implementation/PUBLIC-LAUNCH-PREPARATION-2025-11-02.md
# 644 ...
grep -n 'CLOUDINARY_API_SECRET=' docs/implementation/PUBLIC-LAUNCH-PREPARATION-2025-11-02.md
# ... =<redacted> (EXPOSED)
```

No value is reproduced here, and no key was used against a live service.

**Impact**

If the keys were not rotated: full CMS content takeover, domain email abuse/phishing, and cloud asset/billing abuse. If they were rotated, this is still a credential-hygiene failure and a leak of historical secrets.

**Suggested fix**

1. **Rotate the Sanity token, Resend key, and Cloudinary secret now**, then revoke the old ones.
2. Delete/redact the values from the document; keep only a note that they were exposed and rotated.
3. `chmod 600` any file that must retain incident details; prefer a secret manager.
4. Add an untracked-file secret scan (`gitleaks dir`, `detect-secrets`) to the audit workflow.
5. Confirm the current `.env.local` Sanity token’s role is the minimum needed (read-only for public content).

---

### DS-03 — Next.js origin appears bound to `0.0.0.0:3001`; direct-origin bypass is possible if the firewall allows it

**Severity:** High if `:3001` is reachable from the internet; otherwise Informational
**Access:** Network reachability to the VPS on port 3001; **Needs validation**
**Confidence:** Binding behaviour confirmed locally; VPS firewall not inspectable from the repo

**Locations**

- `ecosystem.config.js:8-18` — `args: 'start'`, `PORT: 3001`, no `HOSTNAME`/`-H`.
- Local `next start -p 3999` printed both a `Local:` and a `Network:` URL (`http://192.168.122.95:3999`), confirming Next binds all interfaces by default.
- `SECURITY.md:92` claims “Cloudflare CDN with DDoS protection”; if true, direct-to-origin traffic would bypass it unless nginx/firewall only allows Cloudflare ranges.

**Root cause**

The app relies on nginx for TLS, rate limiting, body limits, and header hardening, but the Node origin is not bound to loopback and no firewall rule is represented in the repo. `getClientIp` also trusts `X-Forwarded-For`/`X-Real-IP` on the assumption that only nginx can reach the app.

**Attack scenario (if 3001 is open)**

- Bypass nginx TLS: send contact-form data and Studio login traffic over plain HTTP; a network attacker can read/modify it.
- Bypass nginx `client_max_body_size`, `limit_req`, and any Cloudflare protection.
- Spoof `X-Forwarded-For`/`X-Real-IP` to defeat the app’s per-IP rate limits (the rightmost-hop check is only meaningful behind nginx).
- Hit `/_next/image`, `/studio`, and the project pages directly without the proxy’s header controls.
- If Cloudflare is used, the origin IP (needed for SSH/rsync) is likely known, so Cloudflare does not protect against direct-IP attacks unless the firewall blocks non-Cloudflare sources.

**Verification (on the VPS, not from outside)**

```bash
ss -lntp | grep -E ':3001\b'
curl -sS -D - http://127.0.0.1:3001/api/health -o /dev/null
# From a separate authorized host:
curl -sS -D - http://<VPS_PUBLIC_IP>:3001/api/health -o /dev/null
```

Also inspect `ufw status`/Vultr firewall and nginx `allow`/`deny` rules.

**Impact**

Plaintext PII/admin traffic, rate-limit bypass, and complete bypass of the nginx/Cloudflare DoS controls. This amplifies DS-01, DS-05, DS-06, and DS-08.

**Suggested fix**

1. Bind Next to loopback: `args: 'start -H 127.0.0.1'` or set `HOSTNAME=127.0.0.1`.
2. Firewall `3001` from the internet; allow only nginx on the host.
3. If Cloudflare is used, restrict origin 80/443 to Cloudflare IP ranges and keep SSH restricted.
4. Re-verify `getClientIp` after any proxy/CDN change.

---

## 4. Medium-severity findings

### DS-04 — Middleware matcher skips image-suffix paths, removing CSP from `/studio/*.png`

**Severity:** Medium (defense-in-depth / latent auth bypass)
**Access:** Unauthenticated request; impact requires a Studio XSS or a future `/security` route
**Confidence:** CSP absence confirmed locally

**Locations**

- `src/proxy.ts:315-325`:

```ts
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
],
```

- `src/app/studio/[[...tool]]/page.tsx:1-66` — optional catch-all matches **any** path under `/studio`, including `/studio/foo.png`.
- `src/app/layout.tsx:108` — analytics and the root layout run on Studio pages too.

**Root cause**

The negative lookahead excludes **any path ending in an image extension anywhere in the app**, not just assets under `/images/` or `/_next/static`. Next’s catch-all Studio route therefore serves the Studio at `/studio/foo.png` while `proxy()` never runs. `next.config.ts` still adds `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`, but the following are supplied only by the proxy and are missing:

- `Content-Security-Policy` (the primary XSS control)
- `Strict-Transport-Security`
- `Cross-Origin-Opener-Policy`
- `Permissions-Policy`
- `X-Permitted-Cross-Domain-Policies`
- `X-Download-Options`
- `x-nonce`

The same matcher is the **authorization gate** for `/security` and `/api/security` (`proxy.ts:50-78`). If those routes are restored from history, a path such as `/security/dashboard.png` (or a catch-all under `/security`) would skip authentication entirely.

**Confirmed local evidence**

```text
GET /studio            -> 200, Content-Security-Policy: default-src 'self'; ...
GET /studio/foo.png    -> 200, no Content-Security-Policy, no x-nonce
GET /studio/.png       -> 200, no Content-Security-Policy
GET /project/foo.png   -> 404, no Content-Security-Policy
```

`/studio/foo.png` served the Studio shell (HTML contained “Textile Showcase CMS” and Studio chunks).

**Impact**

The Sanity Studio loses its CSP. Any Studio XSS or malicious script loaded into that page executes without the nonce/strict-dynamic control. Because the Studio shares the `idaromme.dk` origin, a successful script can read the Studio’s localStorage/cookies and take over the CMS. The missing auth gate is a latent critical issue for any future `/security` route.

**Suggested fix**

- Only exclude **known asset prefixes**, not suffixes:

```ts
matcher: [
  '/((?!_next/static|_next/image|images/|fonts/|favicon\\.ico|apple-touch-icon\\.(?:png|webp)|icon-\\d+x\\d+\\.(?:png|webp)$).*)',
],
```

- Move static security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, HSTS where safe, COOP, Permissions-Policy) into `next.config.ts` so they apply even when the proxy is skipped.
- Add tests for `/studio/anything.png`, `/security/anything.png`, and `/project/valid-slug.png`.

---

### DS-05 — Contact global quota is cheap to exhaust; IPv6 rotation defeats the per-IP limit

**Severity:** Medium (business availability + spam)
**Access:** Unauthenticated
**Confidence:** Confirmed by code and API tests

**Locations**

- `src/app/api/contact/route.ts:146-155` — global `checkRateLimit(GLOBAL_RATE_LIMIT_KEY, {limit: 30, windowMs: 1h})`
- `src/lib/rateLimit.ts:14-16` — `GLOBAL_CONTACT_LIMIT = 30`, `GLOBAL_CONTACT_WINDOW_MS = 3_600_000`
- `src/app/api/contact/route.ts:91-94` — per-IP default 5/min
- `src/lib/clientIp.ts:19-27` — full IP is the key

**Root cause**

The global cap is intended to protect the Resend quota, but it is also a single shared bucket for all legitimate inquiries. One IP can send five valid messages per minute, so **30 requests in six minutes** exhausts the hour. With IPv6, an attacker with a routed `/64` can use 30 different source addresses in seconds; the per-IP key is the full address, so there is no subnet aggregation.

**Attack scenario**

1. Send 30 valid contact submissions (name, email, 10+ char message) from one IP over ~6 minutes, or from 30 IPv6 addresses immediately.
2. Every subsequent legitimate submission receives HTTP 429 for the remainder of the hour.
3. The owner receives 30 spam emails and may miss real inquiries.
4. Repeat every hour. The honeypot is irrelevant because the attacker omits the `website` field.

**Impact**

Contact channel denial of service, mailbox spam, and email-reputation risk. No authentication required; the global cap makes the attack cheaper, not harder.

**Suggested fix**

- Add a privacy-preserving CAPTCHA/Turnstile or proof-of-work challenge.
- Rate-limit IPv6 by `/64` (and IPv4 by `/24`) rather than the full address.
- Separate “global budget” from “block all”: queue/flag suspicious submissions instead of rejecting every legitimate user.
- Add per-email-domain and duplicate-content checks; alert on sudden volume.
- Consider a larger Resend quota with a queue and a daily budget.

---

### DS-06 — Rate-limit map eviction deletes active keys, including the global contact counter

**Severity:** Medium (rate-limit bypass / quota reset)
**Access:** Unauthenticated, but requires many distinct source IPs (IPv6 `/64` or a proxy pool)
**Confidence:** Confirmed with the real module

**Locations**

- `src/lib/rateLimit.ts:21-44` — one `Map` for per-IP and global keys; `evictIfFull` drops the **oldest active** keys when the map is full.
- `src/lib/rateLimit.ts:53-56` — new key triggers eviction.
- `src/app/api/contact/route.ts:92,148` — per-IP key and `__contact_global__` live in the same map.
- `src/app/api/contact/route.ts:119-123` — honeypot requests create a per-IP key but return before the global check, so they can fill the map without consuming the global budget.

**Root cause**

`RATE_LIMIT_MAX_KEYS` is 10,000. When full, `evictIfFull` first removes expired entries, then deletes the oldest **non-expired** entries to make room. The global contact counter is inserted early and is eventually the oldest entry, so it is evicted. The next valid request creates a fresh global counter and gets another 30 sends.

**Confirmed reproduction (actual module, no secrets)**

```text
global first: true
size 10000 global present after fill? false
global allowed again: true count 1
```

The script inserted the global key, filled 10,000 per-IP keys, and observed the global key disappear and become usable again.

**Attack scenario**

1. Use an IPv6 `/64` (or a proxy pool) to send 10,000 requests with distinct source addresses. Honeypot-filled or ordinary requests both create per-IP keys; honeypot requests do not consume the global quota.
2. The map evicts `__contact_global__` (and older per-IP counters).
3. Send 30 real messages; the global check starts at count 1 again.
4. Repeat. Per-IP buckets can also be evicted, so an individual address can be reused.

**Impact**

The only defense against distributed contact spam/quota exhaustion is bypassable. Combined with DS-05, an attacker can spam the owner and block legitimate inquiries indefinitely.

**Suggested fix**

- Keep the global counter in a **separate, non-evictable** store, or reserve its key.
- When the map is full, reject new keys instead of evicting active ones (and return a bounded 429), or use Redis/Upstash with TTLs.
- Key by subnet (`/64`, `/24`) to reduce key cardinality.
- Add a CAPTCHA and alerting.

---

### DS-07 — CSRF/content-type substring bypass on `/api/contact`

**Severity:** Medium (cross-site spam + global quota exhaustion)
**Access:** Unauthenticated; victim must visit an attacker-controlled page
**Confidence:** Confirmed in headless Chromium (no preflight, server accepted the request)

**Location**

- `src/app/api/contact/route.ts:96-99`:

```ts
const contentType = request.headers.get('content-type') || ''
if (!contentType.toLowerCase().includes('application/json')) {
  return jsonError('Unsupported content type', 415)
}
```

**Root cause**

The check is a substring match, not a MIME-type comparison. A browser `fetch` in `no-cors` mode can send:

```http
Content-Type: text/plain; application/json
```

The MIME essence is `text/plain`, which is CORS-safelisted, so the browser sends a **simple request with no OPTIONS preflight**. The server sees `application/json` in the substring and accepts the raw JSON body. There is no `Origin`/`Sec-Fetch-Site`/custom-header check.

**Confirmed browser evidence**

A page on `http://127.0.0.1:4001` ran:

```js
fetch('http://127.0.0.1:3999/api/contact', {
  method: 'POST',
  mode: 'no-cors',
  headers: {'Content-Type': 'text/plain; application/json'},
  body: JSON.stringify({
    name: 'CSRF Test',
    email: 'csrf@example.com',
    message: 'This is a cross-site contact form test message.'
  })
})
```

Playwright observed only:

```text
POST  text/plain; application/json
RES   503
```

No `OPTIONS` preflight was sent, and 503 (not 415) proves the request passed the content-type check and reached the missing-Resend-key branch. On production, with a valid key, the email would be sent.

**Attack scenario**

1. Attacker hosts a page; a visitor loads it.
2. The page makes the `no-cors` POST above with attacker-chosen content.
3. The visitor’s browser sends the request from the visitor’s IP; the owner receives the message.
4. With 30 visitors (or one visitor reloading), the global cap is exhausted and the contact channel is blocked (DS-05). The attacker cannot read the opaque response but does not need to.

**Impact**

Cross-site contact-form spam, email bombing, IP-reputation/abuse from victims’ addresses, and global-quota denial of service. No account takeover (the endpoint is unauthenticated), but the CSRF defense the content-type check was meant to provide is absent.

**Suggested fix**

- Parse the media type exactly, as the CSP route does:

```ts
const mediaType = (request.headers.get('content-type') ?? '')
  .split(';', 1)[0].trim().toLowerCase()
if (mediaType !== 'application/json') return jsonError('Unsupported content type', 415)
```

- Require `Sec-Fetch-Site: same-origin` (when present) and/or a custom header such as `X-Contact-Form: 1`; cross-origin custom headers trigger a preflight that the route can reject.
- Keep the honeypot and add a CAPTCHA for non-browser clients.
- Add a regression test that sends `text/plain; application/json` and expects 415.

---

### DS-08 — Request bodies are buffered up to 10 MB before the 16 KB / 8 KB limits

**Severity:** Medium (memory exhaustion / DoS)
**Access:** Unauthenticated; needs source-IP diversity to bypass per-IP limits
**Confidence:** Confirmed locally; production depends on nginx `client_max_body_size`

**Locations**

- `src/app/api/contact/route.ts:101-110` — `declaredLength` check, then `await request.text()`, then `raw.length > MAX_BODY_BYTES`
- `src/app/api/csp-report/route.ts:117-126` — same pattern for 8 KB
- `src/proxy.ts:43-47` — `NextResponse.next({ request: { headers: requestHeaders } })` forwards the request through middleware, which buffers the body
- `next.config.ts` — no `middlewareClientMaxBodySize` setting

**Root cause**

- The `Content-Length` check is bypassed by `Transfer-Encoding: chunked` (no length, or a forged small length).
- `request.text()` reads the **entire** body before the application checks `raw.length`.
- Next.js 16 buffers the body for middleware-proxied requests and defaults to a 10 MB `middlewareClientMaxBodySize`; it logs: “Request body exceeded 10MB … Only the first 10MB will be available.”
- The app’s real limits are 16 KB (contact) and 8 KB (CSP), so the middleware accepts 10 MB of attacker data per request before the route rejects it.

**Confirmed local evidence**

```bash
head -c 30000000 /dev/zero | tr '\0' 'a' > /tmp/big
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'Transfer-Encoding: chunked' \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/big \
  http://127.0.0.1:3999/api/contact
# 413, after Next logged:
# Request body exceeded 10MB for /api/contact. Only the first 10MB will be available...
```

The same test against `/api/csp-report` also returned 413 after buffering. `next-server` RSS grew during the tests.

**Attack scenario**

1. Send chunked 10 MB bodies to `/api/contact` or `/api/csp-report` from many source IPs; each is buffered before rejection.
2. With ~80 concurrent 10 MB requests, memory pressure approaches the 800 MB PM2 cap; the process restarts, resetting caches and rate limits.
3. Repeat; after `max_restarts: 10`, PM2 can stop the app.

The per-IP limits (5/min contact, 20/min CSP) require a botnet or IPv6 `/64`, but the bandwidth cost per request is the attacker’s, and the memory cost is the server’s.

**Impact**

Memory exhaustion, PM2 restart loop, and site-wide outage. It also amplifies DS-01. Nginx’s default `client_max_body_size` is often 1 MB, which would reduce but not eliminate the issue; the repo does not include the nginx config.

**Suggested fix**

- Set a small Next middleware body limit (e.g., 64 KB) in `next.config.ts` if supported by the deployed Next version, or add nginx `client_max_body_size 32k` for `/api/contact` and `/api/csp-report`.
- Enforce the limit while reading with a reader loop/abort, not after `request.text()`.
- Reject non-`application/json` before reading (see DS-07) and consider excluding API routes from the request-header-forwarding proxy; they do not need a CSP nonce.

---

### DS-09 — Analytics runs on `/studio`; same-origin Studio + CSP bypass risks CMS session theft

**Severity:** Medium (High impact if the analytics host or DNS is compromised)
**Access:** Attacker must compromise `analytics.idaromme.dk` or its DNS; admin must visit `/studio`
**Confidence:** Code path confirmed; compromise not tested

**Locations**

- `src/app/layout.tsx:105-110` — `AnalyticsProvider` wraps all routes, including Studio.
- `src/app/components/analytics-provider.tsx:13-47` — injects `${NEXT_PUBLIC_UMAMI_URL}/script.js` with a nonce on every page.
- `src/app/studio/[[...tool]]/page.tsx:1-66` — Sanity Studio on the same origin.
- `src/proxy.ts:245-290` — CSP includes `https://analytics.idaromme.dk` on all paths (and Studio-specific Sanity hosts on `/studio`).

**Root cause**

Sanity Studio is hosted at `idaromme.dk/studio` (same origin as the public site), and the analytics script is loaded there with a nonce. The script executes in the **Studio page’s origin**, so it can read `localStorage`/cookies used by Sanity auth and the Studio’s DOM. There is no pathname gate, and the CSP explicitly allows the analytics host. The `/studio/foo.png` matcher bypass (DS-04) removes CSP entirely on a Studio path.

**Attack scenario**

1. Compromise the self-hosted Umami service, its host, or DNS for `analytics.idaromme.dk` (or gain write access to `script.js`).
2. Serve JavaScript that reads Sanity Studio auth tokens from localStorage/cookies and exfiltrates them.
3. Wait for an admin to open `/studio`; the analytics script loads with the nonce and runs in the same origin.
4. Use the stolen session to modify/delete content or add malicious links.

The same script can read contact-form fields before submission and exfiltrate PII, and can manipulate any public page.

**Impact**

CMS takeover, content defacement, PII theft, and phishing. Requires a separate analytics compromise, but the architecture turns that into same-origin admin compromise.

**Suggested fix**

- Do **not** load analytics on `/studio` (gate by pathname in `AnalyticsProvider` or render it only in a public layout).
- Host Studio on a separate origin/subdomain (e.g., `studio.idaromme.dk`) so its storage is isolated from public pages and analytics.
- Remove `https://analytics.idaromme.dk` from the `/studio` CSP.
- Consider serving analytics from a separate registrable domain and/or a sandboxed iframe.
- Monitor the analytics host and DNS; use a pinned/verified script version if possible.

---

### DS-10 — Secret-scanning gaps: gitleaks allowlists docs/workflows/README; pre-commit omits `.md`/`.env`

**Severity:** Medium (secret-leak prevention)
**Access:** Requires a commit/force-add or a leaked working tree; not a direct remote exploit
**Confidence:** Confirmed configuration

**Locations**

- `.gitleaks.toml:6-14`:

```toml
[allowlist]
paths = [
  '''README\.md$''',
  '''docs/.*\.md$''',
  '''\.github/workflows/.*''',
  '''SESSION-HANDOFF.*\.md$''',
  '''dist/.*''',
]
```

- `.pre-commit-config.yaml:374-387` — `check-credentials` includes only `*.sh`, `*.bash`, `*.py`, `*.js`, `*.ts`, `*.txt`, `*.yml`, `*.yaml`; it does **not** include `*.md`, `*.env*`, or extensionless files, and its regex requires a quote after `=`:

```bash
grep -r --include="*.sh" ... -iE "(password|api_key|secret|token|github_token).*=.*['\"\`]\S+"
```

**Root cause**

The two layers that should catch a hardcoded secret both have blind spots:

- gitleaks skips docs, README, workflows, session handoffs, and `dist/`.
- The pre-commit hook skips Markdown (where the existing incident document lives), `.env.local` (where secrets normally live), and unquoted assignments such as `CLOUDINARY_API_SECRET=...`.
- The pre-commit hook is local-only; CI does not run `pre-commit run --all-files`.
- `gitleaks-version: 'latest'` in `secret-scan.yml` is a mutable tool dependency.

The existing `docs/implementation/PUBLIC-LAUNCH-PREPARATION-2025-11-02.md` is a concrete example: it contains production-looking secrets, is a `.md` file, and is under an allowlisted `docs/` path. It happened to be untracked, so gitleaks did not see it; if it had been force-added, the allowlist would have hidden it.

**Impact**

A secret committed to a doc, README, workflow, or unquoted env file can pass both local and CI scans. This is especially relevant because the repo already contains a document with live-looking keys and because workflows often carry secrets.

**Suggested fix**

- Remove broad path allowlists; use precise regex allowlists for known placeholders (`example.com`, `REPLACEME`, `your_*_key`).
- Add `*.md`, `*.env*`, and extensionless files to the pre-commit scanner; support unquoted assignments.
- Run `gitleaks detect --no-git` (working tree) and `gitleaks detect --log-opts=--all` (history) in CI.
- Run `pre-commit run --all-files` in CI, not just locally.
- Pin the gitleaks version and verify its checksum.

---

### DS-11 — `.env.local` with the Resend key is written before `npm ci`; install scripts can read it

**Severity:** Medium (supply-chain secret exfiltration; High if the deploy user is root)
**Access:** Requires a compromised production dependency or a malicious package version in the lockfile
**Confidence:** Order confirmed; actual compromise not tested

**Locations**

- `.github/workflows/production-deploy.yml:206-223` — writes `.env.local` with `RESEND_API_KEY` and `chmod 600`, then calls `bash scripts/deploy/vps-release.sh`.
- `scripts/deploy/vps-release.sh:23-34` — `rm -rf node_modules` and `npm ci --omit=dev`; npm runs lifecycle scripts.
- `package-lock.json` — production package `esbuild` has `hasInstallScript`; `sharp` 0.35.5 does not. Any future production dependency with an install script has the same access.

**Root cause**

The secret is present in the working directory before dependency installation. An install/postinstall script runs as the deploy user with the working directory set to `/var/www/idaromme.dk`, so it can read `.env.local`. `chmod 600` does not help: the install script runs as the same user that owns the file.

**Attack scenario**

1. A production dependency is compromised (or a malicious version enters the lockfile through a reviewed-looking update).
2. Its `postinstall` reads `.env.local`, extracts `RESEND_API_KEY`, and posts it to an attacker endpoint.
3. The attacker uses the Resend key to send phishing email from the verified `idaromme.dk` domain.
4. If `VULTR_USERNAME` is `root` (needs validation), the script also has root on the VPS.

**Impact**

Domain email compromise/phishing, reputational damage, and potentially full host compromise. The build job also runs `npm ci` with `NEXT_PUBLIC_*` values, but those are public; the VPS `.env.local` is the valuable target.

**Suggested fix**

- Run `npm ci --omit=dev --ignore-scripts` (verify `esbuild`/`sharp` still work) or install dependencies before writing `.env.local`.
- Better: keep runtime secrets out of the repo directory; use PM2 `env`/`env_file` from a root-owned location, systemd `EnvironmentFile`, or a secrets manager.
- Use a dedicated non-root deploy user; verify `VULTR_USERNAME`.
- Pin/verify production dependencies and monitor install scripts (`npm query ':attr(hasInstallScript)'`).
- Use `umask 077` before writing `.env.local`; `cat >` currently creates it 644 briefly before `chmod 600`.

---

### DS-12 — `npm ci` failure rollback removes `node_modules` and does not restore it

**Severity:** Medium (availability)
**Access:** Requires an npm registry/network failure or a failing install; not attacker-controlled directly
**Confidence:** Confirmed

**Locations**

- `scripts/deploy/vps-release.sh:23-36`:

```bash
pm2 stop "$APP" ...
rm -rf node_modules
if ! npm ci --omit=dev; then
  echo "npm ci failed, restarting the current build..."
  pm2 start "$APP" 2>/dev/null || echo "Could not restore PM2 process"
  exit 1
fi
```

- `scripts/deploy/vps-release.sh:58-70` — `.next` rollback exists, but no `node_modules` rollback.
- `production-deploy.yml:225+` — `production-validation` runs after deploy; a failed smoke test does not roll back.

**Root cause**

The old `node_modules` is deleted before the new install succeeds. If `npm ci` fails, PM2 is restarted with the old `.next` but missing/partial dependencies, so the app may not boot. The workflow fails, but the site stays down. There is also no automatic rollback if the post-deploy smoke tests fail.

**Impact**

A registry outage, native-module build failure, or bad lockfile can leave the production site down until manual repair. No attacker privilege required beyond causing the install failure.

**Suggested fix**

- Rename `node_modules` to `node_modules.old` before install; restore it on failure.
- Or install into a temporary directory and swap after success.
- Add a health check before deleting the old process; keep the old PM2 process until the new one is healthy.
- Add an automatic rollback when `production-validation` fails.
- Add an alert if PM2 is not online after deploy.

---

## 5. Low-severity findings

### DS-13 — Fail-open demo mode and static-token auth stub

**Location:** `src/proxy.ts:33-78` (`isDemoMode = process.env.SECURITY_ENABLED !== 'true'`), `src/proxy.ts:98-140` (`getAuthToken`, `VALID_AUTH_TOKEN` comparison, `token.includes('expired')`).

**Why it matters:** The security-route auth is **fail-open** unless `SECURITY_ENABLED` is exactly `'true'`. The production deploy writes `SECURITY_ENABLED=false`, so any `/security` or `/api/security` route is unauthenticated by design. The current tree has no such routes, but git history contains a full security dashboard and a credential API (DS-14), and the auth itself is a static shared token with no expiry/rotation. This is latent, not currently exploitable.

**Fix:** Remove the dead auth code or make it fail-closed (`SECURITY_ENABLED === 'true'` for auth, no demo bypass in production). Use a real session/JWT with expiry and constant-time comparison. Do not ship demo auth to production.

### DS-14 — Historical credential API and encrypted GPG file remain in git history

**Location:** Deleted `src/app/api/security/credentials/route.ts`, `src/app/api/security/audit-logs/route.ts`, `src/app/api/security/dashboard-data/route.ts`, `src/lib/security/credential-manager.ts`, `scripts/setup-credentials.ts`, `credentials/encrypted.gpg`.

**Why it matters:** The deleted `GET /api/security/credentials` decrypted and returned credentials to **any unauthenticated caller** when `GPG_KEY_ID` was configured. It was removed in the portfolio-optimization commits, so current HEAD does not serve it. The encrypted GPG blob is 553 bytes and is encrypted to a public key; no private key or passphrase was found in git history. A rollback to an old commit, or a stale old `next start` process, could re-expose the endpoint; the demo-mode auth (DS-13) would not stop it.

**Fix:** Keep the route deleted; rotate any credentials that were ever encrypted with that key; remove the old GPG key from the VPS if unused; ensure deploys cannot roll back to pre-deletion builds; consider purging the historical blob only if policy requires it (it is encrypted).

### DS-15 — Honeypot can drop legitimate messages and is trivially bypassed

**Location:** `src/components/shared/Forms/HoneypotField.tsx:6-30`, `src/app/api/contact/route.ts:119-123`.

**Why it matters:** The field is named `website`, is off-screen but present, and `autocomplete="off"` is not reliably honored by browser autofill/password managers. A legitimate visitor whose browser fills “website” gets a **silent success** and no email. Attackers simply omit the field, as the CSRF PoC does. This is a usability/availability issue, not a strong anti-bot control.

**Fix:** Use a randomized/obfuscated field name, `autocomplete="new-password"`/`one-time-code`, and timing/JS checks; more importantly, add CAPTCHA/Turnstile and keep the global/per-subnet quotas.

### DS-16 — HSTS and several headers exist only in the proxy

**Location:** `src/proxy.ts:210-222` (HSTS requires `request.nextUrl.protocol === 'https:'` or `x-forwarded-proto: https`); `next.config.ts:70-160` only sets XFO, nosniff, referrer, and cache rules.

**Why it matters:** If nginx does not set `X-Forwarded-Proto: https`, HSTS is never sent. Paths excluded by the matcher (DS-04) lose HSTS, COOP, Permissions-Policy, and CSP. `SECURITY.md` claims HSTS/HTTPS, but the header depends on proxy configuration.

**Fix:** Send HSTS at nginx (authoritative TLS terminator); add static security headers to `next.config.ts` for all routes; verify with `curl -sI https://idaromme.dk/ | grep -i strict`.

### DS-17 — Image optimizer has no request rate limit and accepts any Sanity project's images

**Location:** `next.config.ts:20-39`; `/_next/image` is excluded from the proxy (`proxy.ts:324`).

**Why it matters:** SVG is disabled, the disk cache is bounded at 256 MB, and source responses are capped at 10 MB (good). But an attacker can request many unique `cdn.sanity.io` image URLs, including images from a Sanity project they control, causing CPU decoding and cache churn. There is no rate limit. `remotePatterns` allows any project under `/images/**`, so the site can be used as a public image proxy for arbitrary Sanity content.

**Fix:** Restrict the pathname to the specific project ID (`/images/<projectId>/**`); add nginx `limit_req` for `/_next/image`; restrict `qualities`; consider a smaller `maximumDiskCacheSize` on the 2 GB VPS.

### DS-18 — PM2 logs are unbounded in-repo; image-optimizer errors fill them

**Location:** `ecosystem.config.js:31-33` (default PM2 logs, `merge_logs: true`, no rotation); `next.config.ts` has no log config; `SESSION_HANDOVER.md:153` says PM2 log rotation is outside the repo.

**Why it matters:** Next logs image-optimizer failures (`⨯ internal image response failed for ...`) for attacker-chosen URLs. `/_next/image` has no rate limit, so a flood can generate large logs. If `pm2-logrotate`/logrotate is not installed, the 2 GB VPS disk can fill, causing a full outage.

**Fix:** Install/configure `pm2-logrotate` (`max_size: 10M`, `retain: 14`, `compress: true`), configure nginx logrotate, monitor disk, and rate-limit `/_next/image`.

### DS-19 — `getClientIp` trusts `X-Real-IP` fallback; CDN/proxy changes can collapse clients

**Location:** `src/lib/clientIp.ts:19-27`; `SECURITY.md:92` (Cloudflare claim); DS-03 (direct origin).

**Why it matters:** The rightmost `X-Forwarded-For` hop is trustworthy **only if nginx appends `$remote_addr`**. If the app is reached directly (DS-03), the attacker controls both `X-Forwarded-For` and `X-Real-IP`. If a CDN is placed in front without nginx `real_ip` configuration, the rightmost hop becomes the CDN address, so all visitors share one bucket and the contact form can be globally 429'd by a small number of requests. `X-Real-IP` is accepted with no proxy validation.

**Fix:** Bind origin to loopback and firewall it; configure nginx `real_ip` for Cloudflare/any CDN; document the trusted proxy chain; remove the `X-Real-IP` fallback or validate it only from a trusted proxy.

### DS-20 — IndexNow public key allows external submissions; API has no body limit

**Location:** `src/app/api/indexnow/route.ts:7` (public key fallback), `31-49` (auth), `88-102` (`request.json()` unbounded), `GET` handler.

**Why it matters:** The IndexNow key is public by protocol design, so anyone can submit `idaromme.dk` URLs directly to IndexNow using the public key file; the route’s bearer secret only protects **our outbound** submissions. The authenticated API still has no body-size limit and returns provider error messages. This is SEO abuse/low-impact DoS, not a secret leak.

**Fix:** Treat the public key as public (it is); rate-limit the authenticated route; cap `request.json()` size; do not return raw provider errors to callers; optionally trigger IndexNow from a deploy/publish workflow only.

### DS-21 — CSP style/analytics breadth

**Location:** `src/proxy.ts:245-290` — `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `img-src ... https://*.googleusercontent.com`, `script-src ... https://analytics.idaromme.dk`.

**Why it matters:** `style-src 'unsafe-inline'` permits CSS injection if an HTML injection ever exists; `*.googleusercontent.com` is broader than needed; the analytics host is allowed on every path (including Studio). The script policy is otherwise strong (`nonce` + `strict-dynamic`, no `https:` fallback).

**Fix:** Remove unused `fonts.googleapis.com`/`*.googleusercontent.com` if possible; scope analytics to public pages; consider `style-src-attr 'none'`/hashes where practical; keep the strict script policy.

### DS-22 — Sitemap does not URL-encode CMS slugs; invalid dates

**Location:** `src/app/sitemap.ts:70-76`.

**Why it matters:** `project.slug` is interpolated raw into the sitemap URL. A manually edited slug containing `&`, `#`, `?`, or spaces produces malformed XML/URLs; an invalid `_updatedAt` yields `Invalid Date`. A CMS editor (trusted) can trigger this; not a remote injection because Next escapes XML, but it can break SEO.

**Fix:** `encodeURIComponent(project.slug)` and validate `_updatedAt` with `Number.isNaN(date.getTime())`.

### DS-23 — Dead service worker with cache logic

**Location:** `public/sw.js` (not registered anywhere in `src/`).

**Why it matters:** If someone later registers it, `handleRoute` caches every GET HTML response with `response.ok`, ignoring `Cache-Control: no-store`; `handleStaticAsset`/`handleChunk` also cache broadly. This would serve stale HTML and could retain old CSP/nonce-bearing pages. It is currently dead code.

**Fix:** Remove `public/sw.js` or, before registering it, make it respect `Cache-Control`/`Vary`, skip `/studio` and API routes, and add a versioned cache migration.

### DS-24 — Documentation and production drift

**Location:** `SESSION_HANDOVER.md` says production is on `654aaa5`; HEAD is `62272db`. `SECURITY.md:92` claims Cloudflare DDoS protection with no config in the repo. `docs/guides/SECURITY-DEPLOYMENT-GUIDE.md` still references the deleted GPG/security-dashboard system.

**Why it matters:** Security assumptions (Cloudflare, HSTS, rate limits, origin binding) may not match the actual deployment. Production may be missing the latest audit fixes (e.g., CSP-report media types). This is an operational risk, not a code vulnerability.

**Fix:** Verify the deployed commit (`git rev-parse HEAD` on the VPS), enable deployment proof in CI, and update the docs to the actual architecture.

---

## 6. Informational findings

### DS-25 — `next.config` build/console settings

**Location:** `next.config.ts:12-19` (`ignoreBuildErrors: true`), `next.config.ts:41-45` (`experimental.serverActions: {}`).

**Note:** `ignoreBuildErrors` is compensated by the deploy `test` job’s `npm run type-check`, but it means a build can succeed with type errors. `removeConsole` removes app `console.error`/`console.warn` in production, which suppresses the CSP/Resend/Sanity error logs the code relies on for monitoring. Server Actions are enabled but unused (no `'use server'` files), adding unnecessary surface.

**Fix:** Remove `ignoreBuildErrors`; keep type-check blocking; replace `removeConsole` with an explicit logger that preserves security events; remove `serverActions` if unused.

### DS-26 — CSP reporting is effectively unused

**Location:** `src/app/api/csp-report/route.ts`; `src/proxy.ts:291-295` (only adds `report-uri` if `CSP_REPORT_URI` is set); deploy does not set it.

**Note:** The endpoint is implemented, but production never sends reports. Even if it did, `removeConsole` strips the `console.error` logging. This is a monitoring gap, not a vulnerability.

**Fix:** Configure `CSP_REPORT_URI` to the endpoint and a persistent sink, or remove the endpoint; preserve security logs.

### DS-27 — Dead code with minor latent issues

**Location:** `src/components/ClientProjectContent.tsx` (unencoded slug in `fetch`), `src/components/forms/ContactForm.tsx` (legacy form without honeypot), `src/components/ProjectView.tsx` (can crash if a project has no images), `src/components/lazy/LazyContactForm.tsx`.

**Note:** None is used by the current public routes (the adaptive form and server-rendered project view are used). They are maintenance/consistency risks.

**Fix:** Remove dead components or bring them under the same validation/honeypot patterns before use.

### DS-28 — Dependency and CI tool pinning residuals

**Location:** `package.json` (`@sanity/cli` in `dependencies`), `scripts/audit-gate.js` (`npm audit --omit=dev` only), `.github/workflows/secret-scan.yml` (`gitleaks-version: 'latest'`), `lighthouse-ci.yml`/`performance-budget.yml` (`npm install -g @lhci/cli@0.12.0`), `dependabot.yml` (GitHub Actions only).

**Note:** `npm audit --omit=dev` reports 0 high/critical and 38 moderate; the only high/critical production advisories are covered by the expiring picomatch exception. Dev/build dependencies are not audited even though they execute during `next build` and can alter the deployed artifact. `gitleaks latest` and a 2023 Lighthouse CLI are mutable/old CI tools.

**Fix:** Audit build-time dev dependencies; move `@sanity/cli` to `devDependencies` if the Studio/build does not need it at runtime; pin gitleaks and Lighthouse; add npm Dependabot.

### DS-29 — Privacy/header hardening gaps

**Location:** `next.config.ts` (`X-DNS-Prefetch-Control: on`), no `Cross-Origin-Resource-Policy`; `layout.tsx` (no `manifest` link despite `public/manifest.json`).

**Note:** DNS prefetch can leak visited hostnames; images can be hotlinked; the manifest is unused. These are minor privacy/hardening issues.

**Fix:** Set `X-DNS-Prefetch-Control: off` if not needed; add `Cross-Origin-Resource-Policy: same-origin` for non-image assets; link the manifest if the PWA is intended.

### DS-30 — No crypto/wallet surface to review

**Note:** The repository contains no Bitcoin, wallet, signing, nonce, RPC, or on-chain code. There is no fund-loss or signature-verification logic to assess. Future crypto features should get a separate review with a threat model for key custody, signing, replay, and serialization.

---

## 7. Needs-validation checklist

These items are conditional and should be checked on the host/account, not from this repo. Do not port-scan or load-test production without authorization.

| # | Item | Command / check | Why it matters |
|---|---|---|---|
| V1 | Are the DS-02 keys still valid? | Resend dashboard, Sanity project tokens, Cloudinary API keys; compare creation/rotation dates | Escalate to Critical if unrotated |
| V2 | Is `:3001` publicly reachable? | On VPS: `ss -lntp \| grep 3001`; from an authorized host: `curl -D - http://<VPS_IP>:3001/api/health`; firewall rules | DS-03 / DS-19 |
| V3 | nginx body/rate/TLS/proxy config | `nginx -T \| grep -E 'client_max_body_size\|limit_req\|limit_conn\|proxy_set_header (X-Forwarded-For\|X-Real-IP\|X-Forwarded-Proto)\|ssl_protocols'` | DS-05/06/08/16/19 |
| V4 | Does production also serve `/studio/foo.png` without CSP? | `curl -sI https://idaromme.dk/studio/foo.png \| grep -i content-security-policy` | DS-04 |
| V5 | Is `analytics.idaromme.dk` owned/isolated and up to date? | DNS ownership, Umami version, TLS cert, access logs; test that `script.js` is not user-writable | DS-09 |
| V6 | Is the deploy user root? | GitHub `VULTR_USERNAME`; on VPS `id`, `sudo -l`, `/var/www` ownership, PM2 user | DS-11 |
| V7 | Is PM2 log rotation configured? | `pm2 list`, `pm2 conf pm2-logrotate`, `ls ~/.pm2/logs`, `df -h` | DS-18 |
| V8 | Is HSTS actually sent? | `curl -sI https://idaromme.dk/ \| grep -i strict-transport`; check nginx `add_header` | DS-16 |
| V9 | Is Cloudflare actually in front, and is the origin restricted to it? | DNS/ASN check; nginx `allow`/`deny`; firewall | DS-03 / DS-24 |
| V10 | Sanity token role and dataset visibility | Sanity manage → API tokens; dataset visibility (public/private), token role (Viewer/Editor) | DS-02 / content exposure |
| V11 | Deployed commit matches HEAD | On VPS: `git rev-parse HEAD`; compare to `62272db`/`654aaa5`; check deploy run | DS-24 |
| V12 | Does `npm ci --ignore-scripts` work for the production build? | Staging VPS: `npm ci --omit=dev --ignore-scripts`, start Next, load `/` and `/studio` | DS-11 fix validation |

---

## 8. Checked and OK (and prior-audit verification)

### 8.1 This review — checked and OK

- **JSON-LD / stored content:** every `dangerouslySetInnerHTML` JSON-LD sink uses `safeJsonLd` (`<`, `>`, `&`, U+2028/U+2029 escaped). Checked `page.tsx`, `projects/page.tsx`, `about/layout.tsx`, `contact/layout.tsx`, `project/[slug]/page.tsx`, `project-content.tsx`, `structured-data.tsx`.
- **Contact HTML:** `escapeHtml` runs in the correct order (amp first), `stripControlChars` removes CR/LF from the subject, and the raw `replyTo` is Zod-email-restricted. No email-header injection or HTML injection found.
- **Input validation:** Zod bounds name/email/message; 16 KB body check; slug regex `^[\p{L}\p{N}_.-]{1,200}$`; no GROQ interpolation (all Sanity queries parameterized).
- **IndexNow:** Bearer auth with `timingSafeEqual` after length check; host allowlist; 100-URL cap; fixed endpoints; 10 s outbound timeout.
- **Health:** public response is only `{"status":"healthy"|"unhealthy"}` with `Cache-Control: no-store`; Sanity check cached and single-flight.
- **CSP:** per-request 128-bit nonce via `crypto.getRandomValues`; `script-src` nonce + `strict-dynamic`, no `https:` fallback; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`. Nonce is forwarded on the request (`proxy.ts:43-47`) and read by the root layout.
- **Headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, `X-Permitted-Cross-Domain-Policies`, `X-Download-Options`, `X-XSS-Protection: 0`, HSTS when HTTPS is detected.
- **Cache:** no catch-all immutable rule; HTML is `private, no-cache, no-store`; APIs use short `s-maxage`; health is `no-store`.
- **Image optimizer:** `dangerouslyAllowSVG: false`, `maximumDiskCacheSize` 256 MB, `maximumResponseBody` 10 MB, `remotePatterns` only `cdn.sanity.io/images/**`; local path traversal returned 404; loopback remote URL returned 400; SVG URL returned 400.
- **Contact:** no CORS headers (good); exact JSON content check is the one flaw (DS-07); honeypot; per-IP + global caps; Resend timeout.
- **CSP report:** exact media-type allowlist, 8 KB nominal cap, 20/min, query/fragment stripping; no arbitrary keys logged.
- **No SSRF:** IndexNow destinations fixed; Sanity host fixed; image optimizer remote pattern restricted; no user-controlled server-side `fetch` target found.
- **No SQL/NoSQL injection:** no SQL; GROQ uses parameters.
- **No `eval`/`new Function`/shell execution in the app:** `child_process` only in local scripts, not request paths.
- **No client-side secret import:** no client component imports `src/sanity/client`; `SANITY_API_TOKEN` is server-only; `NEXT_PUBLIC_*` values are intended public.
- **Git history:** no private key blocks found in blobs; the exact DS-02 values are not in any commit; the old `credentials/encrypted.gpg` is public-key encrypted and no private key/passphrase was found.
- **Dependencies:** `next` 16.4.6, `sharp` 0.35.5, `zod` 4.6.7, `resend` 4.8.0; `npm audit --omit=dev` reports **0 high, 0 critical, 38 moderate**; the high/critical gate has one expiring picomatch exception.

### 8.2 Prior audit (`SECURITY-AUDIT-2026-11-15.md`) verification

| Prior ID | Status on HEAD | Evidence |
|---|---|---|
| SEC-01 (image RCE/SVG) | Fixed | `dangerouslyAllowSVG: false`, Next 16.4.6, Sharp 0.35.5 |
| SEC-02 (image DoS) | Mitigated | `maximumDiskCacheSize`, `maximumResponseBody`, narrow remote pattern; residual DS-17 |
| SEC-03 (JSON-LD breakout) | Fixed | `safeJsonLd` at every sink |
| SEC-04 (IndexNow abuse) | Fixed for API | Bearer auth, 100-URL cap, timeout; public key remains public by design |
| SEC-05 (contact abuse) | Partially fixed | Honeypot, 5/min, 30/h, timeout; residual DS-05/06/07 |
| SEC-06 (CSP log flood) | Mostly fixed | 8 KB, 20/min, exact content types, query stripping; logs stripped |
| SEC-07 (SSH host verification) | Fixed | `known_hosts`, fingerprint, `StrictHostKeyChecking=yes` |
| SEC-08 (mutable CI) | Mostly fixed | Actions pinned to SHAs; residual `gitleaks latest`/global npm tool (DS-28) |
| SEC-09 (audit gate) | Fixed for prod | `audit-gate.js` blocks high/critical; only prod deps (DS-28) |
| SEC-10 (catch-all caching) | Fixed | No catch-all; tests; HTML no-store |
| SEC-11 (nonce forwarding) | Fixed | Request headers forwarded; local header check |
| SEC-12 (broad script origins) | Fixed | No `https:`/`http:` fallback |
| SEC-13 (health info) | Fixed | Minimal body, no-store, cached |
| SEC-14 (email subject) | Fixed | `stripControlChars`; test |
| SEC-15 (privacy) | Fixed | `/privacy` page; residual analytics/Studio trust (DS-09) |

---

## 9. Prioritized remediation

### Today (before the next deploy)

1. **Rotate and remove the DS-02 credentials** (Sanity, Resend, Cloudinary); confirm the `.env.local` Sanity token role; delete/redact the doc; `chmod 600` any incident notes.
2. **Verify/fix origin binding and firewall** (DS-03): `next start -H 127.0.0.1`, block `:3001`, confirm nginx is the only public entry; re-check Cloudflare assumptions.
3. **Add upstream rate/concurrency limits** for `/project/`, `/api/projects/`, `/_next/image`, `/studio`, and `/api/contact`; negative-cache project 404s and add single-flight (DS-01, DS-17).
4. **Fix the matcher** (DS-04) and add tests for `/studio/*.png`, `/security/*.png`, and security headers; move static headers into `next.config`.
5. **Fix contact abuse** (DS-05/06/07/08): exact media type, CSRF/`Sec-Fetch-Site` or custom header, per-`/64` limits, CAPTCHA, body streaming/64 KB limit, separate global counter.

### This week

6. **Secret scanning** (DS-10): remove broad allowlists, scan Markdown/`.env`/workflows, run pre-commit in CI, pin gitleaks.
7. **Deploy hardening** (DS-11/12): `--ignore-scripts` or write env after install; non-root deploy user; backup/restore `node_modules`; health-gated rollback.
8. **Studio/analytics isolation** (DS-09): no analytics on `/studio`, separate Studio origin, remove analytics from Studio CSP.
9. **Monitoring/logs** (DS-16/18): nginx HSTS, PM2 logrotate, alert on restarts/disk/rate-limit spikes.
10. **Documentation/ops** (DS-24): update `SECURITY.md`, verify deployed commit, remove stale GPG/security-dashboard docs.

### Longer term

11. Remove dead code and unused Server Actions; remove `ignoreBuildErrors`; replace `removeConsole` with structured security logging.
12. Audit build-time dev dependencies; move `@sanity/cli` to dev; add npm Dependabot.
13. Consider a small edge/WAF with bot challenges for the contact form and project routes.
14. Re-run this audit after the fixes, including a host-side nginx/firewall review.

---

## 10. Appendix — evidence and commands

### 10.1 Local build and route checks

```bash
cd /home/mr/workspace/textile-showcase
npx next start -p 3999
curl -sI http://127.0.0.1:3999/studio
curl -sI http://127.0.0.1:3999/studio/foo.png
curl -sI http://127.0.0.1:3999/project/foo.png
```

Observed:

- `/studio` → 200 with CSP, nonce, HSTS? (local HTTP: no HSTS).
- `/studio/foo.png` → 200 **without CSP/nonce** (XFO/nosniff still present from `next.config`).
- `/project/foo.png` → 404 without CSP.

### 10.2 Project-route load check (local only)

```bash
before=$(ps -o rss= -p <next-server-pid> | tr -d ' ')
seq 1 100 | xargs -P 100 -I{} curl -s -o /dev/null "http://127.0.0.1:3999/project/loadtest-{}"
after=$(ps -o rss= -p <next-server-pid> | tr -d ' ')
```

Result: ~3 s, RSS **190 MB → 276 MB**. Same-URL requests also work because `null` is not cached.

### 10.3 Rate-limit eviction proof

```bash
NODE_ENV=test npx ts-node --compiler-options '{"module":"commonjs"}' -e "
import { checkRateLimit, rateLimitStore, RATE_LIMIT_MAX_KEYS } from './src/lib/rateLimit';
rateLimitStore.clear();
console.log('global first:', checkRateLimit('__contact_global__', {limit:30, windowMs:3600000}));
for (let i=0;i<RATE_LIMIT_MAX_KEYS;i++) checkRateLimit('ip-'+i);
console.log('size', rateLimitStore.size, 'global present after fill?', rateLimitStore.has('__contact_global__'));
console.log('global allowed again:', checkRateLimit('__contact_global__', {limit:30, windowMs:3600000}), 'count', rateLimitStore.get('__contact_global__')?.count);
"
```

Output:

```text
global first: true
size 10000 global present after fill? false
global allowed again: true count 1
```

### 10.4 CSRF/content-type proof (Playwright)

The local page on `127.0.0.1:4001` sent:

```js
fetch('http://127.0.0.1:3999/api/contact', {
  method: 'POST',
  mode: 'no-cors',
  headers: {'Content-Type': 'text/plain; application/json'},
  body: JSON.stringify({name:'CSRF Test',email:'csrf@example.com',message:'This is a cross-site contact form test message.'})
})
```

Playwright observed only `POST text/plain; application/json` (no OPTIONS) and `RES 503` (accepted; the local Resend key is unset). With a production key, this sends email.

### 10.5 Body-buffer proof

```bash
head -c 30000000 /dev/zero | tr '\0' 'a' > /tmp/big
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'Transfer-Encoding: chunked' \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/big \
  http://127.0.0.1:3999/api/contact
```

Result: `413`; Next logged `Request body exceeded 10MB ...`; RSS grew.

### 10.6 Dependency audit

```bash
npm ls next sharp resend zod
npm audit --omit=dev
```

Observed: `next@16.4.6`, `sharp@0.35.5`, `resend@4.8.0`, `zod@4.6.7`; production audit **0 high, 0 critical, 38 moderate** (Sanity CLI tooling; picomatch exception until 2026-12-15).

### 10.7 Git-history checks

- `git log -S '<doc secret>' --all` → 0 commits for each value (exact strings not committed).
- No `BEGIN PGP PRIVATE KEY` / `BEGIN OPENSSH PRIVATE KEY` / `BEGIN RSA PRIVATE KEY` blobs found.
- Deleted `credentials/encrypted.gpg`: 553 bytes, PGP public-key encrypted; recipient key ID is public; no private key or passphrase in history.
- Deleted `src/app/api/security/credentials/route.ts` exists only in history and is not served by HEAD.

### 10.8 Files reviewed (primary)

`src/proxy.ts`, `src/app/api/contact/route.ts`, `src/app/api/csp-report/route.ts`, `src/app/api/indexnow/route.ts`, `src/app/api/projects/*`, `src/pages/api/health.js`, `src/lib/{clientIp,rateLimit,honeypot,safeJsonLd}.ts`, `src/sanity/*`, `src/app/layout.tsx`, `src/app/(page|projects|project|about|contact|privacy)/*`, `src/app/components/*`, `src/components/**` (forms, gallery, project, UI), `src/utils/*`, `next.config.ts`, `ecosystem.config.js`, `scripts/deploy/vps-release.sh`, `.github/workflows/*`, `.gitleaks.toml`, `.pre-commit-config.yaml`, `SECURITY.md`, `SESSION_HANDOVER.md`, `docs/**`, `package.json`/`package-lock.json`.

---

## 11. Bottom line

- **No confirmed Critical RCE, fund-loss, or cryptographic flaw** exists in the current HEAD; the repository has no crypto/wallet logic.
- **The top three risks are:** (1) unauthenticated project-route amplification that can take the site down, (2) production-looking credentials in a world-readable local audit document, and (3) direct-origin exposure of Next.js on `:3001` if the firewall is open.
- **The most important defense-in-depth fix** is the proxy matcher/Studio CSP path (DS-04), followed by contact abuse controls (DS-05/06/07/08).
- **Verify the conditional items** in §7 on the host/account before treating the risk as closed.
