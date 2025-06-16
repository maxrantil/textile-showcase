'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileProjectView } from '@/components/mobile/Project'
import { DesktopProjectView } from '@/components/desktop/Project'
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
