// ABOUTME: Desktop project details component displaying title, description, materials, and technical specifications
'use client'

import { TextileDesign } from '@/types/textile'
import { ProjectDetails } from '@/components/shared/Project/ProjectDetails'

interface DesktopProjectDetailsProps {
  project: TextileDesign
}

export function DesktopProjectDetails({ project }: DesktopProjectDetailsProps) {
  return <ProjectDetails project={project} classPrefix="desktop" />
}
