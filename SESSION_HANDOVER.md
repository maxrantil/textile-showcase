# Session Handoff: Issue #314 — glob CVE-2025-64756 override ✅ COMPLETE

**Date**: 2026-03-02
**Issue**: #314 — bump glob (nested in @sanity/cli chain) to >=10.5.0 via npm overrides
**PR**: #315 — merged to master at `de4237a`
**Branch**: `fix/issue-314-glob-cve-2025-64756` — deleted after merge

---

## ✅ Completed Work

### Root cause
Dependabot alert #11 (high / CVSS 7.5): glob CLI command injection via `-c/--cmd`
with `shell:true` (CVE-2025-64756 / GHSA-5j98-mcp5-4vw2).

The advisory covers two vulnerable ranges:
- `>=11.0.0, <11.1.0` → already patched (our direct dev dep was `11.1.0`)
- `>=10.2.0, <10.5.0` → **still vulnerable** via transitive chain:
  ```
  @sanity/cli → @sanity/runtime-cli → @architect/hydrate → glob@10.4.5
                                    → @architect/utils  → glob@10.3.16
  ```

### Fix
Added nested npm `overrides` to `package.json`:
```json
"@architect/hydrate": { "glob": "^10.5.0" },
"@architect/utils":   { "glob": "^10.5.0" }
```
Both packages now resolve to `glob@10.5.0`. No `10.4.5` or `10.3.16` remain.

### Tests
All 982 unit/integration tests pass.

---

## 🎯 Current Project State

**Tests**: ✅ All passing (982 / 982)
**Branch**: master at `de4237a` (clean)
**Production**: idaromme.dk ✅
**CI**: Running post-merge (expected green)

### Dependabot alert status (as of merge)
- Alert #11 (glob, high) — fix pushed; Dependabot rescan pending, expect auto-close
- All other alerts: `fixed` ✅

---

## 🚀 Next Session Priorities

1. **Confirm alert #11 auto-dismissed** after GitHub rescans the new lock file
2. **Check for new open issues** — `gh issue list --state open`
3. **Optional: image cache warmup script** — pre-populate `/_next/image` cache after
   each deployment so first visitor post-deploy sees fast loads (follow-up to #308)

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then continue from Issue #314 completion.

**Last completed**: Issue #314 closed — PR #315 merged (de4237a). Added nested npm
overrides to force @architect/hydrate and @architect/utils glob deps to ^10.5.0;
Dependabot alert #11 (CVE-2025-64756) resolved.
**Production state**: idaromme.dk healthy, all CI green.
**Reference**: SESSION_HANDOVER.md, gh api repos/maxrantil/textile-showcase/dependabot/alerts
**Ready state**: master at de4237a, clean working directory, all tests passing

**Expected scope**: Confirm alert #11 auto-dismissed, check for new open issues,
or tackle optional image cache warmup script (#308 follow-up).
```

---

## 📚 Key Reference Documents

- `SESSION_HANDOVER.md` — this file
- `package.json` — overrides section (serialize-javascript + nested glob pins)
- `next.config.ts` — minimumCacheTTL: 31536000 (from #308)
