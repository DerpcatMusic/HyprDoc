'use client'

import { AuthProvider } from '@/context/AuthContext'
import { DocumentProvider } from '@/context/DocumentContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DocumentProvider>
          {children}
        </DocumentProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}


