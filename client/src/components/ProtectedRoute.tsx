import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  type: 'private' | 'auth' | 'onboarding' | 'verify'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, type }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5] dark:bg-[#18181B] transition-colors duration-150">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-moss border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-600 dark:text-zinc-400 font-sans text-sm">Loading Seedling...</p>
        </div>
      </div>
    )
  }

  const isEmailVerified = user && (user.email_confirmed_at || user.confirmed_at)
  const onboardingStep = profile?.onboarding_step ?? 1

  // Handle Routing Logic
  if (type === 'private') {
    // 1. Not authenticated -> /login
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    // 2. Email not verified -> /verify-email
    if (!isEmailVerified) {
      return <Navigate to="/verify-email" replace />
    }

    // 3. Onboarding incomplete -> Redirect to correct step
    if (onboardingStep < 5) {
      const stepMap: Record<number, string> = {
        1: '/onboarding/identity',
        2: '/onboarding/mission',
        3: '/onboarding/capacity',
        4: '/onboarding/funding'
      }
      return <Navigate to={stepMap[onboardingStep] || '/onboarding/identity'} replace />
    }
  }

  if (type === 'auth') {
    // If authenticated, redirect away from signup/login pages
    if (user) {
      if (!isEmailVerified) {
        return <Navigate to="/verify-email" replace />
      }
      if (onboardingStep < 5) {
        const stepMap: Record<number, string> = {
          1: '/onboarding/identity',
          2: '/onboarding/mission',
          3: '/onboarding/capacity',
          4: '/onboarding/funding'
        }
        return <Navigate to={stepMap[onboardingStep] || '/onboarding/identity'} replace />
      }
      return <Navigate to="/dashboard" replace />
    }
  }

  if (type === 'verify') {
    // If not authenticated -> /login
    if (!user) {
      return <Navigate to="/login" replace />
    }
    // If already verified -> redirect to onboarding or dashboard
    if (isEmailVerified) {
      if (onboardingStep < 5) {
        return <Navigate to="/onboarding/identity" replace />
      }
      return <Navigate to="/dashboard" replace />
    }
  }

  if (type === 'onboarding') {
    // If not authenticated -> /login
    if (!user) {
      return <Navigate to="/login" replace />
    }
    // If not verified -> /verify-email
    if (!isEmailVerified) {
      return <Navigate to="/verify-email" replace />
    }
    // If onboarding already complete -> /dashboard (except for /complete screen)
    if (onboardingStep >= 5 && !location.pathname.endsWith('/complete')) {
      return <Navigate to="/dashboard" replace />
    }

    // Ensure they can't skip ahead of their actual onboarding step
    const path = location.pathname
    if (path.includes('/identity') && onboardingStep !== 1) {
      return <Navigate to={`/onboarding/${getStepPath(onboardingStep)}`} replace />
    }
    if (path.includes('/mission') && onboardingStep !== 2) {
      return <Navigate to={`/onboarding/${getStepPath(onboardingStep)}`} replace />
    }
    if (path.includes('/capacity') && onboardingStep !== 3) {
      return <Navigate to={`/onboarding/${getStepPath(onboardingStep)}`} replace />
    }
    if (path.includes('/funding') && onboardingStep !== 4) {
      return <Navigate to={`/onboarding/${getStepPath(onboardingStep)}`} replace />
    }
  }

  return <>{children}</>
}

// Helper to get step path from step number
function getStepPath(step: number): string {
  switch (step) {
    case 1: return 'identity'
    case 2: return 'mission'
    case 3: return 'capacity'
    case 4: return 'funding'
    default: return 'identity'
  }
}
