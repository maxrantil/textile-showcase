export const GALLERY_CONFIG = {
  itemHeight: 70, // vh
  gap: 80, // px
  padding: '45vw',
  scrollBehavior: 'smooth' as const,
  restorationDelay: 50,
  preloadCount: 3,
  headerOffset: 60,
} as const

export const GALLERY_STYLES = {
  container: {
    height: '100vh',
    overflow: 'hidden',
    background: '#fafafa',
    position: 'relative' as const,
  },
  scroller: {
    display: 'flex',
    gap: `${GALLERY_CONFIG.gap}px`,
    paddingLeft: GALLERY_CONFIG.padding,
    paddingRight: GALLERY_CONFIG.padding,
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    WebkitOverflowScrolling: 'touch' as const,
  },
} as const
