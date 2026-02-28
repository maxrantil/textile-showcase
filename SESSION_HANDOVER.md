# Session Handoff: Production Stabilisation & Architectural Issue Found

**Date**: 2026-02-28
**Branch**: `master` (clean)
**Commit**: `5c7a696`

---

## ✅ Completed This Session

### 1. Repo Cleaned Up & Ready for New Work
- Committed outstanding `SESSION_HANDOVER.md` on `hotfix/issue-266-typescript-fixes`
- Resolved merge conflict (kept latest handover content)
- **PR #281 merged to master**: QueryCache event loop fix, PM2 config, complete crossOrigin fixes
- Switched VPS and local to clean `master` at `5c7a696`

### 2. VPS Production Deployment Fixed
- VPS was on detached HEAD (`9338adc`) — now on `master`
- PM2 running correctly: `online`, restart count: 0, ~197MB memory
- All project pages confirmed loading correctly

### 3. Two Production Issues Diagnosed & Resolved

**Issue A — Browser cache mismatch (immediate fix)**
- Symptom: `Failed to find Server Action "x"` errors in PM2 logs
- Cause: Browser had stale JS chunks from old build, server action IDs changed
- Fix: Hard refresh (Ctrl+Shift+R) in browser — no code change needed

**Issue B — Project pages hanging on cold start (workaround found)**
- Symptom: Only "embracing-light..." project loaded; all others hung indefinitely
- Root cause: SSR page calls `getProject(slug)` which makes an HTTP fetch back to
  its own `/api/projects/[slug]` route (self-referencing). On cold start with empty ISR
  cache, this creates a slow round-trip through nginx for every SSR render.
- Workaround: `curl` of each API route warmed the Next.js ISR cache → pages now load fast
- Status: **Working now**, but will recur after PM2 restart or 1-hour ISR TTL expiry

### 4. ecosystem.config.js Bug Fixed (uncommitted — included in this handoff commit)
- Removed `wait_ready: true` — Next.js never emits `process.send('ready')`, so PM2
  would wait forever / behave unpredictably with this setting
- Changed `shutdown_with_message: false` (no-op for Next.js)

---

## 🚨 Outstanding Architectural Issue (Needs GitHub Issue)

**File**: `src/app/project/[slug]/hooks/use-project-data.ts` (line 10–11)

```ts
const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
const response = await fetch(`${baseUrl}/api/projects/${slug}`, {
  next: { revalidate: 3600 },
})
```

**Problem**: `getProject()` is called server-side (SSR) from `page.tsx` for structured data.
It makes an HTTP request back to its own API route over the network. This means:

1. Every cold-start SSR request goes: Browser → nginx → Next.js SSR → nginx → Next.js API → Sanity
2. If `NEXT_PUBLIC_URL` is not set, fallback is `http://localhost:3000` (wrong port — app on 3001)
3. ISR cache (`revalidate: 3600`) masks the issue when warm, but cold starts always hang

**Correct fix**: `getProject()` when called server-side should import and call Sanity directly
(same as the API route does) instead of making a self-referencing HTTP call.

**Impact**: After every PM2 restart the first visit to each project page will be slow/hanging
until the ISR cache is re-warmed.

---

## 🎯 Current Project State

**Tests**: Unknown (not run this session — no code changes to app logic)
**Branch**: `master` ✅ clean (after this handoff commit)
**CI/CD**: Not checked this session
**VPS**: ✅ Running, PM2 online, all projects loading
**ISR cache**: Warm (primed manually via curl) — expires in ~1 hour

### Agent Validation Status
- [ ] architecture-designer: Not run — needed for self-referencing HTTP fix
- [ ] security-validator: Not run
- [ ] code-quality-analyzer: Not run
- [ ] test-automation-qa: Not run
- [ ] performance-optimizer: Not run
- [ ] documentation-knowledge-manager: Not run

---

## 🚀 Next Session Priorities

**Immediate (before ISR cache expires on VPS):**

1. **Open GitHub issue** for the self-referencing HTTP architectural bug in `use-project-data.ts`
2. **Fix**: Refactor `getProject()` to call Sanity directly when running server-side,
   eliminating the HTTP round-trip and port-mismatch risk
3. **Deploy fix** to VPS so cold starts are reliable without manual cache warming

**Then:**
- Run full test suite to confirm nothing broken by recent merges
- Consider if any new feature/bugfix work is queued

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then fix a known architectural bug.

**Issue to open & fix**: `src/app/project/[slug]/hooks/use-project-data.ts`
`getProject()` makes a self-referencing HTTP call back to the app's own API route
during SSR. This causes project pages to hang on cold start (after PM2 restart or
1-hour ISR cache expiry). Fix: call Sanity directly from server-side instead of
HTTP-fetching the API route.

**VPS state**: Running fine RIGHT NOW (ISR cache warm), but will break on next restart.
**Branch**: `master`, clean, commit `5c7a696`
**Reference**: SESSION_HANDOVER.md section "Outstanding Architectural Issue"

**Expected scope**: Open GitHub issue, implement fix with TDD, PR, deploy to VPS.
```

---

**Session ended**: 2026-02-28
**Status**: VPS stable, architectural bug documented, fix pending
