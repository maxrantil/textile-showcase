// ABOUTME: Server-rendered static LCP image for immediate browser discovery
// Solves React hydration discovery gap - browser finds image in initial HTML

import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { TextileDesign } from '@/types/textile'
import styles from './FirstImage.module.css'

interface FirstImageProps {
  design: TextileDesign
}

/**
 * Server Component that renders the LCP image as static HTML
 * Critical for performance - enables browser to discover and start loading
 * the LCP image immediately without waiting for React hydration (~6-10s delay)
 *
 * Issue #78 Optimization:
 * - Added <link rel="preload"> in page.tsx head for immediate discovery
 * - Switched from WebP to AVIF (30-40% better compression)
 * - Reduced quality from 60 to 40 (aggressive LCP optimization)
 *
 * Expected impact:
 * - Load Delay: 6.2s → <1s (preload eliminates discovery gap)
 * - Load Time: 3.1s → 1.5-2s (AVIF compression)
 * - Render Delay: 4.7s → 1-1.5s (faster download)
 * - LCP: 14.9s → 2-2.5s (85% improvement)
 *
 * This component will be hidden after client hydration via CSS
 */
export function FirstImage({ design }: FirstImageProps) {
  const imageSource = design.image || design.images?.[0]?.asset

  if (!imageSource) {
    return null
  }

  // Issue #78/#41: Generate AVIF srcset with aggressive quality for LCP optimization
  // AVIF provides 30-40% better compression than WebP at same quality
  // Issue #41: Quality reduced from 50 to 40, breakpoint 320w → 480w for mobile
  const avifSrcSet = `
    ${getOptimizedImageUrl(imageSource, { width: 480, quality: 40, format: 'avif' })} 480w,
    ${getOptimizedImageUrl(imageSource, { width: 640, quality: 40, format: 'avif' })} 640w,
    ${getOptimizedImageUrl(imageSource, { width: 960, quality: 40, format: 'avif' })} 960w
  `.trim()

  // WebP fallback srcset for Safari 15 and older (7% of users)
  const webpSrcSet = `
    ${getOptimizedImageUrl(imageSource, { width: 480, quality: 40, format: 'webp' })} 480w,
    ${getOptimizedImageUrl(imageSource, { width: 640, quality: 40, format: 'webp' })} 640w,
    ${getOptimizedImageUrl(imageSource, { width: 960, quality: 40, format: 'webp' })} 960w
  `.trim()

  // JPEG fallback URL for ancient browsers (img src attribute)
  const jpegUrl = getOptimizedImageUrl(imageSource, {
    width: 640,
    quality: 40,
    format: 'jpg',
  })

  const sizes = '(max-width: 480px) 100vw, (max-width: 768px) 90vw, 640px'

  return (
    <div
      data-first-image="true"
      className={`first-image-container ${styles.container}`}
      suppressHydrationWarning
    >
      <picture>
        {/* AVIF for modern browsers (30-40% better compression than WebP) */}
        <source
          type="image/avif"
          srcSet={avifSrcSet}
          sizes={sizes}
          crossOrigin="anonymous"
        />

        {/* WebP fallback for Safari 15 and older browsers */}
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
          crossOrigin="anonymous"
        />

        {/* JPEG fallback for ancient browsers (final fallback) */}
        <img
          src={jpegUrl}
          alt={design.title}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          crossOrigin="anonymous"
          suppressHydrationWarning
          className={styles.image}
        />
      </picture>
    </div>
  )
}
