import React from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, FileText, FolderClosed, Settings, Sprout } from 'lucide-react'

// Custom irregular SVG blob path that stretches using preserveAspectRatio="none"
const ActiveBlob: React.FC = () => (
  <svg
    viewBox="0 0 200 40"
    fill="none"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full -z-10 text-moss-accent dark:text-moss-dark/15 fill-current animate-[pulse_3s_infinite_ease-in-out]"
  >
    <path d="M12,4 C35,2 80,5 140,2 C185,-1 192,6 195,14 C198,22 195,30 185,34 C165,39 90,36 30,38 C8,39 3,32 2,24 C1,16 3,6 12,4 Z" />
  </svg>
)

interface SidebarItemProps {
  to: string
  icon: React.ReactNode
  label: string
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label }) => {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))

  return (
    <NavLink
      to={to}
      className={({ isActive: linkActive }) => {
        const active = linkActive || isActive
        return `relative flex items-center space-x-3 px-4 py-2.5 rounded-[6px] text-[13px] font-sans font-medium transition-all duration-150 group select-none ${
          active 
            ? 'text-moss dark:text-moss-dark-hover font-semibold' 
            : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'
        }`
      }}
    >
      {({ isActive: linkActive }) => {
        const active = linkActive || isActive
        return (
          <>
            {active && <ActiveBlob />}
            <span className={`w-5 h-5 flex items-center justify-center transition-colors duration-150 ${
              active 
                ? 'text-moss dark:text-moss-dark' 
                : 'text-zinc-400 group-hover:text-zinc-650 dark:group-hover:text-zinc-200'
            }`}>
              {icon}
            </span>
            <span>{label}</span>
          </>
        )
      }}
    </NavLink>
  )
}

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-[240px] h-screen bg-[#FAFAFA] dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col py-6 px-4 shrink-0 transition-colors duration-150">
      {/* Wordmark */}
      <div className="px-4 mb-8">
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <Sprout className="w-5 h-5 text-moss dark:text-moss-dark animate-[bounce_4s_infinite]" />
          <span className="font-satoshi text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-moss dark:group-hover:text-moss-dark transition-colors">
            Seedling
          </span>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 flex flex-col space-y-6">
        <div>
          <div className="px-4 text-[10px] font-sans font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 select-none">
            Discover
          </div>
          <div className="flex flex-col space-y-1">
            <SidebarItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <SidebarItem to="/grants" icon={<Search size={18} />} label="Find Grants" />
          </div>
        </div>

        <div>
          <div className="px-4 text-[10px] font-sans font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 select-none">
            Manage
          </div>
          <div className="flex flex-col space-y-1">
            <SidebarItem to="/applications" icon={<FileText size={18} />} label="My Applications" />
            <SidebarItem to="/vault" icon={<FolderClosed size={18} />} label="Memory Vault" />
          </div>
        </div>

        <div>
          <div className="px-4 text-[10px] font-sans font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 select-none">
            Account
          </div>
          <div className="flex flex-col space-y-1">
            <SidebarItem to="/settings" icon={<Settings size={18} />} label="Profile & Settings" />
          </div>
        </div>
      </nav>
    </aside>
  )
}
