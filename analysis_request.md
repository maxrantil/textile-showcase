# Performance Analysis Request

## Current Issues

The webpack configuration tests are failing because:

1. Missing Sanity-specific cache groups: `sanityStudio`, `sanityRuntime`, `sanityUtils`
2. Missing maxInitialRequests: 10 setting
3. Missing maxSize: 200000 setting
4. Bundle size tests expect multiple Sanity chunks but getting 0

## Test Expectations

Tests expect:

- sanityStudio cache group with chunks: 'async'
- sanityRuntime cache group
- sanityUtils cache group
- maxInitialRequests: 10
- maxSize: 200000 (200KB)
- Multiple Sanity chunks generated (>5)

## Current Configuration Issues

Current next.config.ts has:

- maxInitialRequests: 25 (test expects 10)
- maxSize: 100000 (test expects 200000)
- Missing Sanity-specific cache groups
- Has security-focused cache groups instead

## Performance Requirements

- Keep shared bundle under 850KB
- Keep individual chunks under 250KB (except main Sanity runtime)
- Split Sanity dependencies into multiple chunks
- Studio chunks should be async only
- Route-specific loading (no Sanity on /about, /contact)

Please analyze and provide webpack splitChunks configuration recommendations.
