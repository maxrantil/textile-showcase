'use client'

import { memo } from 'react'
import { TextileDesign } from '@/types/sanity'
import { GalleryImage } from './GalleryImage'
import { GalleryItemInfo } from './GalleryItemInfo'

interface GalleryItemProps {
  design: TextileDesign
  index: number
  onClick: () => void
  isActive?: boolean
}

export const GalleryItem = memo(function GalleryItem({ 
  design, 
  index, 
  onClick,
  isActive = false
}: GalleryItemProps) {
  return (
    <div 
      style={{ 
        flexShrink: 0,
        scrollSnapAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <GalleryImage 
        src={design.image}
        alt={design.title}
        index={index}
        onClick={onClick}
      />
      
      <GalleryItemInfo 
        title={design.title}
        year={design.year}
      />
    </div>
  )
})
