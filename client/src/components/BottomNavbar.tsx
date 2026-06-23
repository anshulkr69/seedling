import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, FileText, FolderClosed, Settings } from 'lucide-react'

interface BottomNavItemProps {
  to: string
  icon: React.ReactNode
  label: string
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ to, icon, label }) => {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))

  return (
    <NavLink
      to={to}
      className={({ isActive: linkActive }) => {
        const active = linkActive || isActive
        return `flex flex-col items-center justify-center flex-1 py-2 text-xs font-sans font-medium transition-colors select-none ${
          active 
            ? 'text-moss dark:text-moss-dark font-semibold' 
            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-150'
        }`
      }}
    >
      {({ isActive: linkActive }) => {
        const active = linkActive || isActive
        return (
          <>
            <span className={`w-5 h-5 flex items-center justify-center transition-colors duration-150 ${
              active ? 'text-moss dark:text-moss-dark' : 'text-zinc-400 dark:text-zinc-500'
            }`}>
              {icon}
            </span>
            <span className="text-[10px] mt-1 font-medium tracking-tight">{label}</span>
          </>
        )
      }}
    </NavLink>
  )
}

export const BottomNavbar: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FAFAFA] dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around z-45 px-2 pb-[env(safe-area-inset-bottom)] transition-colors duration-150 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <BottomNavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
      <BottomNavItem to="/grants" icon={<Search size={20} />} label="Find Grants" />
      <BottomNavItem to="/applications" icon={<FileText size={20} />} label="Applications" />
      <BottomNavItem to="/vault" icon={<FolderClosed size={20} />} label="Vault" />
      <BottomNavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
    </nav>
  )
}
