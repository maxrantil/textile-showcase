// ABOUTME: Unified responsive gallery component replacing adaptive splits
// Simplified portfolio-focused gallery with CSS-based responsiveness

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TextileDesign } from '@/types/textile'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import styles from './Gallery.module.css'

interface GalleryProps {
  designs: TextileDesign[]
}

export default function Gallery({ designs }: GalleryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!designs || designs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No designs available at the moment.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {designs.map((design) => {
          // Skip invalid designs
          if (!design || !design._id || !design.slug?.current) {
            return null
          }

          // Get the image URL from various possible sources
          const imageUrl = design.image || design.images?.[0]?.asset || ''
          const designTitle = design.title || 'Untitled'

          return (
            <Link
              key={design._id}
              href={`/project/${design.slug.current}`}
              className={styles.item}
              onMouseEnter={() => setHoveredId(design._id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-label={`View ${designTitle}`}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src={getOptimizedImageUrl(imageUrl, {
                    width: 800,
                    height: 600,
                  })}
                  alt={designTitle}
                  width={800}
                  height={600}
                  className={styles.image}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={designs.indexOf(design) < 3}
                  loading={designs.indexOf(design) < 3 ? 'eager' : 'lazy'}
                />
                <div
                  className={`${styles.overlay} ${
                    hoveredId === design._id ? styles.overlayVisible : ''
                  }`}
                >
                  <h3 className={styles.title}>{designTitle}</h3>
                  {design.description && (
                    <p className={styles.description}>
                      {design.description.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
