/**
 * ABOUTME: SecurityProvider context for authentication and security state management
 * Provides user authentication state and audit logging functionality
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface User {
  readonly id: string
  readonly roles: readonly string[]
  readonly sessionExpired?: boolean
}

interface AuditLogEntry {
  readonly action: string
  readonly userId?: string
  readonly timestamp: Date
  readonly severity?: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

interface SecurityContextType {
  readonly user: User | null
  readonly auditLogger: ((entry: AuditLogEntry) => void) | null
  readonly locale: string | null
}

const SecurityContext = createContext<SecurityContextType>({
  user: null,
  auditLogger: null,
  locale: 'en',
})

interface SecurityProviderProps {
  readonly children: ReactNode
  readonly user?: User | null
  readonly locale?: string
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  user = null,
  locale = 'en',
}) => {
  const auditLogger = (entry: AuditLogEntry) => {
    console.log('Security Audit:', entry)
  }

  const contextValue: SecurityContextType = {
    user,
    auditLogger,
    locale,
  }

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  )
}

export const useSecurityContext = () => {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider')
  }
  return context
}
