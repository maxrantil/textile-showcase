// Update src/components/adaptive/Project/index.tsx

'use client'
import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileProjectView } from '@/components/mobile/Project'
import { DesktopProjectView } from '@/components/desktop/Project'
import { TextileDesign } from '@/types/textile'

interface ProjectProps {
  project: TextileDesign
  nextProject?: { slug: string; title: string }
  previousProject?: { slug: string; title: string }
  /** Server's request-based guess, so SSR renders the matching view (no swap) */
  initialDeviceType?: 'mobile' | 'desktop'
}

export default function ProjectView({
  project,
  nextProject,
  previousProject,
  initialDeviceType = 'desktop',
}: ProjectProps) {
  const deviceType = useDeviceType(initialDeviceType)

  return deviceType === 'mobile' ? (
    <MobileProjectView
      project={project}
      nextProject={nextProject}
      previousProject={previousProject}
    />
  ) : (
    <DesktopProjectView
      project={project}
      nextProject={nextProject}
      previousProject={previousProject}
    />
  )
}
