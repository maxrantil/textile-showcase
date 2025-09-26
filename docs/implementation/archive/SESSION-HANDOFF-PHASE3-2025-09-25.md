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

### 🎯 IMPORTANT: Stashed Changes Available

**Phase 2 work is complete but STASHED** due to type compatibility issues:

```bash
# Apply Phase 2 changes:
git stash pop

# View stashed changes:
git stash show -p
```

**Stashed content includes:**

- **23 component files** with complete import isolation
- **All @/sanity/imageHelpers → @/utils/image-helpers** replacements done
- **All TextileDesign type imports** moved to @/types/textile
- **Extended type definitions** in `src/types/textile.ts`

### Pre-commit Issues (In Stash)

- Type compatibility between old/new TextileDesign interfaces
- Test files still using Sanity types
- Optional field handling in image functions
- Interface mismatches requiring resolution

### Ready for Phase 3

- **Foundation solid**: Component isolation architecturally complete
- **Path clear**: API routes strategy validated
- **Studio intact**: No disruption to working functionality
- **Type fixes needed**: Resolve compatibility before final commit

---

## Phase 3 Implementation Commands

```bash
# FIRST: Apply Phase 2 stashed changes
git stash pop

# Verify current state
git status
npm run build:production

# Create API routes (main Phase 3 work)
mkdir -p src/app/api/projects/[slug]
# Implement server-side API routes

# Update public pages to fetch from APIs
# Convert SSG to runtime API fetching

# Fix type compatibility issues from Phase 2 stash
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
