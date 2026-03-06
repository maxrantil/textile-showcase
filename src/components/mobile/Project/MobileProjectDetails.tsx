// ABOUTME: Mobile project details component displaying title, description, materials, and technical specifications
'use client'

import { TextileDesign } from '@/types/textile'
import { ProjectDetails } from '@/components/shared/Project/ProjectDetails'

interface MobileProjectDetailsProps {
  project: TextileDesign
}

export function MobileProjectDetails({ project }: MobileProjectDetailsProps) {
  return <ProjectDetails project={project} classPrefix="mobile" />
}
