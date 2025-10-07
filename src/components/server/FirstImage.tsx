// ABOUTME: Server-rendered static LCP image for immediate browser discovery
// Solves React hydration discovery gap - browser finds image in initial HTML

import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { TextileDesign } from '@/types/textile'

interface FirstImageProps {
  design: TextileDesign
}

/**
 * Server Component that renders the LCP image as static HTML
 * Critical for performance - enables browser to discover and start loading
 * the LCP image immediately without waiting for React hydration (~6-10s delay)
 *
 * Expected impact:
 * - Load Delay: 7.5s → <1s (TTFB only)
 * - LCP: 14.3s → 2.5-3s (80% improvement)
 *
 * This component will be hidden after client hydration via CSS
 */
export function FirstImage({ design }: FirstImageProps) {
  const imageSource = design.image || design.images?.[0]?.asset

  if (!imageSource) {
    return null
  }

  // Generate responsive image URLs for different screen sizes
  // Use lower quality for initial load to improve LCP
  const imageUrl = getOptimizedImageUrl(imageSource, {
    width: 640, // Reduced from 800 for faster initial load
    quality: 60, // Lower quality for better speed (60 from 75)
    format: 'webp', // Explicit WebP for better compression
  })

  // Generate srcset for responsive loading with lower quality
  const srcSet = `
    ${getOptimizedImageUrl(imageSource, { width: 320, quality: 60, format: 'webp' })} 320w,
    ${getOptimizedImageUrl(imageSource, { width: 640, quality: 60, format: 'webp' })} 640w,
    ${getOptimizedImageUrl(imageSource, { width: 960, quality: 60, format: 'webp' })} 960w
  `.trim()

  return (
    <div
      data-first-image="true"
      className="first-image-container"
      suppressHydrationWarning
      style={{
        position: 'absolute',
        width: '100%',
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={imageUrl}
        srcSet={srcSet}
        sizes="(max-width: 480px) 100vw, (max-width: 768px) 90vw, 640px"
        alt={design.title}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        suppressHydrationWarning
        style={{
          width: 'auto',
          height: '60vh',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
