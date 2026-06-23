import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
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
import { MOCK_GRANTS } from './supabase'
import { FileText, FolderClosed, Search, Plus } from 'lucide-react'

// ── Mock Placeholder Pages for Navigation Integrity ───────────────────
// These minimal views ensure the sidebar works seamlessly without errors.

const GrantsPlaceholder: React.FC = () => (
  <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
    <div>
      <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Find Grants</h1>
      <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400">Pre-screened opportunities matching your statutory compliance criteria.</p>
    </div>
    
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[11px] font-sans font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pb-3">
            <th className="pb-3 pr-4 font-semibold">Grant Name</th>
            <th className="pb-3 px-4 font-semibold">Funder</th>
            <th className="pb-3 px-4 font-semibold">Causes</th>
            <th className="pb-3 px-4 font-semibold">Fit Score</th>
            <th className="pb-3 pl-4 font-semibold text-right">Deadline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {MOCK_GRANTS.map((g) => (
            <tr key={g.id} className="text-sm font-sans hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
              <td className="py-4 pr-4 font-semibold text-zinc-900 dark:text-zinc-100 max-w-xs truncate">{g.title}</td>
              <td className="py-4 px-4 text-zinc-500 dark:text-zinc-400">{g.funder}</td>
              <td className="py-4 px-4">
                <span className="bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-650 dark:text-zinc-400 px-2 py-0.5 rounded-[4px] font-semibold">{g.cause_areas.join(', ')}</span>
              </td>
              <td className="py-4 px-4">
                <span className="bg-moss-accent text-moss dark:bg-moss-dark/15 dark:text-moss-dark-hover text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  85% Fit
                </span>
              </td>
              <td className="py-4 pl-4 text-right text-zinc-500 dark:text-zinc-400 tabular">
                {new Date(g.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const ApplicationsPlaceholder: React.FC = () => (
  <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">My Applications</h1>
        <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400">Track proposal drafts and pipeline deadlines.</p>
      </div>
    </div>
    
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-12 text-center flex flex-col items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
      <h3 className="font-satoshi text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">No applications started yet</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-6">
        Select a matched grant, open details, and press "Start Application" to initialize a proposal draft.
      </p>
      <Link to="/grants">
        <button className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 flex items-center space-x-1.5 cursor-pointer">
          <Search size={14} />
          <span>Find Matched Grants</span>
        </button>
      </Link>
    </div>
  </div>
)

const VaultPlaceholder: React.FC = () => (
  <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="font-satoshi text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Memory Vault</h1>
        <p className="text-sm font-sans text-zinc-550 dark:text-zinc-400 font-normal">Your logged projects and institutional outcomes.</p>
      </div>
    </div>

    <div className="border border-zinc-200 dark:border-zinc-800 rounded-[12px] bg-white dark:bg-zinc-900 p-12 text-center flex flex-col items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <FolderClosed className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
      <h3 className="font-satoshi text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Your Memory Vault is empty</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
        Logging past projects builds up your organization's memory, which is used to automatically generate evidence sections in new proposals.
      </p>
      <button 
        onClick={() => alert('Log Project action triggered')}
        className="bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-4 py-2 flex items-center space-x-1.5 cursor-pointer"
      >
        <Plus size={14} />
        <span>Log Your First Project</span>
      </button>
    </div>
  </div>
)

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

export default function App() {
  return (
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
            <Route path="grants" element={<GrantsPlaceholder />} />
            <Route path="applications" element={<ApplicationsPlaceholder />} />
            <Route path="vault" element={<VaultPlaceholder />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback Error Routes */}
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
