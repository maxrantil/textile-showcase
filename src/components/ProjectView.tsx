// ABOUTME: Unified responsive project view component replacing adaptive splits
// Simplified portfolio-focused project display with CSS-based responsiveness

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TextileDesign } from '@/types/textile'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import styles from './ProjectView.module.css'

interface ProjectViewProps {
  project: TextileDesign
  nextProject?: { slug: string; title: string }
  previousProject?: { slug: string; title: string }
}

export default function ProjectView({
  project,
  nextProject,
  previousProject,
}: ProjectViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Prepare all images from various possible sources
  const mainImage = project.image || project.images?.[0]?.asset || ''
  const projectTitle = project.title || 'Untitled'

  // Combine main image with gallery images if available
  const allImages = [
    { url: mainImage, alt: projectTitle },
    ...(project.gallery || []).map((img, index) => ({
      url: img.asset || '',
      alt: img.caption || `${projectTitle} - Image ${index + 2}`,
    })),
  ].filter((img) => img.url) // Remove any empty URLs

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <div className={styles.container}>
      {/* Project Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{projectTitle}</h1>
        {project.year && <span className={styles.year}>{project.year}</span>}
      </div>

      {/* Image Gallery */}
      <div className={styles.gallery}>
        <div className={styles.imageContainer}>
          <Image
            src={getOptimizedImageUrl(allImages[currentImageIndex].url, {
              width: 1200,
              height: 900,
            })}
            alt={allImages[currentImageIndex].alt}
            width={1200}
            height={900}
            className={styles.image}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />

          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className={`${styles.navButton} ${styles.prevButton}`}
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                onClick={handleNextImage}
                className={`${styles.navButton} ${styles.nextButton}`}
                aria-label="Next image"
              >
                →
              </button>
              <div className={styles.imageIndicators}>
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`${styles.indicator} ${
                      index === currentImageIndex ? styles.indicatorActive : ''
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project Details */}
      <div className={styles.details}>
        <div className={styles.detailsContent}>
          {project.description && (
            <div className={styles.description}>
              <h2 className={styles.sectionTitle}>About</h2>
              <p>{project.description}</p>
            </div>
          )}

          {project.techniques && project.techniques.length > 0 && (
            <div className={styles.techniques}>
              <h3 className={styles.sectionTitle}>Techniques</h3>
              <ul className={styles.techniquesList}>
                {project.techniques.map((technique) => (
                  <li key={technique}>{technique}</li>
                ))}
              </ul>
            </div>
          )}

          {project.materials && project.materials.length > 0 && (
            <div className={styles.materials}>
              <h3 className={styles.sectionTitle}>Materials</h3>
              <ul className={styles.materialsList}>
                {project.materials.map((material) => (
                  <li key={material}>{material}</li>
                ))}
              </ul>
            </div>
          )}

          {project.dimensions && (
            <div className={styles.dimensions}>
              <h3 className={styles.sectionTitle}>Dimensions</h3>
              <p>
                {typeof project.dimensions === 'string'
                  ? project.dimensions
                  : project.dimensions.width && project.dimensions.height
                    ? `${project.dimensions.width} × ${project.dimensions.height} ${project.dimensions.unit || 'cm'}`
                    : 'Dimensions not specified'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        {previousProject ? (
          <Link
            href={`/project/${previousProject.slug}`}
            className={styles.navLink}
          >
            ← {previousProject.title}
          </Link>
        ) : (
          <div />
        )}

        <Link href="/" className={styles.homeLink}>
          View All Projects
        </Link>

        {nextProject ? (
          <Link
            href={`/project/${nextProject.slug}`}
            className={styles.navLink}
          >
            {nextProject.title} →
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  )
}
