import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNavbar } from './BottomNavbar'
import { FAB } from './FAB'
import { OnboardingProgress } from './OnboardingProgress'

// Auth Layout: minimal, centered box
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4 transition-colors duration-150">
      <div className="w-full max-w-[450px] bg-bg-surface border border-border-base rounded-[10px] p-6 md:p-8 shadow-none transition-colors duration-150">
        <Outlet />
      </div>
    </div>
  )
}

// Onboarding Layout: centered flow container with top step progress bar
export const OnboardingLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col transition-colors duration-150 pb-12">
      {/* Top indicator header */}
      <header className="w-full bg-bg-surface border-b border-border-base transition-colors duration-150">
        <OnboardingProgress />
      </header>

      {/* Main onboarding form page */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[620px] bg-bg-surface border border-border-base rounded-[10px] p-6 md:p-8 shadow-none transition-colors duration-150">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// App Layout: Desktop sidebar, mobile bottom navbar, floating FAB
export const AppLayout: React.FC = () => {
  return (
    <div className="h-screen bg-bg-page flex flex-row overflow-hidden transition-colors duration-150">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Bottom Navbar - Mobile Only */}
        <BottomNavbar />

        {/* Floating Action Button */}
        <FAB />
      </div>
    </div>
  )
}
