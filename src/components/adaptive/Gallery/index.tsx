// EMERGENCY FIX: Direct imports for immediate SSR (Issue #39)
import { TextileDesign } from '@/types/textile'
import { DesktopGallery } from '@/components/desktop/Gallery'

interface GalleryProps {
  designs: TextileDesign[]
}

export default function Gallery({ designs }: GalleryProps) {
  // EMERGENCY: Default to desktop layout for immediate SSR, no client-side detection needed
  // This eliminates all JavaScript execution delays on the critical path
  return <DesktopGallery designs={designs} />
}
