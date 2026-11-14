// ABOUTME: Mobile gallery item — server component for LCP-optimised image rendering

import { TextileDesign } from '@/types/textile'
import Image from 'next/image'
import {
  DESKTOP_GALLERY_MEDIA,
  EMPTY_IMAGE_SRC,
  getGalleryImageSource,
  mobileGalleryImageUrl,
} from '@/utils/gallery-images'
import { MobileGalleryItemClient } from './MobileGalleryItemClient'
import styles from './MobileGalleryItem.module.css'

interface MobileGalleryItemProps {
  design: TextileDesign
  index?: number
  isPriority?: boolean
  isActive?: boolean
}

export default function MobileGalleryItem({
  design,
  index = 0,
  isPriority = false,
  isActive = false,
}: MobileGalleryItemProps) {
  // Image source with fallback chain
  const imageSource = getGalleryImageSource(design)
  // Same helper as the preload link in page.tsx, so the two URLs always match
  const imageUrl = mobileGalleryImageUrl(design) || '/images/placeholder.jpg' // Fallback

  const alt =
    design.image?.alt ||
    `Textile design artwork: ${design.title}${design.year ? ` (${design.year})` : ''}`

  const projectUrl = `/project/${design.slug?.current || design._id}`
  const ariaLabel = `View ${design.title} project${design.year ? ` from ${design.year}` : ''}`

  const image = (
    <Image
      src={imageUrl}
      alt={alt}
      width={600}
      height={800}
      sizes="100vw"
      loading={isPriority ? 'eager' : 'lazy'}
      unoptimized={isPriority}
      className={`mobile-gallery-image ${styles.fullWidthImage}`}
    />
  )

  return (
    <MobileGalleryItemClient
      href={projectUrl}
      ariaLabel={ariaLabel}
      index={index}
      isActive={isActive}
      designTitle={design.title}
      designYear={design.year}
    >
      <article>
        {imageSource && (
          <div className="mobile-gallery-image-container">
            {isPriority ? (
              // The page preloads this image for phones only. At desktop widths
              // this gallery is hidden, and the empty source keeps desktop from
              // downloading it
              <picture className={styles.picture}>
                <source
                  media={DESKTOP_GALLERY_MEDIA}
                  srcSet={EMPTY_IMAGE_SRC}
                />
                {image}
              </picture>
            ) : (
              image
            )}
          </div>
        )}

        <div className="mobile-gallery-info">
          {/* Title and year read as one catalogue entry: "Composing Tones, 2025" */}
          <h2 className="mobile-gallery-title">
            {design.title}
            {design.year && <span>, {design.year}</span>}
          </h2>
          {design.description && (
            <p className="mobile-gallery-description">{design.description}</p>
          )}
          {design.category && (
            <p className="mobile-gallery-category">{design.category}</p>
          )}
        </div>
      </article>
    </MobileGalleryItemClient>
  )
}
