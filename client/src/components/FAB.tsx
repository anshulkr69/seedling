import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { GrantPickerModal } from './GrantPickerModal'

export const FAB: React.FC = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Hide FAB on application editor screens as contextually unnecessary
  const isEditorPage = location.pathname.match(/\/applications\/[a-zA-Z0-5\-_]+/)
  if (isEditorPage) return null

  return (
    <>
      <div 
        className="fixed bottom-[88px] right-6 md:bottom-6 md:right-6 z-40 select-none font-sans"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* FAB Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 border-0"
          style={{
            backgroundColor: isHovered ? '#1a1c1a' : '#000000',
            color: '#ffffff',
            width: isHovered ? '12rem' : '3.5rem', // 12rem = w-48, 3.5rem = w-14
            height: '3.5rem', // 3.5rem = h-14
            paddingLeft: isHovered ? '1.25rem' : '0px',
            paddingRight: isHovered ? '1.25rem' : '0px',
            justifyContent: isHovered ? 'flex-start' : 'center',
            borderRadius: isHovered ? '28px' : '60% 40% 55% 45% / 50% 45% 55% 50%'
          }}
          aria-label="Start New Application"
        >
          <Sprout size={22} className="animate-[pulse_4s_infinite] shrink-0" style={{ color: '#ffffff' }} />
          {isHovered && (
            <span 
              className="text-xs font-bold uppercase tracking-wider ml-2.5 whitespace-nowrap animate-[fadeIn_0.2s_ease-out]"
              style={{ color: '#ffffff' }}
            >
              New Application
            </span>
          )}
        </button>
      </div>

      <GrantPickerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
