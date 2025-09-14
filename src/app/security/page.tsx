/**
 * ABOUTME: Security dashboard page for App Router - integrates SecurityDashboard component
 * Provides comprehensive security monitoring interface with real-time updates
 */

'use client'

import { lazy, Suspense } from 'react'

// Lazy load the SecurityDashboard to reduce initial bundle size
const SecurityDashboard = lazy(() =>
  import('@/components/security/SecurityDashboard').then((module) => ({
    default: module.SecurityDashboard,
  }))
)

// Mock user data - in production, this would come from authentication
const mockUser = {
  id: 'admin-user',
  roles: ['security_admin', 'system_admin'],
  permissions: [
    'security:read',
    'security:write',
    'credentials:manage',
    'audit:access',
  ],
}

export default function SecurityPage() {
  return (
    <>
      <style jsx global>{`
        header {
          display: none !important;
        }
        .desktop-header {
          display: none !important;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-lg">Loading Security Dashboard...</div>
              </div>
            }
          >
            <SecurityDashboard user={mockUser} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
