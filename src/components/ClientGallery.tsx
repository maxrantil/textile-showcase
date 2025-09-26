// ABOUTME: Client-side gallery component that fetches textile designs from API
// Handles client-side data fetching with loading states and error handling

'use client'

import { useState, useEffect } from 'react'
import { TextileDesign } from '@/types/textile'
import Gallery from '@/components/adaptive/Gallery'
import { GalleryLoadingSkeleton } from '@/components/ui/LoadingSpinner'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function ClientGallery() {
  const [designs, setDesigns] = useState<TextileDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDesigns() {
      try {
        console.log('🔍 Client: Fetching designs from API...')

        const response = await fetch('/api/projects', {
          cache: 'force-cache',
        })

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()
        const fetchedDesigns = data.designs || []

        console.log(
          `✅ Client: Successfully fetched ${fetchedDesigns.length} designs`
        )
        setDesigns(fetchedDesigns)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('❌ Client: Failed to fetch designs:', message)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchDesigns()
  }, [])

  if (loading) {
    return <GalleryLoadingSkeleton />
  }

  if (error) {
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
            Unable to load designs
          </h2>
          <p className="nordic-body">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  if (!designs || designs.length === 0) {
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
          <h2 className="nordic-h2 nordic-spacing-sm">No designs available</h2>
          <p className="nordic-body">Please check back later for new work.</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Gallery designs={designs} />
    </ErrorBoundary>
  )
}
