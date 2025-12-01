'use client'

import { useUser } from '@clerk/nextjs'
import { createContext, useContext, ReactNode } from 'react'

/**
 * Auth Hook using Clerk
 * 
 * This replaces the old Supabase AuthContext.
 * Use Clerk's useUser() and useAuth() hooks directly in components.
 */

interface AuthContextType {
  user: any | null
  isLoaded: boolean
  isSignedIn: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser()
  
  return {
    user,
    isLoaded,
    isSignedIn,
    // Legacy compatibility
    session: isSignedIn ? { user } : null,
    loading: !isLoaded,
  }
}

// Note: AuthProvider is no longer needed - Clerk handles this via ClerkProvider
// This file is kept for backward compatibility during migration
