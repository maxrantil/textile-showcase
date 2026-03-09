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
 * Uses WebP (avif removed - Sanity CDN returns 400 for ?fm=avif)
 * Quality 40, sizes 480/640/960w for LCP optimization
 *
 * This component will be hidden after client hydration via CSS
 */
export function FirstImage({ design }: FirstImageProps) {
  const imageSource = design.image || design.images?.[0]?.asset

  if (!imageSource) {
    return null
  }

  // WebP srcset - avif removed (Sanity CDN returns 400 for ?fm=avif, encoding on VPS adds 5s to LCP)
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
        {/* WebP for modern browsers - avif removed (Sanity 400s on ?fm=avif) */}
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
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
