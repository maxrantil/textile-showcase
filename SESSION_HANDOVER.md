# Session Handoff: Security hardening, dependency updates & cleanup

**Date**: 2026-11-06
**Issue**: none (broad maintenance request from Doctor Hubert: "update, secure, harden, optimize")
**PR**: draft — `chore/security-hardening-and-updates` → master
**Branch**: chore/security-hardening-and-updates

---

## ✅ Completed This Session

### 1. Dependency updates (`build(deps)`)
- next 16.1.6 → **16.4.5** (resolves critical Next advisories), react/react-dom 19.3.1,
  zod 4.6.7 (GHSA-mrhx-c7xc-m3w5), sharp 0.35.5, eslint-config-next 16.4.5
- `npm update` + `npm audit fix` (tar, undici, ws, postcss, lodash, dompurify, form-data, …)
- Audit: 54 → 50 total, **critical 3 → 1, high 24 → 6**; everything left is inside
  Sanity Studio/CLI (`sanity` 4.x, `@sanity/cli` 3.x) and needs a major upgrade
- `eslint.config.mjs`: FlatCompat crashed (circular structure) → native flat exports; lint runs again

### 2. Contact API hardening
- **Rate-limit bypass fixed**: key was the *leftmost* `X-Forwarded-For` (client-controlled);
  now rightmost hop (appended by nginx) via `src/lib/clientIp.ts`
- Global hourly cap (30 emails, all IPs) protects the Resend quota
- 415 for non-JSON, 413 for >16KB, 400 for malformed JSON (was 500)
- HTML escaping now escapes `&`; subject is plain text with control chars stripped; `replyTo` set
- Rate limiter store bounded to 10k keys, cleanup timer `unref()`'d

### 3. Other endpoints
- `/api/csp-report`: **was returning 500 on every report** (`NextResponse.json` with 204 throws).
  Now bodiless 204, supports Reporting API arrays, 8KB cap, per-IP limit, field truncation
- `/api/indexnow`: POST requires `Authorization: Bearer $INDEXNOW_API_SECRET` (timing-safe);
  **503 until that env var is set on the VPS**; ≤100 URLs; 10s outbound timeout
- `/api/projects/[slug]`: slug validated (Unicode letters/digits, `-_.`, ≤200) → 400
- `/api/health`: Sanity check cached 30s + 5s timeout, shared client, `no-store`, no heap details

### 4. Headers
- Removed catch-all `Cache-Control: immutable, 1 year` on `/(.*)` (hit API, sw.js, manifest, robots)
- `X-XSS-Protection: 0`, added COOP `same-origin`, `X-Permitted-Cross-Domain-Policies: none`,
  Permissions-Policy `browsing-topics=()` (replaces obsolete `interest-cohort`)

### 5. CI / deploy
- All workflows Node 20 (EOL) → 22 (matches VPS); `engines.node >=20.9.0`
- Deploy: `permissions: contents: read`, key written via env + umask, appleboy/ssh-action v1.2.0,
  optional host-key verification via `VULTR_KNOWN_HOSTS` / `VULTR_HOST_FINGERPRINT` secrets

### 6. Optimization
- Deleted dead `FirstImage` component, tests, and `.first-image-container` CSS shipped on every page

---

## 🎯 Current Project State

**Tests**: ✅ 1247 passing, 23 skipped (was 1218) — 29 new tests
**Type-check**: ✅ clean
**Build**: ✅ `next build` succeeds; verified headers/endpoints against `next start` locally
**Lint**: ⚠️ runs again; 22 pre-existing errors (React Compiler `set-state-in-effect` in 6 components,
`no-explicit-any` in tests). Lint is not a CI gate
**Branch**: clean, pushed

### Agent Validation Status
- [ ] Agents not run (subagents only on explicit request this session); manual security review done

---

## 🔧 Doctor Hubert's server & GitHub to-do (before/at merge of PR #386)

None of these block the deploy — the site works without them — but each closes a gap.

**A. GitHub repo secrets** (Settings → Secrets and variables → Actions → New repository secret)
1. `VULTR_KNOWN_HOSTS` — run on your own machine (not the VPS):
   `ssh-keyscan -t ed25519,ecdsa,rsa <VPS_HOST>` → paste the full output as the secret value.
   Enables host-key checking for the rsync step.
2. `VULTR_HOST_FINGERPRINT` — on the VPS run:
   `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` → copy only the `SHA256:...` part.
   Enables host-key checking for the ssh-action step.
   Verify: the next deploy log no longer shows "SSH host key is NOT verified".

**B. VPS environment** (`/var/www/idaromme.dk`)
- ⚠️ Every deploy **overwrites `.env.local`**. Put server-only secrets in
  **`.env.production.local`** instead (Next.js loads it in production; deploys don't touch it).
3. `INDEXNOW_API_SECRET` — only if anything calls `POST /api/indexnow` (nothing in the repo does).
   Generate: `openssl rand -hex 32`, add `INDEXNOW_API_SECRET=<value>` to `.env.production.local`,
   then `pm2 restart idaromme-website`. Callers send `Authorization: Bearer <value>`.
   Without it the endpoint returns 503 (intentional).
4. Confirm `RESEND_API_KEY` (and `CONTACT_EMAIL` if used) live in `.env.production.local`,
   not `.env.local` — otherwise the contact form returns 503.
5. Confirm Node 22: `source ~/.nvm/nvm.sh && node -v` → `v22.x` (CI now builds with 22).

**C. After merge & deploy — smoke checks** (from any machine)
6. `curl -sI https://idaromme.dk/ | grep -iE "x-xss|cross-origin-opener|cache-control"`
   → `x-xss-protection: 0`, `cross-origin-opener-policy: same-origin`, HTML not `immutable`
7. `curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/csp-report' -d '{"csp-report":{}}' https://idaromme.dk/api/csp-report` → `204`
8. Send one real message through the contact form → arrives; **Reply** goes to the sender (new `replyTo`)
9. Open a project page → images load (sharp was bumped to 0.35; confirms the binary installed on the VPS)
10. Optional: `pm2 logs idaromme-website --lines 50` → no new errors

---

## 🚀 Next Session Priorities

1. **Merge PR #386** (squash), then work through the to-do list above
2. **Sanity 4 → 6 / next-sanity 13 migration** — clears the remaining critical/high advisories
3. Fix the React Compiler lint errors (setState in effects), then add `npm run lint` to CI
4. Issue #349 (optional) — unused JS: vendor 132KB, framework 61KB

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from the security hardening PR
(chore/security-hardening-and-updates — next 16.4.5, API hardening, header fixes, Node 22 CI).

**Immediate priority**: Confirm the PR's CI is green and merge; verify production headers and
  /api/csp-report (204) on idaromme.dk after deploy (1 hour)
**Context**: Remaining npm audit highs are all inside Sanity Studio/CLI (needs sanity 6 migration)
**Reference docs**: SESSION_HANDOVER.md, src/lib/clientIp.ts, src/proxy.ts
**Ready state**: branch pushed, 1247 unit tests passing, build verified locally

**Expected scope**: Merge + deploy check, then plan the Sanity 4 → 6 upgrade (PRD/PDR if needed)
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `src/lib/clientIp.ts`, `src/lib/rateLimit.ts` — trusted IP + bounded limiter
- `src/app/api/{contact,csp-report,indexnow}/route.ts`, `src/pages/api/health.js`
- `src/proxy.ts`, `next.config.ts` — security & caching headers
- `.github/workflows/production-deploy.yml` — SSH host verification secrets
