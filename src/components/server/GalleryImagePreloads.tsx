// ABOUTME: Preload links for the gallery images on screen at arrival
// Rendered by every page that shows the galleries, so each preload matches the request its <img> makes

import type { TextileDesign } from '@/types/textile'
import {
  DESKTOP_EAGER_IMAGE_COUNT,
  DESKTOP_GALLERY_MEDIA,
  MOBILE_GALLERY_MEDIA,
  desktopGalleryImage,
  mobileGalleryImageUrl,
} from '@/utils/gallery-images'

interface GalleryImagePreloadsProps {
  designs: TextileDesign[]
}

export function GalleryImagePreloads({ designs }: GalleryImagePreloadsProps) {
  // Issue #363: Preload the phone LCP image via direct Sanity CDN URL.
  // MobileGalleryItem uses unoptimized={isPriority} so the LCP <img> fetches the Sanity
  // CDN URL directly — the preload href must match this URL exactly.
  // Previously preloaded /_next/image proxy URLs (Issue #345) but proxy overhead
  // added ~1.5–2s to CI LCP; the preload and the actual <img> src now match.
  const lcpImageUrl = mobileGalleryImageUrl(designs[0])

  // Issue #429: both galleries are in the HTML and CSS shows one of them. Each
  // preload is scoped to the layout that shows its image, so a viewport never
  // downloads the hidden gallery's images.
  const desktopImages = designs
    .slice(0, DESKTOP_EAGER_IMAGE_COUNT)
    .map((design) => ({ id: design._id, ...desktopGalleryImage(design) }))

  return (
    <>
      {/* Issue #363: Preload LCP image directly from Sanity CDN — no /_next/image proxy.
          MobileGalleryItem uses unoptimized={isPriority} so the src URL exactly matches
          this href; the browser reuses the preloaded resource with no cache miss.
          No crossOrigin: the <img> is fetched without CORS and the CDN allows no
          origin, so a CORS preload fails and the image is fetched a second time. */}
      {lcpImageUrl && (
        <link
          rel="preload"
          as="image"
          href={lcpImageUrl}
          media={MOBILE_GALLERY_MEDIA}
          fetchPriority="high"
        />
      )}

      {/* Issue #429: the two desktop images on screen at arrival, with the exact
          srcset and sizes of their <img> so the preloaded response is reused */}
      {desktopImages.map((image) => (
        <link
          key={image.id}
          rel="preload"
          as="image"
          imageSrcSet={image.srcSet}
          imageSizes={image.sizes}
          media={DESKTOP_GALLERY_MEDIA}
          fetchPriority="high"
        />
      ))}
    </>
  )
}
