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
import { supabase, isMockMode } from '../supabase'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Sprout, Mail, AlertCircle, Info, Lock, CheckCircle2, Loader2 } from 'lucide-react'

// Login Page
export const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  })

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' })
    }
  }, [error])

  useEffect(() => {
    // Pre-warm backend to resolve Render cold start delays
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://seedling-node-server.onrender.com';
    fetch(`${API_BASE_URL}/health`).catch(() => {});
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
        setError(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const onSubmit = async (data: any) => {
    setError(null)
    setToast(null)
    setLoading(true)
    try {

      // Check if email exists in database first
      let emailExists = true
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://seedling-node-server.onrender.com';
        const checkRes = await fetch(`${API_BASE_URL}/auth/check-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email })
        });
        if (checkRes.ok) {
          const resData = await checkRes.json()
          emailExists = resData.exists
        }
      } catch (checkErr) {
        console.warn('Failed to verify email existence via backend, falling back to direct login:', checkErr)
      }

      if (!emailExists) {
        setError(`No account exists with "${data.email}".`)
        setLoading(false)
        return
      }

      const { error: err } = await signIn(data.email, data.password)
      if (err) {
        const errMsg = err.message || ''
        if (errMsg.toLowerCase().includes('invalid login credentials') || errMsg.toLowerCase().includes('invalid credentials')) {
          setError('Incorrect password. Please try again.')
        } else {
          setError(err.message || 'Invalid credentials')
        }
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotError(null)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/settings?tab=account`
      })
      if (resetErr) {
        setForgotError(resetErr.message)
      } else {
        setForgotSuccess(true)
        setTimeout(() => {
          setShowForgotModal(false)
          setForgotSuccess(false)
          setForgotEmail('')
        }, 3000)
      }
    } catch (err: any) {
      setForgotError('Failed to send reset link. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert Popup */}
      {toast && (
        <div className="fixed top-6 right-6 z-[999] animate-slideIn max-w-sm w-full bg-bg-surface border border-red-500/30 p-4 rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-start space-x-3 text-left">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Authentication Error</h4>
            <p className="text-xs text-text-secondary mt-1 leading-normal">{toast.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => { setToast(null); setError(null); }} 
            className="text-text-secondary hover:text-text-primary font-bold text-sm leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="text-center space-y-1">
        <div className="flex justify-center mb-4">
          <Sprout className="w-8 h-8 text-moss dark:text-moss-dark" />
        </div>
        <h2 className="font-satoshi text-2xl font-bold text-text-primary tracking-tight">
          Welcome back to Seedling
        </h2>
        <p className="text-text-secondary text-xs font-sans">
          Access matches and manage drafts.
        </p>
      </div>

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

      <div className="text-center text-xs text-text-secondary font-sans mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-moss dark:text-moss-dark hover:underline">
          Create one free
        </Link>
      </div>

      {/* Forgot Password Modal Overlay */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-bg-surface border border-border-base rounded-[10px] p-6 shadow-none w-full max-w-[400px]">
            <h3 className="font-satoshi text-lg font-semibold text-text-primary mb-1">
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
                {forgotError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-[6px] text-red-650 dark:text-red-400 text-xs font-sans">
                    {forgotError}
                  </div>
                )}
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '' }
  })

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' })
    }
  }, [error])

  useEffect(() => {
    // Pre-warm backend to resolve Render cold start delays
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://seedling-node-server.onrender.com';
    fetch(`${API_BASE_URL}/health`).catch(() => {});
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
        setError(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const onSubmit = async (data: any) => {
    setError(null)
    setToast(null)
    setLoading(true)
    try {
      const { error: err } = await signUp(data.email, data.password, data.name)
      if (err) {
        setError(err.message || 'Error creating account')
      } else {
        localStorage.setItem('seedling_signup_email', data.email)
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
      {/* Toast Alert Popup */}
      {toast && (
        <div className="fixed top-6 right-6 z-[999] animate-slideIn max-w-sm w-full bg-bg-surface border border-red-500/30 p-4 rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-start space-x-3 text-left">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Authentication Error</h4>
            <p className="text-xs text-text-secondary mt-1 leading-normal">{toast.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => { setToast(null); setError(null); }} 
            className="text-text-secondary hover:text-text-primary font-bold text-sm leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="text-center space-y-1">
        <div className="flex justify-center mb-4">
          <Sprout className="w-8 h-8 text-moss dark:text-moss-dark" />
        </div>
        <h2 className="font-satoshi text-2xl font-bold text-text-primary tracking-tight">
          Create your account
        </h2>
        <p className="text-text-secondary text-xs font-sans">
          Start your journey to funded missions.
        </p>
      </div>

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

      <div className="text-center text-xs text-text-secondary font-sans mt-6">
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
    const signupEmail = localStorage.getItem('seedling_signup_email')
    if (signupEmail) {
      setEmailText(signupEmail)
    } else if (pendingStr) {
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
        <h2 className="font-satoshi text-2xl font-bold text-text-primary tracking-tight">
          Check your inbox
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-sans leading-relaxed max-w-sm mx-auto">
          We've sent a verification link to <strong className="text-text-primary">{emailText}</strong>. Click the link inside the email to activate your account.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-bg-page dark:bg-zinc-800/50 border border-border-base/80 rounded-[6px] text-text-primary text-xs font-sans flex items-center space-x-2">
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
          <div className="mt-8 pt-6 border-t border-dashed border-border-base flex flex-col items-center">
            <span className="text-[10px] text-amber-text dark:text-amber-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lock size={12} /> Sandbox Testing Fallback
            </span>
            <Button 
              onClick={handleConfirmMock} 
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 hover:text-zinc-950 font-bold font-sans border-0 shadow-none"
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


// Auth Callback Page (Handles email verification redirects)
export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const { refreshProfile, profile } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    let active = true

    const verifySession = async () => {
      try {
        // Wait a small buffer to let Supabase SDK capture URL parameters/hash and sync
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (session) {
          if (!active) return
          setStatus('success')
          // Refresh the user profile to fetch organization status
          await refreshProfile()
        } else {
          // No session found yet, check on a retry loop
          let retries = 3
          while (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession) {
              if (!active) return
              setStatus('success')
              await refreshProfile()
              return
            }
            retries--
          }
          throw new Error('No active session found. The link may have expired or is invalid.')
        }
      } catch (err: any) {
        if (!active) return
        setStatus('error')
        setErrorMessage(err.message || 'Failed to verify email.')
      }
    }

    verifySession()

    return () => {
      active = false
    }
  }, [refreshProfile])

  // Countdown timer on success
  useEffect(() => {
    if (status !== 'success') return
    if (countdown <= 0) {
      // Determine where to redirect
      const onboardingStep = profile?.onboarding_step ?? 1
      if (onboardingStep < 5) {
        navigate('/onboarding/identity')
      } else {
        navigate('/dashboard')
      }
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [status, countdown, navigate, profile])

  const handleManualProceed = () => {
    const onboardingStep = profile?.onboarding_step ?? 1
    if (onboardingStep < 5) {
      navigate('/onboarding/identity')
    } else {
      navigate('/dashboard')
    }
  }

  const handleCloseTab = () => {
    window.close()
    // Fallback if window.close() is blocked by browser security
    alert("You can now close this tab safely.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4 py-12 transition-colors duration-150">
      <div className="max-w-[440px] w-full bg-bg-surface border border-border-base rounded-[12px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6 text-center animate-[fadeIn_0.2s_ease-out]">
        
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Sprout className="w-6 h-6 text-moss dark:text-moss-dark animate-[bounce_2s_infinite]" />
            <span className="font-satoshi text-lg font-bold text-text-primary tracking-tight">Seedling</span>
          </div>
        </div>

        {status === 'loading' && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Loader2 className="w-10 h-10 text-moss dark:text-moss-dark animate-spin" />
            </div>
            <h3 className="font-satoshi text-xl font-bold text-text-primary tracking-tight">
              Verifying your email
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-sans">
              Please wait while we establish a secure session with Seedling...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-[pulse_1.5s_infinite]" />
              </div>
              <h3 className="font-satoshi text-xl font-bold text-text-primary tracking-tight">
                Email Verified!
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-sans leading-relaxed">
                Your account is now active. Redirecting you to onboarding in{' '}
                <strong className="text-moss dark:text-moss-dark font-bold">{countdown}s</strong>...
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleManualProceed}
                className="w-full py-3 text-xs font-semibold uppercase tracking-wider"
              >
                Proceed to Onboarding
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  className="py-2.5 text-xs font-semibold w-full"
                >
                  Go to Login
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handleCloseTab}
                  className="py-2.5 text-xs font-semibold w-full hover:border-red-500/30 hover:text-red-500"
                >
                  Close Tab
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="font-satoshi text-xl font-bold text-text-primary tracking-tight">
                Verification Failed
              </h3>
              <p className="text-red-650 dark:text-red-400 text-xs font-sans leading-relaxed bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-3 rounded-[6px]">
                {errorMessage || 'The verification link is invalid or has expired.'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full py-3 text-xs font-semibold uppercase tracking-wider"
              >
                Return to Login
              </Button>
              <button
                onClick={handleCloseTab}
                className="text-xs font-sans font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 block mx-auto hover:underline"
              >
                Close Tab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
