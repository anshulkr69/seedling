import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans text-sm font-medium rounded-[6px] px-4 py-2.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-moss hover:bg-moss-hover text-white dark:bg-moss-dark dark:hover:bg-moss-dark-hover shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    secondary: 'border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
    ghost: 'text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700/50'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
