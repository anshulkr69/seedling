import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { GrantPickerModal } from './GrantPickerModal'

export const FAB: React.FC = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Hide FAB on application editor screens as contextually unnecessary
  const isEditorPage = location.pathname.match(/\/applications\/[a-zA-Z0-5\-_]+/)
  if (isEditorPage) return null

  return (
    <>
      <div 
        className="fixed bottom-[88px] right-6 md:bottom-6 md:right-6 z-40"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-[68px] right-1/2 translate-x-1/2 bg-zinc-950 dark:bg-zinc-800 text-white text-[11px] font-sans font-medium px-2.5 py-1 rounded-[4px] whitespace-nowrap shadow-md pointer-events-none animate-[fadeIn_0.15s_ease-out] z-50">
            Start New Application
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950 dark:border-t-zinc-800"></div>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-moss hover:bg-moss-hover dark:bg-moss-dark dark:hover:bg-moss-dark-hover text-white flex items-center justify-center shadow-[0_4px_14px_rgba(45,80,22,0.25)] hover:shadow-[0_6px_20px_rgba(45,80,22,0.35)] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 dark:focus:ring-moss-dark"
          style={{
            borderRadius: '60% 40% 55% 45% / 50% 45% 55% 50%'
          }}
          aria-label="Start New Application"
        >
          <Sprout size={22} className="animate-[pulse_4s_infinite]" />
        </button>
      </div>

      <GrantPickerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
