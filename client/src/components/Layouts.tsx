import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNavbar } from './BottomNavbar'
import { FAB } from './FAB'
import { OnboardingProgress } from './OnboardingProgress'

// Auth Layout: minimal, centered box
export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex items-center justify-center p-4 transition-colors duration-150">
      <div className="w-full max-w-[450px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-150">
        <Outlet />
      </div>
    </div>
  )
}

// Onboarding Layout: centered flow container with top step progress bar
export const OnboardingLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex flex-col transition-colors duration-150 pb-12">
      {/* Top indicator header */}
      <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-250 dark:border-zinc-800/80 transition-colors duration-150">
        <OnboardingProgress />
      </header>

      {/* Main onboarding form page */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[620px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-150">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// App Layout: Desktop sidebar, mobile bottom navbar, floating FAB
export const AppLayout: React.FC = () => {
  return (
    <div className="h-screen bg-[#F4F4F5] dark:bg-[#18181B] flex flex-row overflow-hidden transition-colors duration-150">
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
