// src/components/adaptive/Project/index.tsx
'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileProjectView } from '@/components/mobile/Project/MobileProjectView'
import { DesktopProjectView } from '@/components/desktop/Project/DesktopProjectView'
import { TextileDesign } from '@/sanity/types'

interface ProjectProps {
  project: TextileDesign
}

export default function ProjectView({ project }: ProjectProps) {
  const deviceType = useDeviceType()

  return deviceType === 'mobile' ? (
    <MobileProjectView project={project} />
  ) : (
    <DesktopProjectView project={project} />
  )
}
