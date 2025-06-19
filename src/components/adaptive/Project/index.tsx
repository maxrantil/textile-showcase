// Update src/components/adaptive/Project/index.tsx

'use client'
import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileProjectView } from '@/components/mobile/Project'
import { DesktopProjectView } from '@/components/desktop/Project'
import { TextileDesign } from '@/sanity/types'

interface ProjectProps {
  project: TextileDesign
  nextProject?: { slug: string; title: string }
  previousProject?: { slug: string; title: string }
}

export default function ProjectView({
  project,
  nextProject,
  previousProject,
}: ProjectProps) {
  const deviceType = useDeviceType()

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
