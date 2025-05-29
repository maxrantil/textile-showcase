'use client'

import { useRef, useState, useEffect } from 'react'
import { urlFor } from '@/lib/sanity'
import { TextileDesign } from '@/types/sanity'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import NavigationArrows from './NavigationArrows'

interface HorizontalGalleryProps {
  designs: TextileDesign[]
}

export default function HorizontalGallery({ designs }: HorizontalGalleryProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const handleImageClick = (design: TextileDesign) => {
    // Immediate navigation without delay
    router.push(`/project/${design.slug?.current || design._id}`)
  }

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scrollToImage = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.85
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScrollPosition()
    container.addEventListener('scroll', checkScrollPosition, { passive: true })
    
    return () => container.removeEventListener('scroll', checkScrollPosition)
  }, [])

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#fafafa', position: 'relative' }}>
      <NavigationArrows
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        onScrollLeft={() => scrollToImage('left')}
        onScrollRight={() => scrollToImage('right')}
      />
      
      <div 
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          height: 'calc(100vh - 100px)',
          paddingTop: '100px',
          paddingBottom: '60px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory',
          gap: '40px',
          paddingLeft: '15vw',
          paddingRight: '15vw',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {designs.map((design, index) => (
          <div 
            key={design._id}
            style={{ 
              minWidth: '70vw',
              flexShrink: 0,
              scrollSnapAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => handleImageClick(design)}
          >
            <div style={{
              width: '100%',
              height: '70vh',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              backgroundColor: '#f5f5f5',
              overflow: 'hidden'
            }}>
              <Image
                src={urlFor(design.image).width(1200).height(800).quality(80).url()}
                alt={design.title}
                fill
                style={{
                  objectFit: 'cover'
                }}
                priority={index < 3} // Prioritize first 3 images
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            </div>

            <h3 style={{
              fontSize: '24px',
              fontWeight: 300,
              margin: '24px 0 0 0',
              textAlign: 'left', // Changed from center to left
              color: '#333',
              letterSpacing: '0.5px',
              width: '100%' // Make sure it takes full width for left alignment
            }}>
              {design.title}
            </h3>
          </div>
        ))}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
