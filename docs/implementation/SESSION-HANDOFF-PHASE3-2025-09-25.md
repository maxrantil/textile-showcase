# Session Handoff: Phase 3 Implementation - API Routes Strategy

## Current Status

**Date**: 2025-09-25
**Branch**: `feat/issue-32-critical-performance-optimization`
**Phase 2**: ✅ Core work COMPLETE (type fixes pending)
**Next Phase**: Phase 3 - API Routes + Runtime Isolation

---

## Phase 2 Completed Work

### ✅ Import Isolation Foundation

- **Component isolation**: All public components moved from `@/sanity/*` to lightweight alternatives
- **Type migration**: TextileDesign imports moved from `@/sanity/types` to `@/types/textile`
- **Image helper replacement**: `@/sanity/imageHelpers` → `@/utils/image-helpers` throughout codebase
- **Studio isolation maintained**: Dynamic imports still working for `/studio` routes

### 🔍 Critical Discovery

**Root Issue**: SSG executes "dynamic" imports at build time, pulling Sanity into main bundle despite component isolation.

**Bundle Status**:

- **Total size**: Still 4.04 MB
- **Sanity chunks**: Still 15 chunks present
- **Public First Load**: Still 1.25 MB (target: <800KB)

---

## Phase 3 Strategy: API-First Architecture

### Core Approach

1. **Move all Sanity queries to API routes** (`/api/projects/*`)
2. **Convert public pages to runtime API fetching**
3. **Maintain SSG shell + client hydration** for SEO/performance
4. **Studio routes unchanged** (already isolated)

### Implementation Plan

#### Step 1: Create API Routes

```typescript
// NEW: /app/api/projects/route.ts
export async function GET() {
  const { queries } = await import('@/sanity/queries') // Server-side only
  // Return project list
}

// NEW: /app/api/projects/[slug]/route.ts
export async function GET(request, { params }) {
  const { queries } = await import('@/sanity/queries') // Server-side only
  // Return single project with navigation
}
```

#### Step 2: Update Public Pages

```typescript
// UPDATED: /app/project/[slug]/page.tsx
export default async function ProjectPage({ params }) {
  // Fetch from API instead of direct Sanity
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/projects/${params.slug}`
  )
  const data = await response.json()
  // Pure components, zero Sanity imports
}
```

#### Step 3: Fix Type Compatibility

- Resolve remaining TextileDesign interface mismatches
- Update test files to use new types
- Ensure clean TypeScript compilation

### Expected Outcome

- **Public bundle**: 0KB Sanity code
- **First Load JS**: ~600-700KB (target achieved)
- **SEO maintained**: SSG shell preserved
- **Studio working**: No changes needed

---

## Current Branch State

### Files Modified (Phase 2)

- **23 component files** updated with import isolation
- **Type definitions** in `src/types/textile.ts` extended
- **Build succeeds** but TypeScript hooks prevent commit

### Pre-commit Issues

- Type compatibility between old/new TextileDesign interfaces
- Test files still using Sanity types
- Optional field handling in components

### Ready for Phase 3

- **Foundation solid**: Component isolation complete
- **Path clear**: API routes strategy validated
- **Studio intact**: No disruption to working functionality

---

## Phase 3 Implementation Commands

```bash
# Verify current state
git status
npm run build:production

# Create API routes
mkdir -p src/app/api/projects/[slug]
# Implement server-side API routes

# Update public pages to fetch from APIs
# Remove remaining Sanity imports from project pages

# Fix type compatibility issues
# Run bundle analysis to verify 0KB Sanity in public

# Test and validate
npm run check-bundle-size:verbose
```

---

## Success Criteria for Phase 3

1. **0KB Sanity in public bundles** (measured via bundle analysis)
2. **First Load JS <800KB** for public pages
3. **Studio functionality preserved** (no regression)
4. **Clean TypeScript compilation** (all hooks pass)
5. **SEO maintained** (meta tags, structured data intact)

---

**Phase 2 foundation ready. API routes strategy is the clear path to bundle isolation success.**
