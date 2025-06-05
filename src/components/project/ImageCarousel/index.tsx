'use client'

import { useState, useEffect } from 'react'
import { DesktopCarousel } from './DesktopCarousel'
import { MobileImageStack } from './MobileImageStack'
import { ProjectDetails } from './ProjectDetails'
import KeyboardScrollHandler from '../../KeyboardScrollHandler'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface GalleryImage {
  _key: string
  asset: SanityImageSource
  caption?: string
}

interface ImageCarouselProps {
  images?: GalleryImage[]
  mainImage: SanityImageSource
  projectTitle: string
  projectYear?: number
  projectDescription?: string
  projectMaterials?: string
  projectTechnique?: string
  projectDimensions?: string
}

export default function ImageCarousel(props: ImageCarouselProps) {
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <>
      <KeyboardScrollHandler />
      
      {isMobile ? (
        <MobileLayout {...props} />
      ) : (
        <DesktopLayout {...props} />
      )}
    </>
  )
}

// Mobile Layout Wrapper
function MobileLayout(props: ImageCarouselProps) {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#fafafa',
      paddingTop: '80px',
      paddingBottom: '60px'
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {/* Project Header */}
        <ProjectDetails {...props} isMobile={true} />
        
        {/* Images Stack */}
        <MobileImageStack 
          images={props.images}
          mainImage={props.mainImage}
          projectTitle={props.projectTitle}
        />
      </div>
    </div>
  )
}

// Desktop Layout Wrapper  
function DesktopLayout(props: ImageCarouselProps) {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 40px',
      marginTop: '80px',
      position: 'relative'
    }}>
      <DesktopCarousel 
        images={props.images}
        mainImage={props.mainImage}
        projectTitle={props.projectTitle}
      />
      
      <ProjectDetails {...props} isMobile={false} />
    </div>
  )
}
