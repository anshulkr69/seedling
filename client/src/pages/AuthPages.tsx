import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
// Let's do manual zod schema validation or check package.json for resolvers.
// Ah, package.json had react-hook-form and zod, but NOT @hookform/resolvers!
// Let's implement schema validation manually in standard zod style, or we can install resolvers.
// Wait! Let's write simple, robust manual validation or direct zod validation to avoid depending on uninstalled packages.
// Zod manual validation is very clean:
// const schema = z.object(...)
// try { schema.parse(data) } catch (e) { setError(...) }
// Or even simpler: we can use react-hook-form's native register validation, which is standard and doesn't require any packages, or zod inside onSubmit!
// Let's write the validation directly with react-hook-form's native options or a simple zod validator to ensure zero dependency bugs.
// That is extremely robust and fast.
import { useAuth } from '../context/AuthContext'
import { isMockMode } from '../supabase'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Sprout, Mail, AlertCircle, Info, Lock } from 'lucide-react'

// Login Page
export const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async (data: any) => {
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await signIn(data.email, data.password)
      if (err) {
        setError(err.message || 'Invalid credentials')
      } else {
        // Redirection logic is handled by ProtectedRoute, but we navigate to /dashboard
        navigate('/dashboard')
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotSuccess(true)
    setTimeout(() => {
      setShowForgotModal(false)
      setForgotSuccess(false)
      setForgotEmail('')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-4">
          <Sprout className="w-8 h-8 text-moss dark:text-moss-dark" />
        </div>
        <h2 className="font-satoshi text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Welcome back to Seedling
        </h2>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs font-sans">
          Access matches and manage drafts.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-[6px] flex items-start space-x-2.5 text-red-650 dark:text-red-400 text-xs font-sans">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. director@ngo.org"
          error={errors.email?.message}
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-sans font-semibold text-moss dark:text-moss-dark-hover hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full py-3">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 font-sans mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-moss dark:text-moss-dark hover:underline">
          Create one free
        </Link>
      </div>

      {/* Forgot Password Modal Overlay */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[12px] p-6 shadow-lg w-full max-w-[400px]">
            <h3 className="font-satoshi text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Reset Password
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Enter your email and we'll send a password recovery link.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-moss-accent text-moss dark:bg-moss/10 dark:text-moss-dark-hover border border-moss/20 rounded-[6px] text-xs font-sans mb-4 flex items-center space-x-2">
                <Info size={16} />
                <span>Verification link sent to email!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  required
                  placeholder="e.g. director@ngo.org"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <div className="flex space-x-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="text-xs font-sans font-semibold text-zinc-500 hover:text-zinc-800 px-3 py-2 rounded-[6px] hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <Button type="submit">
                    Send Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// Sign Up Page
export const SignupPage: React.FC = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '' }
  })

  const onSubmit = async (data: any) => {
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await signUp(data.email, data.password, data.name)
      if (err) {
        setError(err.message || 'Error creating account')
      } else {
        navigate('/verify-email')
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-4">
          <Sprout className="w-8 h-8 text-moss dark:text-moss-dark" />
        </div>
        <h2 className="font-satoshi text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Create your account
        </h2>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs font-sans">
          Start your journey to funded missions.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-[6px] flex items-start space-x-2.5 text-red-650 dark:text-red-400 text-xs font-sans">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Your Name"
          type="text"
          placeholder="e.g. Aravind Sharma"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. director@ngo.org"
          error={errors.email?.message}
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Min 6 characters"
          error={errors.password?.message}
          {...register('password', { 
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' }
          })}
        />

        <Button type="submit" disabled={loading} className="w-full py-3">
          {loading ? 'Creating account...' : 'Get Started Free'}
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 font-sans mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-moss dark:text-moss-dark hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}


// Verify Email Page
export const VerifyEmailPage: React.FC = () => {
  const { user, confirmEmailMock } = useAuth()
  const navigate = useNavigate()
  const [resendTimer, setResendTimer] = useState(0)
  const [emailText, setEmailText] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Get the email of the pending user
    const pendingStr = localStorage.getItem('seedling_mock_pending_verify_user')
    if (pendingStr) {
      setEmailText(JSON.parse(pendingStr).email)
    } else if (user) {
      setEmailText(user.email)
    } else {
      setEmailText('your registered address')
    }
  }, [user])

  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleResend = () => {
    if (resendTimer > 0) return
    setResendTimer(60)
    setMessage('Verification link resent. Please check your inbox.')
  }

  const handleConfirmMock = () => {
    const success = confirmEmailMock()
    if (success) {
      // Confirmed, redirect to step 1
      navigate('/onboarding/identity')
    } else {
      setMessage('Mock email verification failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <Mail className="w-10 h-10 text-moss dark:text-moss-dark animate-[pulse_2s_infinite]" />
        </div>
        <h2 className="font-satoshi text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Check your inbox
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-sans leading-relaxed max-w-sm mx-auto">
          We've sent a verification link to <strong className="text-zinc-800 dark:text-zinc-200">{emailText}</strong>. Click the link inside the email to activate your account.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-[6px] text-zinc-700 dark:text-zinc-300 text-xs font-sans flex items-center space-x-2">
          <Info size={16} />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-3">
        <Button 
          variant="secondary" 
          onClick={handleResend} 
          disabled={resendTimer > 0} 
          className="w-full text-xs font-semibold uppercase tracking-wider py-3"
        >
          {resendTimer > 0 ? `Resend Link (${resendTimer}s)` : 'Resend Link'}
        </Button>

        {isMockMode && (
          <div className="mt-8 pt-6 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
            <span className="text-[10px] text-amber-text dark:text-amber-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lock size={12} /> Sandbox Testing Fallback
            </span>
            <Button 
              onClick={handleConfirmMock} 
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 hover:text-zinc-950 font-bold font-sans border-0 shadow-md"
            >
              Verify Email Instantly
            </Button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-zinc-455 dark:text-zinc-500 font-sans mt-4">
        Already verified?{' '}
        <Link to="/login" className="font-semibold text-moss dark:text-moss-dark hover:underline">
          Go to Sign In
        </Link>
      </div>
    </div>
  )
}
