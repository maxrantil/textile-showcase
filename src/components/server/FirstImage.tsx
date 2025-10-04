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
  const imageUrl = getOptimizedImageUrl(imageSource, {
    width: 800, // Higher base resolution for desktop
    quality: 75, // Slightly lower quality for better speed
    format: 'webp', // Explicit WebP for better compression
  })

  // Generate srcset for responsive loading
  const srcSet = `
    ${getOptimizedImageUrl(imageSource, { width: 450, quality: 75, format: 'webp' })} 450w,
    ${getOptimizedImageUrl(imageSource, { width: 640, quality: 75, format: 'webp' })} 640w,
    ${getOptimizedImageUrl(imageSource, { width: 800, quality: 75, format: 'webp' })} 800w,
    ${getOptimizedImageUrl(imageSource, { width: 1200, quality: 75, format: 'webp' })} 1200w
  `.trim()

  const aspectRatio = 4 / 3

  return (
    <div
      data-first-image="true"
      className="first-image-container"
      style={{
        aspectRatio,
        position: 'relative',
        width: '100%',
      }}
      suppressHydrationWarning
    >
      <img
        src={imageUrl}
        srcSet={srcSet}
        sizes="(max-width: 768px) 100vw, 800px"
        alt={design.title}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        suppressHydrationWarning
      />
    </div>
  )
}
