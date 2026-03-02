# Session Handoff: Issue #317 — eliminate project page image waterfall ✅ COMPLETE

**Date**: 2026-03-02
**Issue**: #317 — fix: eliminate client-side fetch waterfall on project pages (slow images)
**PR**: #318 — merged to master at `d49f0f2`
**Branch**: `fix/issue-317-project-page-ssr-waterfall` — deleted after merge

---

## ✅ Completed Work

### Root cause
`/project/[slug]` pages used `ClientProjectContent`, which fires a `useEffect`
→ `fetch /api/projects/[slug]` → Sanity query → render. Images couldn't start
loading until the full client-side round-trip completed. Browser saw only a
"Loading project..." spinner in the initial HTML.

Additionally, the server already called `getProject(slug)` for structured data
schemas, meaning the same Sanity data was fetched twice per page load.

### Fix
- **`src/app/project/[slug]/page.tsx`**: replaced `<ClientProjectContent slug={slug} />`
  with a single server-side `getProjectWithNavigation(slug)` call and direct
  `<ProjectContent>` render. Added `<link rel="preload">` for the main project
  image (LCP hint) + `preconnect`/`dns-prefetch` for `cdn.sanity.io`.
- **`tests/integration/bundle-optimization.test.ts`**: updated the one test that
  asserted the old `ClientProjectContent` pattern to assert the new SSR pattern.

### Result
Full project HTML — including image URLs — is now in the initial server response.
Browser starts fetching images in the first network batch with no waterfall.
Single Sanity query per page load instead of two.

### Tests
All 982 unit/integration tests pass.

---

## 🎯 Current Project State

**Tests**: ✅ All passing (982 / 982)
**Branch**: master at `d49f0f2` (clean)
**Production**: idaromme.dk — deploy needed to see improvement live
**CI**: Running post-merge (expected green)

### Dependabot alerts
- All alerts: `fixed` ✅ (no open alerts)

### Open issues
- None

---

## 🚀 Next Session Priorities

1. **Deploy to production** — `pm2 restart` on VPS so the fix goes live
2. **Verify improvement** — load a project page, confirm no "Loading project..."
   spinner and images appear in first network batch
3. **Optional: remove `ClientProjectContent`** — the file
   `src/components/ClientProjectContent.tsx` is now unused; can be deleted in
   a follow-up cleanup issue

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from Issue #317 completion.

**Last completed**: Issue #317 closed — PR #318 merged (d49f0f2). Eliminated
client-side fetch waterfall on project pages; images now load from initial HTML.
**Production state**: idaromme.dk needs a deploy to see the fix live.
**Reference**: SESSION_HANDOVER.md
**Ready state**: master at d49f0f2, clean working directory, all tests passing

**Expected scope**: Deploy to production, verify images load faster, optionally
clean up the now-unused ClientProjectContent component.
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `src/app/project/[slug]/page.tsx` — the fixed server component
- `src/components/ClientProjectContent.tsx` — now unused, candidate for removal
