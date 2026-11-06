// ABOUTME: Single source of truth for the home gallery's first (LCP) image on each viewport
// Page preloads and gallery components both use these, so preload URLs always match the <img>

import { getImageProps } from 'next/image'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import type { TextileDesign } from '@/types/textile'

/** Viewport split used by the adaptive gallery CSS (min-width: 768px = desktop) */
export const MOBILE_MEDIA = '(max-width: 767px)'
export const DESKTOP_MEDIA = '(min-width: 768px)'

export const DESKTOP_GALLERY_IMAGE = {
  width: 800,
  height: 600,
  sizes: '(max-width: 1024px) 90vw, (max-width: 1440px) 800px, 900px',
} as const

function imageSourceOf(design: TextileDesign) {
  return design.image || design.images?.[0]?.asset
}

/** Direct Sanity CDN URL the mobile gallery's (unoptimized) first <img> fetches */
export function mobileGalleryImageUrl(design: TextileDesign): string | null {
  const source = imageSourceOf(design)
  return source
    ? getOptimizedImageUrl(source, { width: 800, quality: 80, format: 'auto' })
    : null
}

/** Source URL the desktop gallery passes to next/image */
export function desktopGalleryImageUrl(design: TextileDesign): string | null {
  const source = imageSourceOf(design)
  return source
    ? getOptimizedImageUrl(source, {
        height: 700,
        quality: 75,
        format: 'webp',
        fit: 'crop',
      })
    : null
}

/** Responsive srcset/sizes of the desktop gallery's first image, for <link rel=preload> */
export function desktopGalleryPreload(
  design: TextileDesign
): { href: string; imageSrcSet: string; imageSizes: string } | null {
  const src = desktopGalleryImageUrl(design)
  if (!src) return null
  const { props } = getImageProps({
    src,
    alt: '',
    width: DESKTOP_GALLERY_IMAGE.width,
    height: DESKTOP_GALLERY_IMAGE.height,
    sizes: DESKTOP_GALLERY_IMAGE.sizes,
  })
  if (!props.srcSet) return null
  return {
    // Fallback for browsers without srcset; React also needs href to hoist the link
    href: props.src,
    imageSrcSet: props.srcSet,
    imageSizes: DESKTOP_GALLERY_IMAGE.sizes,
  }
}
