# Security Audit Triage — 2026-11-21

**Inputs** (reports produced by other models; this document filters them):
- `SECURITY-AUDIT-2026-11-20-DeepSeek-V4.1-Flash.md` (DS-xx)
- `SECURITY-AUDIT-2026-11-20-GLM-5.3.md` (SEC2-xx)
- `SECURITY-AUDIT-2026-11-21-KIMI-K3.1-PRO.md`

**Target**: commit `62272db` (master)
**Method**: every claim re-checked against source and the installed Next.js 16.4.6; no production probing.

**Verdict**: no High or Critical issue survives. About 60 reported findings reduce to
1 Medium, 9 Low, and a short list of host-side checks.

## Facts that settled disputed claims

| Claim | Reality | Evidence |
|---|---|---|
| GLM: each `q=1..100` is a distinct image transform | False. Next 16 defaults `images.qualities` to `[75]` | `node_modules/next/dist/shared/lib/image-config.js:121` |
| GLM: chunked uploads of hundreds of MB | False. Next caps proxied bodies at 10 MB | `proxyClientMaxBodySize: 10485760` in `next/dist/server/config-shared.js` |
| DeepSeek: Next escapes sitemap XML | False. `<loc>${item.url}</loc>` is unescaped | `next/dist/build/webpack/loaders/metadata/resolve-route-data.js:112` |
| DeepSeek: credentials in the launch-prep doc are live | Resend key in the doc differs from the current `.env.local` (hash compare); likely rotated | local check |
| DeepSeek: after 10 OOM restarts PM2 gives up | False. `min_uptime: '10s'` only counts crashes within 10 s of start | `ecosystem.config.js` |

## Validated findings

### V-1 · Medium — One IP can lock the contact form for everyone, every hour

`src/app/api/contact/route.ts:146-155`, `src/lib/rateLimit.ts:14-16`. Per-IP limit is
5/min; the global limit is 30/hour and is counted before Resend is called, whether or not the
send succeeds. One IP exhausts the global budget in ~6 minutes; all real visitors then get 429
for the rest of the hour and the owner receives 30 spam emails. Repeatable hourly, no prerequisites.

PoC (local build, dummy `RESEND_API_KEY`):

```bash
for i in $(seq 1 31); do
  curl -s -o /dev/null -w "$i %{http_code}\n" -X POST http://127.0.0.1:3999/api/contact \
    -H 'Content-Type: application/json' \
    -d '{"name":"x","email":"a@example.com","message":"0123456789"}'
  sleep 12
done
# 1-30 reach the send step; 31 and every later request from any IP → 429
```

Fix: a challenge (Turnstile or proof-of-work). Smaller steps: flag/queue on global-limit hit
rather than rejecting everyone; group IPv6 by /64.

### V-2 · Low — Filling the rate-limit table evicts the global contact counter

`rateLimit.ts:27-44`. At 10,000 entries the oldest live entries are deleted, including
`__contact_global__`. Needs ~10,000 distinct IPs within 60 s (realistically a routed IPv6 /64).
Payoff: another 30 emails. Fix: store the global counter outside the evictable map; reject new
keys when full instead of evicting live ones.

### V-3 · Low — Content-type substring check allows cross-site posts

`route.ts:96-99` accepts any header containing `application/json`. `text/plain; application/json`
passes, yet browsers treat it as CORS-safelisted `text/plain`, so a cross-site `fetch` is sent
without preflight. Gain for an attacker: visitors' IPs (bypasses per-IP limit). Fix: compare the
media type before `;` exactly, as `csp-report` already does; add a regression test expecting 415.

### V-4 · Low — Image optimizer resizes images from any Sanity project

`next.config.ts:21-28` allows `cdn.sanity.io/images/**`. Anyone can proxy their own Sanity
project's images through `idaromme.dk/_next/image`. Bounded cost (16 widths, 1 quality, 256 MB
cache, 10 MB source). Fix: `pathname: '/images/<projectId>/production/**'`.

### V-5 · Low — CMS editor can inject XML into the sitemap

`src/app/sitemap.ts:72` interpolates `project.slug` raw; Next does not escape `<loc>`; the slug
field (`textileDesign.ts:76`) accepts any text. Requires Sanity write access; impact is SEO.
Fix: `encodeURIComponent(project.slug)` plus a slug regex rule in the schema.

### V-6 · Low (reliability) — Deploy can pair one commit's build with a newer commit's source

`production-deploy.yml:204` resets to `origin/master`, not `${{ github.sha }}`. If B merges while
A's run deploys, A's `.next` runs with B's lockfile, ecosystem config, `public/` and release
script. Kimi's "gate bypass" framing (High) is overstated — master writers already get B deployed.
The real risk is a broken production deploy. Fix: reset to `github.sha` and verify `HEAD`.

### V-7 · Low (reliability) — Failed `npm ci` leaves the site down

`vps-release.sh:25-33` deletes `node_modules` before the new install succeeds; recovery then
starts PM2 against a missing `node_modules/next/dist/bin/next`. Triggered only by a dependency
change plus a registry/install failure. Fix: `mv node_modules node_modules.old`, restore on failure.

### V-8 · Low — Image-suffix paths skip the proxy, including Studio

`src/proxy.ts:324` excludes any path ending in an image extension. `/studio/x.png` serves Studio
without CSP, HSTS, COOP or Permissions-Policy (XFO, nosniff, Referrer-Policy still come from
`next.config`). Defence-in-depth only. Fix: exclude asset prefixes (`images/`, `fonts/`, icon
files) instead of suffixes; test `/studio/x.png`.

### V-9 · Low — Nonexistent project slugs are never negatively cached

`dataFetcher.ts:151` caches only truthy results, so `/project/nope` costs 2–3 Sanity CDN queries
per request; the navigation result *is* cached, in a map with no size cap. DeepSeek's High rating
rests on a 190→276 MB RSS reading and the false PM2 claim above. Fix: short negative cache, cap
`QueryCache`, nginx `limit_req`.

### V-10 · Low, needs host check — Bodies are read fully before the size check

`contact/route.ts:107`, `csp-report/route.ts:123` read the whole body before the 16 KB / 8 KB
checks; chunked uploads skip the `Content-Length` check. Bounded by Next's 10 MB cap and likely
by nginx's default 1 MB. If `client_max_body_size` ≤ 1m, this becomes Info.

## Host checks (not verifiable from the repo)

```bash
ss -lntp | grep 3001         # 127.0.0.1 = fine; 0.0.0.0/:: → check ufw/Vultr firewall
nginx -T | grep -E 'client_max_body_size|limit_req|proxy_add_x_forwarded_for'
curl -sI https://idaromme.dk/ | grep -i strict-transport
```

If 3001 is reachable from the internet, DS-03 and DS-19 become real (forged `X-Forwarded-For`
bypasses per-IP limits). `args: 'start -H 127.0.0.1'` in `ecosystem.config.js` is free either way.

## Discarded or overstated

| Finding | Reason |
|---|---|
| DS-02 credentials in launch-prep doc | Gitignored, never committed, local single-user machine; Resend key already differs. Action: confirm old Sanity/Cloudinary keys revoked, redact the doc. Hygiene, not a vuln. |
| DS-03 port 3001 on 0.0.0.0 | Unverified; moved to host checks. |
| DS-09 analytics on `/studio` | Requires compromising the owner's own analytics host. Gating analytics off `/studio` is a cheap nice-to-have. |
| DS-10 / SEC2-06 gitleaks allowlists `docs/` | Config hygiene; the cited doc was never in git. |
| DS-11 `.env.local` written before `npm ci` | Install scripts run as the same user that runs the app with the key (agrees with Kimi's rejection). |
| DS-13 / SEC2-05 fail-open demo auth | Dead code, no routes behind it. Delete, nothing exploitable. |
| DS-14 / SEC2-04 GPG blob in history | Public-key encrypted; no private key anywhere; key ID is not a secret. |
| DS-15 honeypot | Usability; never the primary control. |
| DS-16 HSTS only in proxy | Settled by the curl check; nginx normally sets it. |
| DS-18 PM2 logs | Host operations. |
| DS-19 `X-Real-IP` fallback | `X-Forwarded-For` always present behind nginx; only matters if 3001 is exposed. |
| DS-20 / SEC2-11 IndexNow key | Public by protocol design. |
| DS-21 `style-src 'unsafe-inline'` | Accepted decision (2025-11-19). |
| DS-23 / SEC2-07 `public/sw.js` | Never registered. |
| DS-24–30, SEC2-08/09/10 | Informational: `ignoreBuildErrors`, dependency placement, CLI-only moderate advisories, doc drift. |
| Kimi: audit-gate exceptions by advisory ID | Real but minor; the one exception expires 2026-12-15. Info. |
| Kimi: `run-sandboxed.sh`, `consolidate.py`, `write-reports.py` | Bugs in audit tooling (`scripts/security-audit/`), not the site. |
| Kimi: Sanity retries don't cancel | Bounded retries. Info. |
| Kimi: Lighthouse CI leads | GitHub withholds secrets from fork PRs; no reachable path shown. |
| GLM: quality-axis multiplication | False on Next 16. |
| Crypto/wallet surface | Does not exist (all three reports agree). |

## Suggested order

1. V-1 + V-3 together (contact form).
2. One-line fixes: V-4, V-5, V-6, V-8.
3. V-2, V-7, V-9.
4. Run the host checks; close or escalate V-10, DS-03, DS-19.
