// ABOUTME: Type definitions for progressive hydration components
// Shared interfaces and types for hydration system

import { ReactNode, ComponentType } from 'react'
import {
  HydrationPriority,
  HydrationTrigger,
} from '@/utils/progressive-hydration'

export interface HydrationBoundaryProps {
  children: ReactNode
  priority: HydrationPriority
  trigger?: HydrationTrigger
  fallback?: ComponentType
  delay?: number
  rootMargin?: string
  threshold?: number
  onHydrationComplete?: () => void
  onError?: (error: Error) => void
}

export interface UseProgressiveHydrationConfig {
  componentId: string
  priority: HydrationPriority
  trigger?: HydrationTrigger
  delay?: number
  device?: 'mobile' | 'desktop'
}

export interface DeferredHydrationProps {
  children: ReactNode
  componentId: string
  config: UseProgressiveHydrationConfig
  fallback?: ComponentType
}
