'use client'

import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import { DocumentProvider } from '@/context/DocumentContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ClerkProvider>
        <ConvexClientProvider>
          <DocumentProvider>
            {children}
          </DocumentProvider>
        </ConvexClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  )
}

