// ABOUTME: Mobile project details component displaying title, description, materials, and technical specifications
'use client'

import type { ReactNode } from 'react'
import { TextileDesign } from '@/types/textile'
import { ProjectDetails } from '@/components/shared/Project/ProjectDetails'

interface MobileProjectDetailsProps {
  project: TextileDesign
  children?: ReactNode
}

export function MobileProjectDetails({
  project,
  children,
}: MobileProjectDetailsProps) {
  return (
    <ProjectDetails project={project} classPrefix="mobile">
      {children}
    </ProjectDetails>
  )
}
