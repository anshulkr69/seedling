import React, { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, FileText, FolderClosed, Settings, LogOut, Plus, Sprout } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GrantPickerModal } from './GrantPickerModal'

interface SidebarItemProps {
  to: string
  icon: React.ReactNode
  label: string
  isExpanded: boolean
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, isExpanded }) => {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))

  return (
    <NavLink
      to={to}
      className={({ isActive: linkActive }) => {
        const active = linkActive || isActive
        return `flex items-center rounded-[6px] text-[13px] font-sans font-semibold transition-all duration-300 ease-in-out group select-none ${
          isExpanded ? 'px-3 py-2.5 space-x-3 w-full' : 'justify-center p-2.5 w-10 h-10 mx-auto'
        } ${
          active 
            ? 'bg-moss-accent text-text-primary font-semibold' 
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        }`
      }}
    >
      {({ isActive: linkActive }) => {
        const active = linkActive || isActive
        return (
          <>
            <span className={`w-5 h-5 flex items-center justify-center transition-colors duration-150 shrink-0 ${
              active 
                ? 'text-text-primary' 
                : 'text-text-secondary group-hover:text-text-primary'
            }`}>
              {icon}
            </span>
            {isExpanded && (
              <span className="truncate transition-opacity duration-200 animate-[fadeIn_0.2s_ease-out]">
                {label}
              </span>
            )}
          </>
        )
      }}
    </NavLink>
  )
}

export const Sidebar: React.FC = () => {
  const { signOut } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <aside 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`h-screen bg-bg-sidebar border-r border-border-base flex flex-col py-6 transition-all duration-300 ease-in-out shrink-0 select-none ${
          isExpanded ? 'w-[240px] px-4' : 'w-[72px] px-2'
        }`}
      >
        {/* Header/Logo (Old Lively Sprout Logo + Satoshi Wordmark) */}
        <Link 
          to="/dashboard"
          className={`flex items-center mb-6 py-4 overflow-hidden border-b-0 cursor-pointer ${
            isExpanded ? 'space-x-3 px-2' : 'justify-center'
          }`}
        >
          <Sprout 
            className="w-6 h-6 text-[#2D5016] dark:text-[#5B9330] animate-[bounce_4s_infinite] shrink-0" 
          />
          {isExpanded && (
            <h1 className="font-satoshi text-base font-bold text-text-primary tracking-tight leading-none animate-[fadeIn_0.2s_ease-out]">
              Seedling
            </h1>
          )}
        </Link>

        {/* CTA (New Application Sprout Button / Expandable) */}
        <div className="flex justify-center mb-6 w-full">
          <button 
            onClick={() => setIsModalOpen(true)}
            className={`font-sans transition-all duration-300 flex items-center justify-center cursor-pointer border-0 shadow-none overflow-hidden shrink-0 ${
              isExpanded 
                ? 'w-full text-xs font-semibold uppercase tracking-wider py-3 rounded-[6px] space-x-1.5 bg-[#2D5016] dark:bg-[#5B9330] text-white hover:bg-emerald-800 dark:hover:bg-emerald-655' 
                : 'w-10 h-10 rounded-[50%] hover:scale-105 active:scale-95 bg-black dark:bg-[#f4f6f5] text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-[#b4ccc1]'
            }`}
            style={!isExpanded ? { borderRadius: '60% 40% 55% 45% / 50% 45% 55% 50%' } : undefined}
            title={!isExpanded ? "New Application" : undefined}
          >
            {isExpanded ? (
              <>
                <Plus size={16} />
                <span className="animate-[fadeIn_0.2s_ease-out]">New Application</span>
              </>
            ) : (
              <Plus size={18} className="animate-[pulse_4s_infinite]" />
            )}
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-grow flex flex-col space-y-6">
          <div>
            {isExpanded ? (
              <div className="px-4 text-[10px] font-sans font-semibold text-text-secondary uppercase tracking-widest mb-2 select-none">
                Discover
              </div>
            ) : (
              <div className="border-t border-border-base/50 my-2 mx-2" />
            )}
            <div className="flex flex-col space-y-1">
              <SidebarItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" isExpanded={isExpanded} />
              <SidebarItem to="/grants" icon={<Search size={18} />} label="Find Grants" isExpanded={isExpanded} />
            </div>
          </div>

          <div>
            {isExpanded ? (
              <div className="px-4 text-[10px] font-sans font-semibold text-text-secondary uppercase tracking-widest mb-2 select-none">
                Manage
              </div>
            ) : (
              <div className="border-t border-border-base/50 my-2 mx-2" />
            )}
            <div className="flex flex-col space-y-1">
              <SidebarItem to="/applications" icon={<FileText size={18} />} label="My Applications" isExpanded={isExpanded} />
              <SidebarItem to="/vault" icon={<FolderClosed size={18} />} label="Memory Vault" isExpanded={isExpanded} />
            </div>
          </div>

          <div>
            {isExpanded ? (
              <div className="px-4 text-[10px] font-sans font-semibold text-text-secondary uppercase tracking-widest mb-2 select-none">
                Account
              </div>
            ) : (
              <div className="border-t border-border-base/50 my-2 mx-2" />
            )}
            <div className="flex flex-col space-y-1">
              <SidebarItem to="/settings" icon={<Settings size={18} />} label="Settings" isExpanded={isExpanded} />
              
              <button
                onClick={signOut}
                className={`flex items-center text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-all duration-150 cursor-pointer border-0 text-left shrink-0 ${
                  isExpanded ? 'px-3 py-2.5 space-x-3 w-full rounded-[6px] text-[13px] font-medium' : 'justify-center p-2.5 w-10 h-10 mx-auto rounded-[6px]'
                }`}
                title={!isExpanded ? "Log Out" : undefined}
              >
                <LogOut size={18} className="shrink-0" />
                {isExpanded && (
                  <span className="truncate animate-[fadeIn_0.2s_ease-out]">Log Out</span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <GrantPickerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
