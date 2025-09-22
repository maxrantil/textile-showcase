// ABOUTME: Progressive hydration React hook
// Hook for managing component-level hydration state and timing

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { HydrationScheduler } from '@/utils/progressive-hydration'
import type { UseProgressiveHydrationConfig } from './types'

export function useProgressiveHydration(config: UseProgressiveHydrationConfig) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [shouldHydrate, setShouldHydrate] = useState(false)
  const [hydrationTime, setHydrationTime] = useState<number | null>(null)
  const schedulerRef = useRef<HydrationScheduler | null>(null)

  const scheduleHydration = useCallback(async () => {
    if (!schedulerRef.current) {
      schedulerRef.current = new HydrationScheduler({
        device: config.device || 'desktop',
      })
    }

    try {
      const startTime = performance.now()

      await schedulerRef.current.hydrate(config.componentId, {
        priority: config.priority,
        trigger: config.trigger,
        delay: config.delay,
        onHydrated: () => {
          const endTime = performance.now()
          setIsHydrated(true)
          setHydrationTime(endTime - startTime)
        },
      })

      setShouldHydrate(true)
    } catch (error) {
      console.error('Hydration failed:', error)
    }
  }, [config])

  useEffect(() => {
    // Auto-schedule if critical priority
    if (config.priority === 'critical') {
      scheduleHydration()
    }

    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.cleanup()
      }
    }
  }, [config.priority, scheduleHydration])

  return {
    isHydrated,
    shouldHydrate,
    hydrationTime,
    scheduleHydration,
  }
}
