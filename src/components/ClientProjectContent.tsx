// ABOUTME: Client-side project content component that fetches project data from API
// Handles client-side data fetching with loading states and error handling for individual projects

'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { TextileDesign } from '@/types/textile'
import { ProjectContent } from '@/app/project/[slug]/components/project-content'

interface ClientProjectContentProps {
  slug: string
}

export function ClientProjectContent({ slug }: ClientProjectContentProps) {
  const [project, setProject] = useState<TextileDesign | null>(null)
  const [nextProject, setNextProject] = useState<
    | {
        slug: string
        title: string
      }
    | undefined
  >(undefined)
  const [previousProject, setPreviousProject] = useState<
    | {
        slug: string
        title: string
      }
    | undefined
  >(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        console.log(`🔍 Client: Fetching project from API: ${slug}`)

        const response = await fetch(`/api/projects/${slug}`, {
          cache: 'force-cache',
        })

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`⚠️ Client: Project not found: ${slug}`)
            notFound()
            return
          }
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.project) {
          console.warn(`⚠️ Client: Project not found: ${slug}`)
          notFound()
          return
        }

        console.log(
          `✅ Client: Successfully fetched project: ${data.project.title}`
        )
        setProject(data.project)
        setNextProject(data.nextProject || undefined)
        setPreviousProject(data.previousProject || undefined)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`❌ Client: Failed to fetch project ${slug}:`, message)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [slug])

  if (loading) {
    return (
      <div
        className="full-height-mobile"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="nordic-container" style={{ textAlign: 'center' }}>
          <div className="nordic-body">Loading project...</div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div
        className="full-height-mobile"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="nordic-container" style={{ textAlign: 'center' }}>
          <h2 className="nordic-h2 nordic-spacing-sm">
            Unable to load project
          </h2>
          <p className="nordic-body">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  return (
    <ProjectContent
      project={project}
      slug={slug}
      nextProject={nextProject}
      previousProject={previousProject}
    />
  )
}
