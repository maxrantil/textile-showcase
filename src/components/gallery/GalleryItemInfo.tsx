'use client'

import { memo } from 'react'

interface GalleryItemInfoProps {
  title: string
  year?: number
}

export const GalleryItemInfo = memo(function GalleryItemInfo({
  title,
  year,
}: GalleryItemInfoProps) {
  return (
    <>
      <h3
        style={{
          fontSize: '24px',
          fontWeight: 300,
          margin: '24px 0 0 0',
          textAlign: 'left',
          color: '#333',
          letterSpacing: '0.5px',
          width: '100%',
        }}
      >
        {title}
      </h3>

      {year && (
        <p
          style={{
            fontSize: '16px',
            color: '#666',
            margin: '4px 0 0 0',
            width: '100%',
            textAlign: 'left',
          }}
        >
          {year}
        </p>
      )}
    </>
  )
})
