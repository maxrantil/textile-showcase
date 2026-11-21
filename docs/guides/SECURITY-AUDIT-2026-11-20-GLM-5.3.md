# Security Audit — 2026-11-20 — GLM-5.3

> **Auditor:** GLM-5.3 (numes/z-ai/glm-5.3:free), full defensive audit requested by Doctor Hubert.
> **Target:** `textile-showcase` @ commit `62272db` (master, clean worktree except this report and an unrelated untracked audit file).
> **Method:** Read-only source review of all server-side attack surface, configuration, CI/CD, git history, and lockfile; local execution limited to the repository's own unit tests (`rateLimit`, `clientIp`, `safeJsonLd` — 13/13 pass) and `npm audit` (registry query only). No production probing, no exploits executed, no `.env*` values read (variable *names* only were enumerated to confirm no unexpected secrets are expected in the environment).

---

## 1. Executive Summary

**Overall risk: Medium.** No Critical or High findings remain in the current HEAD. The 2026-11-15 audit (SEC-01..SEC-15) drove real fixes; I independently verified all of them **hold** (see §5). What remains:

- **2 Medium findings** — both about unauthenticated abuse of the two "engines" the site exposes to the internet: the Next.js image optimizer (accepts images from *any* Sanity project, not just this site's) and the request-body handling of the public JSON endpoints (the 16 KB / 8 KB size caps are enforced **after** the full body is buffered in memory, and a chunked request can skip the Content-Length pre-check).
- **3 Low findings** — proxy-chain trust assumptions, a GPG-encrypted credentials blob left in public git history together with a historical fail-open credential-disclosure API (deleted from HEAD in Oct 2025, but the ciphertext is still cloneable), and the fail-open/non-constant-time authorization scaffolding still sitting in `src/proxy.ts`.
- Several informational items.

Both Medium findings are **cheap to fix at the source** and neither yields RCE, auth bypass, or data disclosure on its own; worst realistic case is resource exhaustion on the 2 GB VPS and using `idaromme.dk` as an image proxy for third-party content.

**Severity summary**

| ID | Severity | Title | Confidence |
|---|---|---|---|
| SEC2-01 | Medium | Image optimizer proxies/transforms images from **any** Sanity project | Confirmed (config) |
| SEC2-02 | Medium | Body-size caps enforced after full in-memory buffering; chunked bodies bypass Content-Length pre-check | Needs validation (nginx) |
| SEC2-03 | Low | Rate-limit IP derivation trusts the proxy chain; forgeable if port 3001 is directly reachable | Needs validation (firewall/nginx) |
| SEC2-04 | Low | GPG credential ciphertext in git history + historical unauthenticated credential-decryption API (deleted 2025-10-05) | Confirmed (history) |
| SEC2-05 | Low | `proxy.ts` security-route auth is fail-open by default and non-constant-time (dead code in HEAD) | Confirmed |
| SEC2-06 | Info | Gitleaks allowlist exempts `docs/` and `.github/workflows/` from secret scanning | Confirmed |
| SEC2-07 | Info | Unregistered `public/sw.js` shipped (dead code, unvalidated `warmCache` postMessage) | Confirmed |
| SEC2-08 | Info | `typescript.ignoreBuildErrors: true` in production builds | Confirmed |
| SEC2-09 | Info | 15 moderate npm advisories in production deps (Sanity CLI/oclif chain, CLI-time only) | Confirmed |
| SEC2-10 | Info | Studio toolchain in production `dependencies` (installed on the VPS unnecessarily) | Confirmed |
| SEC2-11 | Info | IndexNow GET discloses key/endpoint map (public by design); POST disabled in prod | Confirmed |

---

## 2. Architecture and Trust Boundaries

```
Internet ──HTTPS──> nginx (TLS, reverse proxy; config NOT in this repo)
                        │ HTTP :3001, X-Forwarded-For/$remote_addr, X-Forwarded-Proto
                        ▼
                 Next.js 16.4.6 (next start, PM2 fork, 1 instance, 800M restart cap)
                   ├── src/proxy.ts (middleware: CSP nonce, security headers, dead /security auth)
                   ├── App Router pages (RSC, static/dynamic; CMS data via Sanity)
                   ├── /api/contact        (public POST → Resend email)   ← unauthenticated
                   ├── /api/csp-report     (public POST → console log)    ← unauthenticated
                   ├── /api/indexnow       (POST: bearer-secret gated; GET: public info)
                   ├── /api/projects[/slug][/slugs] (public GET → Sanity CDN read)
                   ├── /api/health         (public GET, cached 30s Sanity ping)
                   ├── /_next/image        (public image optimizer → sharp, cdn.sanity.io)
                   └── /studio/**          (Sanity Studio, client-only, Sanity's own auth)
```

**Trust boundaries crossed by unauthenticated input:**
1. HTTP request → route handlers (`contact`, `csp-report`, `indexnow`, `projects/[slug]` slug param, `/_next/image` URL/width/quality params).
2. HTTP headers → middleware (CSP nonce per request; `x-forwarded-proto` for HSTS) and rate-limit keying (`x-forwarded-for` rightmost hop, `x-real-ip`).
3. CMS content (Sanity) → HTML/JSON-LD rendering (curated by the artist; a compromised Sanity account is a content-injection principal).
4. CI (GitHub Actions, master push) → VPS over SSH (pinned SHAs, host-key verification, production environment secrets).

**Principals:** anonymous internet user (primary attacker), repo reader (public history), CMS editor (trusted-ish), deploy secret holder (GitHub `production` environment), VPS local user.

**Not applicable to this codebase** (checked, absent): wallet/fund logic, signature verification, auth nonces/sessions (no login exists; the only "nonce" is the per-request CSP nonce, which is not an auth token), RPC endpoints, state machines, file uploads, databases (read-only CDN client), server actions with mutations.

---

## 3. Findings — Medium

### SEC2-01 — Medium: `/_next/image` fetches and transforms images from **any** Sanity project (open image proxy / resource abuse)

- **Location:** `next.config.ts:20-40` (`images.remotePatterns`), specifically lines 21-28.
- **Access assumption:** fully unauthenticated, internet-reachable (`/_next/image` is public on a portfolio site).
- **Root cause:** `remotePatterns` matches on hostname and path prefix only:
  ```ts
  remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', port: '', pathname: '/images/**' }]
  ```
  The path `/images/**` does **not** pin the project ID or dataset. Sanity's CDN serves every project at `https://cdn.sanity.io/images/<projectId>/<dataset>/...`, and free Sanity accounts can be created by anyone. Additionally, no `qualities` allowlist is configured, so every `q=1..100` value is a distinct accepted transform, and no `localPatterns` restriction exists.
- **Attack scenario and impact:**
  1. *Content laundering:* an attacker hosts arbitrary images in their own Sanity project and serves them through `https://idaromme.dk/_next/image?url=...&w=...&q=...` — the artist's domain, bandwidth (2 GB VPS), and reputation become a free proxy for third-party content (e.g., images for phishing pages that look "hosted" by a legitimate Swedish design studio).
  2. *CPU/memory/bandwidth abuse:* each unique (url, w, q) is an uncached sharp transform (up to the 10 MB `maximumResponseBody` source size). Sharp work runs on the libuv threadpool; a modest request rate degrades the site on a 2 GB single-instance VPS. The 256 MB disk cache is LRU-bounded (good), but the *transform work* and *outbound fetches* are not bounded by client identity in any way.
- **PoC** (owner-validated, on a staging copy or with explicit consent — not executed by this audit):
  ```bash
  # Attacker's own free Sanity project "xxxxxxxx" (any project ID works):
  curl -s -o /dev/null -w "%{http_code} %{size_download}\n" \
    "https://idaromme.dk/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2FATTACKER_PROJECT%2Fproduction%2FSOMEIMAGE-300x200-png.png&w=1080&q=75"
  # A 200 with image bytes from a foreign project confirms the proxy behavior.
  # Quality-axis multiplication (each q creates new cache+transform work):
  for q in 1 2 3 ... 100; do curl "…&w=3840&q=$q" >/dev/null & done
  ```
- **Suggested fix (smallest effective):** pin the remote pattern to this project's assets and cap the quality axis:
  ```ts
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'cdn.sanity.io',
      pathname: `/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}/**`,
    }],
    qualities: [70, 80],          // stop the q-axis cache/transform multiplication
    localPatterns: [{ pathname: '/images/**' }, { pathname: '/icons/**' }],
  }
  ```
  Optionally throttle `/_next/image` at nginx (`limit_req`), which also helps SEC2-02.

---

### SEC2-02 — Medium: request-body size caps are enforced **after** buffering the whole body; chunked transfer bypasses the Content-Length pre-check *(needs validation)*

- **Location:**
  - `src/app/api/contact/route.ts:101-110` — Content-Length check (101-104), then `const raw = await request.text()` (107), then `raw.length > MAX_BODY_BYTES` (108-110).
  - `src/app/api/csp-report/route.ts:117-126` — identical pattern.
  - `src/app/api/indexnow/route.ts:102` — `await request.json()` with no size cap at all (auth-gated by `INDEXNOW_API_SECRET`, and unconfigured in production → 503, so exposure is conditional).
- **Access assumption:** unauthenticated, internet-reachable (contact + csp-report). Next.js App Router route handlers impose no built-in body-size limit (that limit applies to Server Actions).
- **Root cause:** `Request.text()` reads the entire body into a single JS string **before** the length comparison rejects it. The `Content-Length` pre-check only inspects a client-supplied header; sending `Transfer-Encoding: chunked` (no Content-Length) skips it entirely, so the "16 KB cap" never prevents a multi-hundred-MB allocation — it only rejects *after* the memory is already consumed.
- **Attack scenario and impact:** on the 2 GB VPS (PM2 `max_memory_restart: '800M'`), a handful of concurrent chunked uploads (e.g., 5 × 300 MB) pushes RSS past 800 MB → PM2 kills and restarts the process. Repeat cheaply → restart loop → effective unauthenticated denial of service. **Force multiplier:** every restart wipes the in-memory rate-limit store (`src/lib/rateLimit.ts`) *including the 30/hour global contact-form mail cap*, so crash-restart cycling also re-arms the spam budget. The same process hosts the embedded Studio.
- **Deployment dependency (why "needs validation"):** the nginx front end is not in this repo. nginx's default `client_max_body_size` is 1 MB, which would neutralize this — but many real configs raise it, and if the VPS firewall ever exposes port 3001 directly (SEC2-03), there is no cap at all. **Validation plan (owner):** `curl -X POST -H "Transfer-Encoding: chunked" -H "Content-Type: application/json" --data-binary @50MBfile https://idaromme.dk/api/csp-report -w "%{http_code}"` from an authorized host, or inspect `client_max_body_size` in the vps-infra nginx config.
- **Suggested fix (smallest effective):** enforce the cap while streaming, before full buffering — read the body as a stream and abort once `MAX_BODY_BYTES` is exceeded:
  ```ts
  async function readBoundedBody(request: NextRequest, maxBytes: number): Promise<string> {
    const reader = request.body?.getReader()
    if (!reader) return ''
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) throw new BodyTooLargeError()   // → 413, body never fully buffered
      chunks.push(value)
    }
    return new TextDecoder().decode(concat(chunks))
  }
  ```
  Apply in `contact` and `csp-report` (and cap `indexnow`'s `request.json()` the same way). Additionally document and enforce `client_max_body_size 32k;`-class limits in nginx for these routes so the proxy rejects before Node allocates.

---

## 4. Findings — Low

### SEC2-03 — Low: rate-limit identity and HSTS gating trust headers that are only trustworthy behind exactly one nginx hop *(needs validation)*

- **Location:** `src/lib/clientIp.ts:19-28`; `src/proxy.ts:212-220`.
- **Access assumption:** unauthenticated attacker; **exploitability requires** that requests can reach Node on port 3001 without passing through the documented nginx hop (firewall gap, extra uncontrolled proxy in chain, or nginx configured with `proxy_set_header X-Forwarded-For $http_x_forwarded_for` instead of `proxy_add_x_forwarded_for`).
- **Root cause:** `getClientIp` takes the **rightmost** `X-Forwarded-For` entry (correct for one appending proxy) and falls back to `x-real-ip`. Both are plain request headers; if no trusted proxy appended `$remote_addr` after them, the client controls the entire value. The same trust assumption gates HSTS (`x-forwarded-proto`), though faking it on plain HTTP responses is ignored by browsers, so HSTS itself is not exploitable.
- **Attack scenario and impact:** per-IP rate limits on `/api/contact` (5/min) and `/api/csp-report` (20/min) become bypassable by rotating a forged header (`X-Forwarded-For: 1.2.3.4, …`). Mitigating backstop: the **global** 30/hour contact cap and honeypot still apply, and email destination/sender are fixed, so the worst case is mail-quota spam within that global cap and unbounded (but tiny) csp-report log lines. This is a topology risk, not a code bug — the code is correct *for the documented topology*.
- **Validation plan (owner):** from an external host, `curl -H "X-Forwarded-For: 6.6.6.6" https://idaromme.dk/api/health` and check whether PM2 logs/limits key on 6.6.6.6 or the real IP; verify `nftables`/Vultr firewall blocks 3001 from the internet; verify nginx uses `proxy_add_x_forwarded_for`.
- **Suggested fix:** have nginx set a header Node can trust exclusively (e.g., `proxy_set_header X-Real-Client $remote_addr;`) and key on that alone; or use `request.headers.get('x-forwarded-for')` only when a shared secret header from nginx is present. Defense in depth: keep the global caps (they already exist).

### SEC2-04 — Low: GPG credential ciphertext in public git history + a historical fail-open credential-decryption API existed on master for 3 weeks

- **Location (history):**
  - `credentials/encrypted.gpg` — a real PGP public-key-encrypted blob, added in `94d8c29`/`2538562` (2025-09-14), untracked by `53a81bd` (2025-10-05). **Still retrievable from any clone.**
  - `src/app/api/security/credentials/route.ts` (historical, deleted in `fd3754c`, 2025-10-05): `GET` returned **decrypted credentials as JSON** (`data: credentials`), gated only by the middleware that runs in "demo mode" (auth disabled) unless `SECURITY_ENABLED === 'true'` — and production sets `SECURITY_ENABLED=false`.
  - `docs/guides/SECURITY-DEPLOYMENT-GUIDE.md:119` — documents the decryption key ID `GPG_KEY_ID=F56A39322E4C0B344629481D75E79ABA2214B9BC` in a tracked file.
- **Access assumption:** anyone who can clone the repository (the repo is presented as publicly viewable; CLAUDE.md addresses "public viewers"). Exploiting the ciphertext additionally requires the corresponding GPG private key (and its passphrase).
- **Root cause:** a GPG-based credential store was committed, including its ciphertext, while the decrypting API's *default* configuration was fail-open. Both were later removed, but git history is immutable without a rewrite, and the committed `logs/credential-access.log` from that era shows only test failures (no plaintext secret was found in history — I scanned all revisions for Resend/Sanity key patterns; matches were base64 image noise in `docs/lighthouse-archives/`).
- **Attack scenario and impact:** offline, an attacker in possession of the developer's GPG private key (compromised machine, weak passphrase, brute-force) decrypts `credentials/encrypted.gpg` from history. If that blob ever contained the live `RESEND_API_KEY` (the commit message of `94d8c29` says it replaced "dummy credentials" for the working contact form, which suggests real values were encrypted), the attacker can send email as `contact@idaromme.dk` (phishing under the studio's identity) and read the Sanity dataset if a token was stored.
- **PoC (trivial):** `git cat-file -p 2538562:credentials/encrypted.gpg` in any clone yields the ciphertext.
- **Suggested fix:**
  1. **Rotate** `RESEND_API_KEY` (and any other key that may have been GPG-encrypted then) — cheap and removes all doubt.
  2. Remove the GPG key ID from `docs/guides/SECURITY-DEPLOYMENT-GUIDE.md`.
  3. Optionally purge `credentials/encrypted.gpg` from history (BFG/git-filter-repo) if the repo stays public.
  4. Confirm no stale deployment built between 2025-09-14 and 2025-10-05 is still serving the old code with `SECURITY_ENABLED=false` **and** a GPG key present (only then was the endpoint live; on the public deploy neither condition held, per the deploy workflow).

### SEC2-05 — Low: `proxy.ts` security-route authorization is fail-open by default, non-constant-time, and redirects to nonexistent pages (dead code — reintroduction hazard)

- **Location:** `src/proxy.ts:33-34` (`isDemoMode = process.env.SECURITY_ENABLED !== 'true'`), `:57-78` (auth path), `:119-142` (`validateAuthToken`: `token === validToken` plain comparison; `token.includes('expired')`), `:69` (redirect to `/auth/login`, which does not exist in HEAD).
- **Access assumption:** not currently reachable — no `/security` routes exist in HEAD; the code protects nothing today. The finding is a **landmine**: the scaffolding is one PR away from being live again.
- **Root cause:** authorization defaults to *open* when an env var is unset (fail-open), the bearer-token comparison is `===` (timing side channel against `VALID_AUTH_TOKEN`), and demo/test logic (`'expired'` substring check) is in a production code path.
- **Attack scenario (if reintroduced):** an unauthenticated user reaches any new `/security` route because nobody set `SECURITY_ENABLED=true` on the box; or a patient remote attacker recovers `VALID_AUTH_TOKEN` byte-by-byte via timing on the `===` comparison (practicality varies by network jitter — mark as needs-validation if it ever goes live).
- **Suggested fix:** delete the dead auth scaffolding entirely (the routes it guarded are gone), or if it returns: default to fail-closed (`isProductionMode = process.env.SECURITY_ENABLED === 'true'` → deny when unset), compare with `crypto.timingSafeEqual` on length-checked buffers (as `api/indexnow` already does correctly), and drop the demo-token logic.

---

## 5. Findings — Informational

| ID | Location | Observation |
|---|---|---|
| SEC2-06 | `.gitleaks.toml` `allowlist.paths` | Whole `docs/` and `.github/workflows/` trees are exempt from secret scanning. A secret pasted into a doc (like the GPG key ID in SEC2-04) or hardcoded into a workflow value is invisible to the scanner. Narrow the allowlist to specific files/patterns. |
| SEC2-07 | `public/sw.js` | Service worker is served at `/sw.js` but never registered anywhere in `src/`. Its `message` handler runs `warmCache(urls)` → `cache.addAll()` on arbitrary postMessage URLs without origin validation. Harmless while unregistered; delete it or register it deliberately and validate `warmCache` inputs to same-origin paths. |
| SEC2-08 | `next.config.ts:16-19` | `typescript.ignoreBuildErrors: true` lets type errors ship to production; type-safety regressions in validation logic would not block a deploy. |
| SEC2-09 | `package-lock.json` (verified via `npm audit --omit=dev`) | 15 moderate advisories, all in the Sanity CLI/oclif toolchain (`@sanity/cli`, `@oclif/core`, picomatch GHSA-fc5q-39xc-vjpf covered by the dated exception in `.github/audit-exceptions.json`). CLI/build-time only — no visitor-reachable path loads them. `audit-gate.js` correctly blocks high/critical and enforces exception expiry. |
| SEC2-10 | `package.json` dependencies | `sanity`, `@sanity/cli`, `@sanity/vision`, `styled-components` are production `dependencies`, so `npm ci --omit=dev` installs the whole studio toolchain on the 2 GB VPS. The Studio is a client-side bundle built at CI time; these could be devDependencies, shrinking the VPS install/attack surface. |
| SEC2-11 | `src/app/api/indexnow/route.ts:176-183` | `GET /api/indexnow` discloses the IndexNow key and endpoint map. The key is public by IndexNow design (served at `/indexnow-idaromme.txt`), and `POST` is correctly bearer-gated (503 in prod since `INDEXNOW_API_SECRET` is not set in the deploy env). No action strictly required; consider removing the GET entirely. |

**Minor notes (no action expected):** `X-DNS-Prefetch-Control: on` and the global `Link: <…cdn.sanity.io…>; rel=preconnect` header also land on API responses (harmless); the rate-limit `Map` insertion-order eviction is fine for a single PM2 fork; `evictIfFull` is only called on the `!entry` path (expired entries replaced in place never trigger eviction — a bounded-store nit, not exploitable); the CSP `style-src 'unsafe-inline'` trade-off is documented and accepted (2025-11-19 decision doc).

---

## 6. Verified — prior audit (2026-11-15) remediations that HOLD at this commit

| Prior ID | Remediation verified |
|---|---|
| SEC-01/02 | `next 16.4.6`, `sharp 0.35.5` in lockfile; `dangerouslyAllowSVG: false`; `maximumDiskCacheSize` 256 MB; `maximumResponseBody` 10 MB (`next.config.ts:34-38`). Residual proxy abuse → **SEC2-01**. |
| SEC-03 | All 10 JSON-LD `dangerouslySetInnerHTML` sinks route through `safeJsonLd` (grep-verified every occurrence in `src/app/**`); the 2 CSS sinks render fixed local strings; `safeJsonLd` unit tests pass (escapes `<`, `>`, `&`, U+2028/29). |
| SEC-04 | IndexNow POST requires `INDEXNOW_API_SECRET` (timing-safe compare), 10 s `AbortSignal.timeout`, ≤100 URLs, host-validated URL list, dedup. |
| SEC-05 | Client IP now the **rightmost** XFF hop (correct for one appending proxy — residual topology risk → **SEC2-03**); honeypot field added; global 30/hr mail cap; 10 s Resend timeout. |
| SEC-06 | CSP-report: 20/min rate limit, 8 KB body cap, 10-reports/request cap, 512-char field cap, query/fragment stripped from URIs, content-type allowlist (residual buffering → **SEC2-02**). |
| SEC-07 | Deploy uses `VULTR_KNOWN_HOSTS` + `VULTR_HOST_FINGERPRINT`, both required, `StrictHostKeyChecking=yes`, appleboy fingerprint pin. |
| SEC-08 | All actions and reusable workflows pinned to full commit SHAs (incl. `maxrantil/.github` reusable workflows). |
| SEC-09 | `scripts/audit-gate.js` blocks high/critical with expiring, justified exceptions; current prod audit: 0 high/critical. |
| SEC-10 | Catch-all `immutable` cache removed; scoped rules for `/images/*`, `/fonts/*`, icon files only. |
| SEC-11 | Nonce forwarded via `NextResponse.next({ request: { headers } })`; root layout reads `x-nonce` via `headers()`. |
| SEC-12 | No `https:`/`http:` scheme fallback in `script-src`; nonce + `strict-dynamic` + explicit analytics origin only. |
| SEC-13 | `/api/health` returns only `{status}`, no-store, Sanity check cached 30 s and de-duplicated. |
| SEC-14 | Email subject built from `stripControlChars(name)` (CRLF/NUL removed); `replyTo` is Zod-email-validated. |
| SEC-15 | `/privacy` page exists; Umami events carry interaction/performance data only (no PII in tracked events). |

**Additionally checked and OK in this audit:** no secrets in tracked files or any git revision (beyond the encrypted SEC2-04 blob); `.env*` gitignored and never committed; `SANITY_API_TOKEN` reachable only from server modules (no client component imports `@/sanity/*`; the studio page imports the token-free root `sanity.config.ts`); GROQ queries use `$slug` parameters (no interpolation); slugs validated against `^[\p{L}\p{N}_.-]{1,200}$` before querying; contact email HTML-escaped with fixed `from`/`to`; CSP is enforcing with `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`; no `pull_request_target` anywhere; CI tokens least-privilege; deploy concurrency-serialized with rollback; Resend disabled cleanly (503) when the key is absent.

---

## 7. Coverage Statement and Limitations

- **Covered:** every file under `src/app/api/**`, `src/pages/api/**`, `src/proxy.ts`, `src/lib/**`, `src/sanity/**`, `src/utils/**` (validation/image/analytics), all `dangerouslySetInnerHTML` sinks, `next.config.ts`, `ecosystem.config.js`, all 10 GitHub workflows, deploy scripts, `public/` assets, gitleaks config, full git history for credential-shaped artifacts, and the dependency lockfile (`npm audit`).
- **Not verifiable from this repository** (flagged inline as *needs validation*): the nginx reverse-proxy configuration and VPS firewall (SEC2-02, SEC2-03), whether the historical GPG blob ever contained live keys (SEC2-04 — hence rotation is the safe answer), and whether any pre-2025-10-05 build is still running anywhere.
- One run does not exhaust a target; this audit deliberately re-checked the prior audit's fixes and dug into git history and CI, which the prior audit covered more lightly. No live testing was performed against idaromme.dk.
