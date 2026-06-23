import React from 'react'
import { useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'

interface Step {
  number: number
  label: string
  path: string
}

const STEPS: Step[] = [
  { number: 1, label: 'Org Identity', path: '/onboarding/identity' },
  { number: 2, label: 'Mission & Cause', path: '/onboarding/mission' },
  { number: 3, label: 'Capacity & Compliance', path: '/onboarding/capacity' },
  { number: 4, label: 'Funding Needs', path: '/onboarding/funding' }
]

// Wobbly organic connector path representing a small vine or root
const OrganicConnector: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex-1 relative h-6 mx-2 min-w-[30px] md:min-w-[80px]">
    <svg
      viewBox="0 0 100 20"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute inset-0 w-full h-full stroke-[3] transition-colors duration-300 ${
        active ? 'text-moss dark:text-moss-dark' : 'text-zinc-200 dark:text-zinc-800'
      }`}
    >
      <path d="M 0,10 Q 25,3 50,11 T 100,10" strokeLinecap="round" />
    </svg>
  </div>
)

export const OnboardingProgress: React.FC = () => {
  const location = useLocation()
  
  // Find current step number based on route path name
  const getCurrentStep = (): number => {
    const path = location.pathname
    if (path.includes('/identity')) return 1
    if (path.includes('/mission')) return 2
    if (path.includes('/capacity')) return 3
    if (path.includes('/funding')) return 4
    if (path.includes('/complete')) return 5
    return 1
  }

  const currentStep = getCurrentStep()

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8 select-none">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.number
          const isActive = currentStep === step.number

          return (
            <React.Fragment key={step.number}>
              {/* Step bubble */}
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-satoshi font-semibold text-sm transition-all duration-300 border-2 ${
                    isCompleted 
                      ? 'bg-moss border-moss text-white dark:bg-moss-dark dark:border-moss-dark' 
                      : isActive 
                        ? 'border-moss text-moss dark:border-moss-dark dark:text-moss-dark-hover bg-white dark:bg-zinc-900 shadow-[0_0_8px_rgba(74,124,37,0.2)]'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-white dark:bg-zinc-900'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} className="animate-[scaleIn_0.2s_ease-out]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                
                <span 
                  className={`absolute top-12 whitespace-nowrap text-[11px] font-sans font-semibold uppercase tracking-wider transition-colors duration-300 ${
                    isActive 
                      ? 'text-moss dark:text-moss-dark' 
                      : isCompleted
                        ? 'text-zinc-700 dark:text-zinc-300'
                        : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Render connector between bubbles */}
              {idx < STEPS.length - 1 && (
                <OrganicConnector active={currentStep > step.number} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
