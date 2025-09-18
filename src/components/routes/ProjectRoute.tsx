// ABOUTME: Production-ready project route component with optimized loading
// Enhanced implementation for Phase 2B Day 3-4 advanced code splitting

import React, { Suspense, lazy, Component, ReactNode } from 'react'

// Lazy load heavy project components
const ProjectGallery = lazy(() => import('@/components/lazy/LazyGallery'))
const ProjectDetails = lazy(() => import('@/components/project/ProjectDetails'))

interface ProjectRouteProps {
  slug?: string
  preloadImages?: boolean
}

// Simple error boundary implementation
class ProjectErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: ReactNode
    onError?: (error: Error) => void
  }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center" data-testid="project-error">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading skeleton for project route
function ProjectLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" data-testid="project-skeleton">
      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  )
}

export default function ProjectRoute({
  slug,
  preloadImages = false,
}: ProjectRouteProps) {
  return (
    <ProjectErrorBoundary
      onError={(error) => {
        console.error('Project route error:', error)
        // In production, send to error tracking service
      }}
    >
      <div className="container mx-auto px-4 py-8" data-testid="project-route">
        <Suspense fallback={<ProjectLoadingSkeleton />}>
          <ProjectDetails slug={slug} />
        </Suspense>

        <Suspense
          fallback={
            <div className="mt-8 h-64 bg-gray-100 animate-pulse rounded"></div>
          }
        >
          <div className="mt-8">
            <ProjectGallery preload={preloadImages} />
          </div>
        </Suspense>
      </div>
    </ProjectErrorBoundary>
  )
}

// SEO metadata for the route
export const metadata = {
  title: 'Project | Textile Showcase',
  description:
    'Explore our textile projects with optimized loading and performance',
  openGraph: {
    title: 'Project | Textile Showcase',
    description:
      'Explore our textile projects with optimized loading and performance',
    type: 'website',
  },
}

// Performance metrics helper
export function measureRoutePerformance() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    return {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstContentfulPaint:
        performance.getEntriesByName('first-contentful-paint')[0]?.startTime ||
        0,
    }
  }
  return null
}
