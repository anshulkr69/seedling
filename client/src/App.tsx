import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthLayout, OnboardingLayout, AppLayout } from './components/Layouts'
import { LandingPage } from './pages/LandingPage'
import { LoginPage, SignupPage, VerifyEmailPage } from './pages/AuthPages'
import { 
  OnboardingStep1, 
  OnboardingStep2, 
  OnboardingStep3, 
  OnboardingStep4, 
  OnboardingComplete 
} from './pages/OnboardingPages'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { GrantsPage } from './pages/GrantsPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { ApplicationEditorPage } from './pages/ApplicationEditorPage'
import { VaultPage } from './pages/VaultPage'
import { GrantDetail } from './pages/GrantDetail'
import { VaultNew } from './pages/VaultNew'
import { VaultDetail } from './pages/VaultDetail'
import { ServerError } from './pages/ServerError'

const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5] dark:bg-[#18181B] p-4 text-center">
    <div className="space-y-4">
      <h1 className="font-satoshi text-8xl font-bold text-zinc-300 dark:text-zinc-800">404</h1>
      <p className="text-zinc-650 dark:text-zinc-400 font-sans text-sm font-semibold">This page doesn't exist.</p>
      <Link to="/dashboard" className="inline-block mt-2">
        <button className="bg-moss text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-[6px] px-5 py-2.5 cursor-pointer">
          Back to Dashboard
        </button>
      </Link>
    </div>
  </div>
)

// ── Main App Router ───────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Flow Routes (requires unauthenticated users) */}
          <Route element={<ProtectedRoute type="auth"><AuthLayout /></ProtectedRoute>}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          {/* Verification Pending Route */}
          <Route element={<ProtectedRoute type="verify"><AuthLayout /></ProtectedRoute>}>
            <Route path="verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* Onboarding Flow Routes (requires authenticated, unverified email) */}
          <Route path="onboarding" element={<ProtectedRoute type="onboarding"><OnboardingLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="identity" replace />} />
            <Route path="identity" element={<OnboardingStep1 />} />
            <Route path="mission" element={<OnboardingStep2 />} />
            <Route path="capacity" element={<OnboardingStep3 />} />
            <Route path="funding" element={<OnboardingStep4 />} />
            <Route path="complete" element={<OnboardingComplete />} />
          </Route>

          {/* Authenticated Dashboard Core Pages (AppLayout) */}
          <Route element={<ProtectedRoute type="private"><AppLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="grants" element={<GrantsPage />} />
            <Route path="grants/:id" element={<GrantDetail />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationEditorPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="vault/new" element={<VaultNew />} />
            <Route path="vault/:id" element={<VaultDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback Error Routes */}
          <Route path="error" element={<ServerError />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
