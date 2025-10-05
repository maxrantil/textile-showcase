interface HtmlHeadProps {
  children?: React.ReactNode
  lcpImageUrl?: string
}

/**
 * HtmlHead component with performance-optimized resource hints
 * Implements Phase 2A resource prioritization per PDR specifications
 * - DNS prefetch control for faster DNS lookups
 * - Preconnect hints for critical domains (Sanity CDN, Google Fonts)
 * - Preload hints for critical resources (CSS, fonts)
 * - LCP image preload for immediate discovery (Issue #51 Phase 1)
 * Target: 200-300ms FCP improvement
 *
 * Note: Returns null - metadata is handled via Next.js metadata API in layout.tsx
 * Only the LCP image preload is conditionally rendered in page.tsx
 */
export function HtmlHead({ lcpImageUrl }: HtmlHeadProps) {
  // Only render LCP preload hint if URL is provided
  if (!lcpImageUrl) return null

  return (
    <>
      {/* CRITICAL: Preload LCP image for immediate discovery (Issue #51) */}
      <link
        rel="preload"
        as="image"
        href={lcpImageUrl}
        fetchPriority="high"
        imageSrcSet={`${lcpImageUrl}&w=450 450w, ${lcpImageUrl}&w=640 640w, ${lcpImageUrl}&w=750 750w`}
        imageSizes="(max-width: 768px) 100vw, 450px"
      />
    </>
  )
}
