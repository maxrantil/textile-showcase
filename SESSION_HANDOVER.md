# Session Handoff: ESLint restore + Fable frontend session prep

**Date**: 2026-11-11
**PR**: #410 — fix: restore ESLint with native Next 16 flat config (DRAFT)
**Branch**: fix/eslint-native-flat-config

---

## ✅ Completed This Session

- **ESLint was completely broken.** It crashed on config load with a circular-structure error,
  because `eslint-config-next` 16 ships native flat configs and `FlatCompat` choked on them.
  `eslint.config.mjs` now imports `eslint-config-next/core-web-vitals` and `/typescript` directly.
- **Cleared 15 mechanical lint errors** in tests and `next.config.ts` (`any` replaced with real types,
  `require()` replaced with an import, a misplaced disable comment fixed).
- Since the last handover (2026-03-19), PRs #367, #406, #407 and #408 have all merged
  (Debian 13 server deploy is live on master).
- Removed a stray untracked `${XDG_CACHE_HOME:-/` dir (it held an nvim undo file for `.env.local`).
- `gh` CLI authenticated. Claude Code plugins installed: `frontend-design`, `playwright`, `claude-code-setup`.

## 🎯 Current Project State

**Tests**: ✅ affected suites pass (74 passed, 7 skipped); `tsc --noEmit` clean
**Lint**: ⚠️ 7 errors remaining (below). CI does not run ESLint, so these don't block PRs
**Branch**: ✅ clean, pushed
**Production**: idaromme.dk on the rebuilt Debian 13 server (#408)

### Remaining lint errors: react-hooks v7 (React Compiler rules)

| File | Rule |
|------|------|
| `src/components/Header/Header.tsx:41` | set-state-in-effect |
| `src/components/hydration/useProgressiveHydration.ts:46` | set-state-in-effect |
| `src/components/mobile/Project/ImageBlock.tsx:50` | set-state-in-effect |
| `src/components/ui/NavigationArrows.tsx:110,125` | static-components |
| `src/hooks/mobile/useVirtualKeyboard.ts:12` | set-state-in-effect |
| `src/hooks/shared/useDeviceType.ts:12` | set-state-in-effect |

These change component behaviour (SSR/hydration timing, device detection), so they need TDD and
mobile and desktop E2E checks, not a mechanical fix.

## 🚀 Next Session Priorities

1. **Merge PR #410** once CI is green
2. **Fix the 7 react-hooks errors** (frontend, TDD; watch hydration and SSR mismatches)
3. **Issue #349 (optional)**: unused JS (vendor 132KB, framework 61KB)

### Key Architecture Notes (carry-forward)

- `MobileGalleryItem`: `unoptimized={isPriority}` makes the LCP image bypass `/_next/image`
- `FirstImage` component still exists in the codebase but is no longer rendered anywhere
- Both `MobileGallery` and `DesktopGallery` are ALWAYS in the SSR HTML, so selectors must be viewport-scoped
- `GalleryPage` class (`tests/e2e/utils/page-objects/gallery-page.ts`) has viewport-aware getters
- `Gallery.tsx` focus management: `scrollContainerRef.current?.querySelector(...)`, never bare `document.querySelector`

## 📝 Startup Prompt for Next Session

Read CLAUDE.md to understand our workflow, then continue from PR #410 (ESLint restored, draft).

**Immediate priority**: fix the 7 react-hooks v7 lint errors in `src/` (2-3 hours)
**Context**: ESLint was silently broken; config fixed and 15 mechanical errors cleared in #410
**Reference docs**: SESSION_HANDOVER.md (error table), PR #410
**Ready state**: branch fix/eslint-native-flat-config pushed; gh authed; playwright + frontend-design plugins active

**Expected scope**: TDD-fix each set-state-in-effect / static-components error, verify mobile + desktop, `npx eslint .` clean

## 📚 Key Reference Documents

- `eslint.config.mjs`
- `tests/e2e/utils/page-objects/gallery-page.ts`
