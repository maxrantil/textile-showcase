// src/components/gallery/index.ts
export { GalleryImage } from './GalleryImage'
export { GalleryItemInfo } from './GalleryItemInfo'
export { GalleryItem } from './GalleryItem'
export { GalleryContainer } from './GalleryContainer'
export { GalleryIndicators } from './GalleryIndicators'
export { default as HorizontalGallery } from './HorizontalGallery'

// Export hooks for potential reuse
export { useGalleryState } from './GalleryState'
export { useGalleryNavigationLogic } from './GalleryNavigation'
export { useGalleryPreloader } from './GalleryPreloader'
export { useGalleryLifecycle } from './GalleryLifecycle'
