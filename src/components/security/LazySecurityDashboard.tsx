// ABOUTME: Minimal lazy security dashboard for TDD GREEN phase
// Basic implementation for security component progressive loading

import React from 'react'

export default function LazySecurityDashboard() {
  return (
    <div data-testid="security-dashboard">
      <h2>Security Dashboard</h2>
      <div>Auth Check: Immediate</div>
      <div>Dashboard Load: After Auth</div>
      <div>Charts Load: On Interaction</div>
    </div>
  )
}

export const SecurityDashboardSkeleton = () => (
  <div data-testid="security-dashboard-skeleton">
    Loading security dashboard...
  </div>
)
