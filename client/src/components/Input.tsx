import React from 'react'

// Standard Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`
  
  return (
    <div className="w-full flex flex-col space-y-1.5">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-zinc-700 dark:text-zinc-300 font-sans text-xs font-semibold uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3.5 py-2 text-sm font-sans placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline focus:outline-2 focus:outline-moss dark:focus:outline-moss-dark focus:-outline-offset-1 disabled:opacity-50 transition-colors ${error ? 'border-red-500 focus:outline-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-red-500 text-xs font-sans mt-0.5">{error}</span>
      )}
      {helperText && !error && (
        <span className="text-zinc-400 dark:text-zinc-500 text-xs font-sans mt-0.5">{helperText}</span>
      )}
    </div>
  )
})

Input.displayName = 'Input'


// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`

  return (
    <div className="w-full flex flex-col space-y-1.5">
      {label && (
        <label 
          htmlFor={textareaId} 
          className="text-zinc-700 dark:text-zinc-300 font-sans text-xs font-semibold uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`w-full rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3.5 py-2 text-sm font-sans placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline focus:outline-2 focus:outline-moss dark:focus:outline-moss-dark focus:-outline-offset-1 disabled:opacity-50 transition-colors ${error ? 'border-red-500 focus:outline-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-red-500 text-xs font-sans mt-0.5">{error}</span>
      )}
      {helperText && !error && (
        <span className="text-zinc-400 dark:text-zinc-500 text-xs font-sans mt-0.5">{helperText}</span>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'


// Select
interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helperText?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`

  return (
    <div className="w-full flex flex-col space-y-1.5">
      {label && (
        <label 
          htmlFor={selectId} 
          className="text-zinc-700 dark:text-zinc-300 font-sans text-xs font-semibold uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3.5 py-2.5 text-sm font-sans focus:outline focus:outline-2 focus:outline-moss dark:focus:outline-moss-dark focus:-outline-offset-1 disabled:opacity-50 transition-colors ${error ? 'border-red-500 focus:outline-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-red-500 text-xs font-sans mt-0.5">{error}</span>
      )}
      {helperText && !error && (
        <span className="text-zinc-400 dark:text-zinc-500 text-xs font-sans mt-0.5">{helperText}</span>
      )}
    </div>
  )
})

Select.displayName = 'Select'


// Checkbox
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-start space-x-3 py-1">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`w-4 h-4 rounded border-zinc-300 text-moss focus:ring-moss dark:border-zinc-700 dark:bg-zinc-800 dark:text-moss-dark dark:focus:ring-moss-dark cursor-pointer mt-0.5 ${className}`}
          {...props}
        />
        <label 
          htmlFor={checkboxId}
          className="text-zinc-700 dark:text-zinc-300 font-sans text-sm font-medium select-none cursor-pointer leading-tight"
        >
          {label}
        </label>
      </div>
      {error && (
        <span className="text-red-500 text-xs font-sans pl-7">{error}</span>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'


// Toggle (Switch)
interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  helperText?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  helperText
}) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50">
      <div className="flex flex-col space-y-0.5">
        <span className="text-sm font-sans font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
        {helperText && <span className="text-xs font-sans text-zinc-400 dark:text-zinc-500">{helperText}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 dark:focus:ring-moss-dark ${
          checked ? 'bg-moss dark:bg-moss-dark' : 'bg-zinc-200 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}


// Stepper (Number Input)
interface StepperProps {
  label: string
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
}

export const Stepper: React.FC<StepperProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 100000
}) => {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1)
  }

  const handleIncrement = () => {
    if (value < max) onChange(value + 1)
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50">
      <span className="text-sm font-sans font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
      <div className="flex items-center space-x-1 border border-zinc-200 dark:border-zinc-700 rounded-[6px] p-0.5 bg-zinc-50 dark:bg-zinc-800/50">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-750 disabled:opacity-30 rounded-[4px] font-bold transition-colors"
        >
          -
        </button>
        <span className="w-10 text-center font-sans text-sm font-medium text-zinc-900 dark:text-zinc-150 tabular">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-750 disabled:opacity-30 rounded-[4px] font-bold transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
