// ABOUTME: Mobile gallery item — server component for LCP-optimised image rendering

import { TextileDesign } from '@/types/textile'
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
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
  const imageSource = design.image || design.images?.[0]?.asset
  const imageUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        width: 800, // Mobile screen optimal
        quality: 80, // Balance quality/size
        format: 'auto', // Keep 'auto' to match preload URL generated in page.tsx
      })
    : '/images/placeholder.jpg' // Fallback

  const alt =
    design.image?.alt ||
    `Textile design artwork: ${design.title}${design.year ? ` (${design.year})` : ''}`

  const projectUrl = `/project/${design.slug?.current || design._id}`
  const ariaLabel = `View ${design.title} project${design.year ? ` from ${design.year}` : ''}`

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
            <Image
              src={imageUrl}
              alt={alt}
              width={600}
              height={800}
              sizes="100vw"
              priority={isPriority}
              loading={isPriority ? 'eager' : 'lazy'}
              className={`mobile-gallery-image ${styles.fullWidthImage}`}
            />
          </div>
        )}

        <div className="mobile-gallery-info">
          <h2 className="mobile-gallery-title">{design.title}</h2>
          {design.description && (
            <p className="mobile-gallery-description">{design.description}</p>
          )}
          {/* Year removed per Doctor Hubert's request - keep only title on homepage gallery */}
          {design.category && (
            <p className="mobile-gallery-category">{design.category}</p>
          )}
        </div>
      </article>
    </MobileGalleryItemClient>
  )
}
