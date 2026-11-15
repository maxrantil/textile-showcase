# Read-only security audit — 2026-11-15

> **Status on master (added after the audit):** the audit read a stale branch, `perf/issue-429-font-weight-axis`.
> Current master already covers part of it. Next.js 16.4.6 and Sharp 0.35.5 landed in #440 (SEC-01 versions).
> Every JSON-LD sink uses `safeJsonLd` since #450 (SEC-03). The SSH host verification that #386 added was re-landed
> in #440 (SEC-07, recheck). #452/#453 turn SVG optimization off and bound the image cache and source size
> (SEC-01/SEC-02 config). Re-run the audit on master to check every other finding and the `npm audit` counts.

## Scope and method

Read-only review of the Next.js/Sanity source, tracked configuration, lockfile, CI/CD, and installed dependencies. No exploit attempts, production probes, builds, or test runs were performed. No `.env*` file was opened, and secret-pattern scans emitted only placeholders or masked prefixes. After the audit was complete, this report and the session handoff were written as documentation-only changes.

Overall risk: **Critical**. Next.js **16.1.6** and Sharp **0.34.5** are installed, the site is self-hosted on Linux, and SVG optimization is enabled. This exposes the public image optimizer to a critical RCE advisory and several DoS advisories. The production audit reports 54 vulnerabilities and the full audit reports 73, but many non-Next findings are CLI/build-time and were not found to be publicly reachable.

The audit used Next.js 16, not Next.js 15. `npx next info` reported 16.4.6 as the available upgrade at review time.

## Findings table

| ID | Severity | Title | File:line | Status |
|---|---|---|---|---|
| SEC-01 | Critical | Image-optimization RCE exposure with SVG enabled | `package-lock.json:20732-20760`, `package-lock.json:25542-25554`, `next.config.ts:20-35` | Confirmed |
| SEC-02 | High | Image optimizer exposed to disk, CPU, and memory exhaustion | `next.config.ts:20-33`, `ecosystem.config.js:22-23` | Confirmed |
| SEC-03 | Medium | CMS content can break out of JSON-LD script elements | `src/app/project/[slug]/page.tsx:48-60`, `src/app/project/[slug]/components/project-content.tsx:26-30`, `src/app/projects/page.tsx:151-193` | Confirmed |
| SEC-04 | Medium | Unauthenticated IndexNow submissions and outbound-request abuse | `src/app/api/indexnow/route.ts:72-123` | Confirmed |
| SEC-05 | Medium | Contact rate limiting depends on unverified proxy headers and weak anti-spam controls | `src/app/api/contact/route.ts:54-66`, `src/lib/rateLimit.ts:3-40` | Needs verification |
| SEC-06 | Low | CSP reporting permits log and request-body flooding | `src/app/api/csp-report/route.ts:20-50` | Confirmed |
| SEC-07 | Medium | Deployment lacks SSH host verification while sending production secrets | `.github/workflows/production-deploy.yml:150-169`, `.github/workflows/production-deploy.yml:202-214` | Confirmed |
| SEC-08 | Medium | CI executes mutable action tags and reusable workflows from `@master` | `.github/workflows/pr-validation.yml:15-66`, `.github/workflows/production-deploy.yml:164`, `.github/workflows/secret-scan.yml:16-18` | Confirmed |
| SEC-09 | Medium | Vulnerable production dependencies deploy through non-blocking security checks | `.github/workflows/production-deploy.yml:34-59`, `.github/workflows/security-monitoring.yml:13-61` | Confirmed |
| SEC-10 | Medium | Catch-all immutable caching may affect dynamic HTML and operational endpoints | `next.config.ts:117-152` | Needs verification |
| SEC-11 | Low | Generated CSP nonce is not explicitly forwarded into the render request | `src/proxy.ts:64-79`, `src/app/layout.tsx:43-45` | Needs verification |
| SEC-12 | Low | CSP permits arbitrary HTTP/HTTPS script origins in fallback browsers | `src/proxy.ts:231-247` | Confirmed |
| SEC-13 | Low | Public health endpoint exposes operational and security-status details | `src/pages/api/health.js:78-108` | Confirmed |
| SEC-14 | Low | Contact name reaches the email subject without control-character rejection | `src/app/api/contact/route.ts:20-50`, `src/app/api/contact/route.ts:99-104` | Needs verification |
| SEC-15 | Info | Analytics and contact-data processing lack an in-app privacy disclosure | `src/app/components/analytics-provider.tsx:15-47`, `src/lib/web-vitals.ts:67-101` | Confirmed |

## SEC-01 — Critical: image-optimization RCE exposure

Next.js 16.1.6 and Sharp 0.34.5 fall within:

- **GHSA-2464-fhr4-w9xw / CVE-2026-96889** — critical possible unauthenticated RCE in Next.js Image Optimization when SVG is processed on glibc-based Linux.
- **GHSA-wq5f-xc86-pv6w** — the underlying librsvg issue in Sharp before 0.35.5.
- Other Sharp libvips/libheif untrusted-image vulnerabilities.

`next.config.ts` enables `dangerouslyAllowSVG: true` and allows `https://cdn.sanity.io/images/**`. The image response CSP (`script-src 'none'; sandbox`) mitigates browser execution, not native server-side decoding. The host/path rule covers arbitrary Sanity projects, so an attacker can supply content hosted in a Sanity project they control rather than requiring access to this site's dataset.

An attacker can request a crafted external Sanity SVG through `/_next/image`. Under the advisory's runtime conditions, successful exploitation could execute code as the PM2 user and expose runtime credentials or alter the application. Production libc, Node PIE compilation, and host hardening were not inspected; this does not change the urgency of patching.

**Remediation:** Upgrade Next.js to **16.4.6+**, Sharp to **0.35.5+**, and the related Next packages consistently. Temporarily set `dangerouslyAllowSVG: false` until the patched deployment is verified. Verify Node is PIE-compiled and the VPS/OS libraries are supported. The critical Next advisory is patched in 16.4.1; 16.4.6 also covers later findings.

## SEC-02 — High: image-optimizer resource exhaustion

Applicable advisories:

| Advisory | Impact | Patched |
|---|---|---|
| GHSA-3x4c-7xq6-9pq8 | Unbounded `/_next/image` disk-cache growth | Next 16.1.7 |
| GHSA-q8wf-6r8g-63ch | CPU exhaustion through malicious remote images/SVG | Next 16.2.11 |
| GHSA-h64f-5h5j-jqjh | Large local images buffered without adequate size limit | Next 16.2.5 |

There is no `maximumDiskCacheSize`, `maximumResponseBody`, restricted `localPatterns`, or explicit `qualities` allowlist. `minimumCacheTTL` is one year. The PM2 process has `max_memory_restart: '400M'` and a 512 MB heap setting.

An unauthenticated attacker can request many unique Sanity URLs/transformation variants to fill `.next/cache/images`, while crafted sources consume native decoder CPU or memory. Disk exhaustion and repeated PM2 restarts can affect the portfolio and embedded Studio.

**Remediation:** Upgrade and configure limits appropriate to real assets, for example:

```ts
images: {
  dangerouslyAllowSVG: false,
  minimumCacheTTL: 86400,
  maximumDiskCacheSize: 256 * 1024 * 1024,
  maximumResponseBody: 10 * 1024 * 1024,
  qualities: [40, 75, 85],
  localPatterns: [{ pathname: '/images/**' }],
}
```

Retain the narrow Sanity `remotePatterns`, add Nginx throttling, and monitor cache/disk usage.

## SEC-03 — Medium: HTML-unsafe JSON-LD serialization

CMS-derived project data is rendered using raw `JSON.stringify` in `dangerouslySetInnerHTML`. JSON string escaping does not escape HTML raw-text closing tags: `</script>` remains meaningful to the HTML parser.

Affected sinks include project structured data, project breadcrumbs, and the `/projects` collection schema. A compromised/malicious CMS editor could save a title such as `</script><style>…</style>` to inject markup into visitors' pages. Inline styles are allowed by the CSP, enabling defacement/UI manipulation. A following script element is a stored-XSS attempt; modern `strict-dynamic` should block many such scripts, but the legacy fallback accepts arbitrary HTTP/HTTPS origins.

**Remediation:** Use one shared serializer for every JSON-LD sink and test `</script>`, `<style>`, ampersands, and Unicode line separators:

```ts
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
```

Use `serializeJsonLd(projectSchema)` in `dangerouslySetInnerHTML`. Also update `generateStructuredDataScript` so future dynamic data is safe by default.

## SEC-04 — Medium: unauthenticated IndexNow abuse

`POST /api/indexnow` has no authentication, rate limiting, URL-count limit, or outbound fetch timeout. Host validation restricts submitted URLs to `idaromme.dk`, and provider destinations are fixed, so this is not general SSRF. The public IndexNow key is intentionally public and is not a leaked secret.

An attacker can submit undesired/nonexistent same-domain paths, repeated batches, or very large URL arrays, manipulating crawl signals and consuming memory, bandwidth, and pending requests.

**Remediation:** Prefer invoking IndexNow only from a trusted publication/deployment workflow. Otherwise protect the trigger with a separate server-to-server secret (not the public protocol key), require HTTPS, validate against real project slugs, cap bodies and array sizes, deduplicate, rate-limit, and use `AbortSignal.timeout(10_000)` on outbound requests.

## SEC-05 — Medium: contact anti-abuse controls need proxy verification

The route uses the complete `x-forwarded-for` or `x-real-ip` value as a process-local five-per-minute rate-limit key. No CAPTCHA, Turnstile, honeypot, or persistent abuse service was found. PM2 currently uses one fork, so local state is not an immediate multi-instance problem.

If Nginx preserves attacker-supplied forwarding values, varying a header/prefix creates fresh buckets and permits Resend spam despite the limit. Distributed senders can also bypass any single-IP limit.

**Remediation:** Inspect live Nginx behavior and derive identity only from a trusted proxy chain or `$remote_addr`; do not accept arbitrary forwarding headers from direct clients. Add a honeypot or privacy-preserving challenge, global/per-network quotas, volume alerts, and an outbound Resend timeout. Move to shared rate-limit storage if scaling horizontally.

## SEC-06 — Low: CSP-report log flooding

Every parseable CSP report writes supplied URI/policy fields to the error log. There is no application-level rate limit, body/field-size validation, sampling, or expected-content-type check. Malformed requests also reach the error handler. PM2 writes log files; application-level rotation was not found.

Repeated small reports can consume log storage and obscure genuine CSP events. URI fields can also contain sensitive query strings.

**Remediation:** Cap request and field sizes, require the expected report media type, throttle and sample reports, redact queries/fragments, send events through bounded monitoring, and configure logrotate retention. Any Nginx body-size limit still needs external verification.

## SEC-07 — Medium: SSH host verification not enforced

The production `rsync` command explicitly sets `StrictHostKeyChecking=no` and `UserKnownHostsFile=/dev/null`. The subsequent `appleboy/ssh-action` does not supply the documented host `fingerprint`. Its remote script writes `RESEND_API_KEY` and other deployment settings.

A network/DNS attacker able to impersonate the VPS could intercept deployment information, disrupt releases, and potentially receive remote commands containing production credentials.

**Remediation:** Install an out-of-band-verified `known_hosts` entry and use `StrictHostKeyChecking=yes`. Configure `appleboy/ssh-action` with a verified SHA256 host fingerprint and `script_stop: true`. Do not establish trust with an unverified same-run `ssh-keyscan`.

## SEC-08 — Medium: mutable CI dependencies

The workflows use action tags such as `appleboy/ssh-action@v1.0.0` and reusable workflows such as `maxrantil/.github/...@master`. Some reusable jobs have PR/issue write permissions. Tools are also installed through ranges or unversioned resolution, including `npx audit-ci` and `@lhci/cli@0.12.x`.

Compromise of an upstream action/repository or mutable reference can execute arbitrary code in trusted CI, modify PRs/issues, steal credentials available to that job, or tamper with deployment.

**Remediation:** Pin actions and reusable workflows to reviewed full commit SHAs, automate controlled update PRs, and install exact tool versions through a lockfile/tool manifest. Set minimal permissions on every job, including deployment jobs. No `pull_request_target` usage was found.

## SEC-09 — Medium: non-blocking dependency security gates

The deployment and weekly monitoring jobs set `continue-on-error: true` and convert audit failure into echoed warnings.

| Command | Total | Low | Moderate | High | Critical |
|---|---:|---:|---:|---:|---:|
| `npm audit --omit=dev` | 54 | 5 | 22 | 24 | 3 |
| `npm audit` | 73 | 5 | 39 | 26 | 3 |

Reachability triage:

- **Next.js/Sharp:** publicly reachable through `/_next/image`; SEC-01/SEC-02.
- **Sanity CLI archive dependencies (`decompress`, `adm-zip`, `tar`):** no public archive-extraction route found; mainly local tooling exposure, but installed in production through peer dependencies.
- **Resend `deepmerge` chain:** current code sends a plain HTML string; no attacker-controlled object merge/React-email template path found.
- **Zod:** contact validates bounded strings, not the constrained collections in the advisory; still upgrade.
- **DOMPurify/Markdown-related Sanity packages:** primarily authenticated Studio exposure; no custom public Portable Text/Markdown renderer found.
- **Babel/Browserslist/glob/minimatch:** predominantly build/test-time inputs.
- **Form-data/follow-redirects:** no application file-upload or attacker-controlled redirect path found in the corresponding usage.

**Remediation:** Upgrade affected dependencies with compatibility testing, block unreviewed high/critical production vulnerabilities, use narrow expiring exceptions only after reachability review, and remove unnecessary production peers/tooling. Current Next.js and Sharp advisories have direct fixes and must not be treated as unfixable upstream issues.

## SEC-10 — Medium: catch-all immutable caching needs verification

`next.config.ts` assigns `Cache-Control: public, max-age=31536000, immutable` to `/(.*)`. Project APIs set shorter policies, but dynamic HTML, health, errors, and other endpoints may inherit the catch-all value.

If emitted as configured, caches can retain deployment-stale HTML, operational status, and errors for a year, and caching is at odds with per-request nonces. No authenticated personalized page was found, so current cross-user confidential disclosure is not claimed.

**Remediation:** Limit immutable caching to fingerprinted static assets, allow Next.js to control dynamic HTML caching, and use `no-store` for health/mutations/errors. **Verification required:** inspect actual production response headers because Next.js may override some dynamic defaults.

## SEC-11 — Low: CSP nonce propagation needs verification

The proxy sets `x-nonce` on the `NextResponse.next()` response, while the root layout reads it through `headers()`, which represents the render request. Next.js documents cloning incoming request headers, setting `x-nonce` and CSP there, then passing them with `NextResponse.next({ request: { headers } })`.

If runtime behavior follows this model, the layout and Umami receive no generated nonce and the enforcing CSP can block scripts. **Verification required:** compare the response-CSP nonce with framework/Umami script nonce properties and browser CSP reports. Existing E2E code asserts this expectation, but no tests were run in this audit.

Use the documented request-forwarding pattern and apply the nonce consistently to project JSON-LD scripts:

```ts
const requestHeaders = new Headers(request.headers)
requestHeaders.set('x-nonce', nonce)
requestHeaders.set('Content-Security-Policy', csp)
const response = NextResponse.next({ request: { headers: requestHeaders } })
response.headers.set('Content-Security-Policy', csp)
```

## SEC-12 — Low: broad fallback script origins

`script-src` contains `https: http:` alongside nonce/`strict-dynamic` and the explicit Umami host. Browsers without `strict-dynamic` support can use this broad fallback, permitting attacker-hosted scripts after an independent HTML/script injection primitive, including SEC-03.

Remove `http:` and unrestricted `https:`; keep `'self'`, the nonce, `strict-dynamic`, and the explicit analytics origin. Consider `X-XSS-Protection: 0` because the current legacy header offers no modern protection.

## SEC-13 — Low: health-check information disclosure

Unauthenticated `/api/health` exposes environment/version, process uptime, response time, heap usage, Sanity connectivity, security-service configuration status, and SSE configuration status. Each request also triggers a fresh Sanity request.

This helps reconnaissance, resource-exhaustion sizing, restart detection, and fingerprinting of security controls. Return only `{ "status": "ok" }` publicly. Put detailed readiness/metrics behind authentication or an internal listener, and cache/throttle external checks.

## SEC-14 — Low: possible email-subject injection

The name schema limits length and escapes HTML but does not reject CR/LF/NUL. The value is interpolated into `subject: New Contact Form Message from ${name}`. The email address itself is Zod-validated.

If Resend normalizes/rejects control characters, impact is limited to rejected messages or subject manipulation; otherwise header manipulation could be possible. **Verification required:** a non-delivering provider test must confirm behavior; no email was sent during the audit.

Use a fixed subject such as `New portfolio contact-form enquiry`, and validate names with `^[^\r\n\0]+$` to reject control characters.

## SEC-15 — Info: privacy disclosure gap

Production loads Umami automatically and emits interaction/web-vitals events. Contact submissions send name, email, and message content to Resend. No privacy/cookie/data-processing/retention notice was found in application routes or form UI.

The reviewed analytics calls do not send contact names, addresses, or messages to Umami; they contain interactions and performance measurements. Whether consent is required depends on actual Umami cookie/IP settings and jurisdiction; this is not a claim of a legal violation.

Add a clear notice covering Umami, Resend, Vultr, and Sanity processing, contact-message retention, and web-vitals purpose. Verify Umami cookie/IP anonymization and add consent if required.

## Checked and OK

### Secrets and configuration

- No hardcoded production API/private/deployment credential was found in tracked source/configuration; hits were test placeholders or false-positive prefixes.
- `.env*` is ignored and was not opened.
- `NEXT_PUBLIC_*` use is limited to public Sanity/Umami settings.
- The inspected browser bundle contains an environment-variable reference, not a literal Sanity token.
- Production browser source maps are not enabled and no `.map` files were found in existing `.next/static`.

### Sanity

- Public client uses `perspective: 'published'` and CDN.
- Slugs use `$slug` GROQ parameters, not interpolated query strings.
- No public preview, Draft Mode, webhook, or revalidation endpoint exists.
- Debug logging exposes public configuration and a boolean token-presence flag only.
- No custom public mutation API was found. Dataset visibility/token scope remain external checks.

### XSS and rendering

- Normal CMS fields use React text interpolation and are escaped.
- No application-level Portable Text/Markdown renderer or CMS-controlled arbitrary navigation URL sink was found.
- External Instagram links use `noopener noreferrer`.
- Inline CSS inputs are fixed local files/strings, not CMS/request content.
- No public SVG files were found under `public/`.

### Server-side behavior

- No server actions, user-selected rewrite destination, command execution, user-controlled filesystem path, or general outbound-host fetch was found.
- IndexNow destinations are fixed; proxy redirects are local; API error bodies avoid stack traces.
- No permissive `Access-Control-Allow-Origin` was found.

### HTTP security

- CSP is enforcing, with `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`.
- X-Frame-Options, nosniff, Referrer Policy, Permissions Policy, and conditional HSTS are configured.
- Image remote patterns have a specific host/path rather than a wildcard hostname, but SEC-01/SEC-02 still apply.

### Forms and privacy

- Contact uses server-side Zod validation, length limits, and HTML escaping for the email body.
- No direct contact-content logging was found.
- No first-party `Set-Cookie` behavior was found.
- Browser session storage holds gallery UI state, not contact PII or credentials.

### CI/dependencies/infrastructure

- The lockfile has registry integrity hashes and CI uses `npm ci`.
- No root install script was found; identified install scripts belong to expected native/build dependencies.
- No `pull_request_target` was found; several jobs have explicit limited permissions.
- No Dockerfile, Compose, Vercel config, or committed Nginx config exists to audit.
- Robots/sitemap expose only public project content and are not access controls.

## Prioritized remediation

1. Upgrade **Next.js 16.4.6+ and Sharp 0.35.5+**, disable SVG optimization until patched, and add image response/cache limits and Nginx throttling (SEC-01/SEC-02).
2. Upgrade remaining affected dependencies, rerun both audits, and block unreviewed high/critical production findings (SEC-09).
3. Centralize HTML-safe JSON-LD serialization, add closing-tag regression tests, and remove broad CSP script origins (SEC-03/SEC-12).
4. Protect/remove public IndexNow submission, add request/time limits, verify proxy-IP processing, strengthen contact anti-spam controls, and bound CSP reporting (SEC-04–SEC-06).
5. Restore SSH host verification and pin CI actions/reusable workflows/tools to immutable reviewed references (SEC-07/SEC-08).
6. Verify production cache headers and nonce propagation, then adjust header scope and request forwarding (SEC-10/SEC-11).
7. Minimize public health information, validate email subject controls, and document third-party data processing (SEC-13–SEC-15).

## Suggested next-session implementation order

1. Create a small dependency-security change on a feature branch: Next/Sharp plus matching Next tooling and SVG mitigation. Run the repository's required TDD/type/build checks.
2. Re-run `npm ls`, `npm audit --omit=dev`, and `npm audit`; record reachable findings and upgrade Sanity/Resend/Zod separately if breaking changes require it.
3. Add safe JSON-LD serialization and focused unit tests as a separate change.
4. Address IndexNow and public request-abuse controls.
5. Harden CI/CD and verify production response/proxy behavior without exposing environment values.
