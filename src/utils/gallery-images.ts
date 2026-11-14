// ABOUTME: Single source for the home galleries' image URLs, sizes and layout media queries
// Shared by the page's preload links and both gallery components so they cannot drift apart

import { getImageProps } from 'next/image'
import type { ImageSource, TextileDesign } from '@/types/textile'
import { getOptimizedImageUrl } from '@/utils/image-helpers'

// Mirrors the breakpoint in components/adaptive/Gallery/index.module.css
export const DESKTOP_GALLERY_MEDIA = '(min-width: 768px)'
export const MOBILE_GALLERY_MEDIA = 'not all and (min-width: 768px)'

// 1x1 transparent GIF. Used as a <source> for the layout that is hidden, so an
// eager image in the hidden gallery costs no request
export const EMPTY_IMAGE_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// The two desktop images on screen at arrival: the first sits on the left
// margin and the second is often the larger of the two (the LCP element)
export const DESKTOP_EAGER_IMAGE_COUNT = 2

const DESKTOP_GALLERY_SIZES =
  '(max-width: 1024px) 90vw, (max-width: 1440px) 800px, 900px'
const DESKTOP_FALLBACK_SIZE = { width: 800, height: 600 }

type GalleryDesign = Pick<TextileDesign, 'image' | 'images'>

export function getGalleryImageSource(
  design: GalleryDesign | undefined
): ImageSource | undefined {
  return design?.image || design?.images?.[0]?.asset
}

// Asset references look like image-{id}-{width}x{height}-{format}
function getAssetSize(source: ImageSource | undefined) {
  const ref = source?._ref || source?.asset?._ref
  const match = ref?.split('-')[2]?.match(/^(\d+)x(\d+)$/)
  if (!match) return DESKTOP_FALLBACK_SIZE

  return { width: Number(match[1]), height: Number(match[2]) }
}

// Direct Sanity CDN URL for the phone gallery (no /_next/image proxy, Issue #363)
export function mobileGalleryImageUrl(
  design: GalleryDesign | undefined
): string | null {
  const source = getGalleryImageSource(design)
  if (!source) return null

  return (
    getOptimizedImageUrl(source, {
      width: 800, // Mobile screen optimal
      quality: 80, // Balance quality/size
      format: 'auto',
    }) || null
  )
}

export interface DesktopGalleryImage {
  src: string
  srcSet?: string
  sizes?: string
  width: number
  height: number
}

// The attributes of a desktop gallery <img>. Width and height are the asset's
// own, so the item is as wide before the image loads as after
export function desktopGalleryImage(
  design: GalleryDesign | undefined
): DesktopGalleryImage {
  const source = getGalleryImageSource(design)
  const imageUrl = source
    ? getOptimizedImageUrl(source, {
        height: 700,
        quality: 75,
        format: 'webp',
        fit: 'crop',
      })
    : ''
  const { width, height } = getAssetSize(source)

  const { props } = getImageProps({
    src: imageUrl || '/images/placeholder.jpg',
    alt: '',
    width,
    height,
    sizes: DESKTOP_GALLERY_SIZES,
  })

  return {
    src: props.src,
    srcSet: props.srcSet,
    sizes: props.sizes,
    width,
    height,
  }
}
