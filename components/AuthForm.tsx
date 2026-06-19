'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import SupabaseConfigNotice from './SupabaseConfigNotice'

type AuthMode = 'sign-in' | 'sign-up'

type AuthFormProps = {
  initialMode?: AuthMode
  redirectTo?: string
  onSignedIn?: () => void
}

const LAST_EMAIL_KEY = 'clientFinderLastAuthEmail'

function normaliseAuthError(err: any, mode: AuthMode) {
  const raw =
    err?.message ||
    err?.error_description ||
    err?.msg ||
    'Authentication failed. Please try again.'

  const msg = String(raw)

  // Supabase common cases
  if (/Invalid login credentials/i.test(msg)) {
    return 'Incorrect email or password. Please try again.'
  }

  if (/Email not confirmed/i.test(msg)) {
    return 'Your email isn’t confirmed yet. Please check your inbox and confirm your account, then sign in again.'
  }

  if (/User already registered/i.test(msg) || /already exists/i.test(msg) || err?.code === 'user_already_exists') {
    return mode === 'sign-up'
      ? 'This email is already in use. Try signing in instead.'
      : 'This email already has an account. Try signing in.'
  }

  if (/Password should be at least/i.test(msg) || /at least 6/i.test(msg)) {
    return 'Your password must be at least 6 characters.'
  }

  if (/rate limit/i.test(msg)) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  if (/supabase is not configured/i.test(msg)) {
    return msg
  }

  if (/supabaseurl is required/i.test(msg)) {
    return 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.'
  }

  return msg
}

export default function AuthForm({
  initialMode = 'sign-up',
  redirectTo = '/app',
  onSignedIn,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [canResendConfirm, setCanResendConfirm] = useState(false)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_EMAIL_KEY)
      if (stored && !email) setEmail(stored)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!rememberEmail) return
    if (!email) return
    try {
      localStorage.setItem(LAST_EMAIL_KEY, email)
    } catch {}
  }, [email, rememberEmail])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    setCanResendConfirm(false)

    try {
      if (mode === 'sign-up') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
          },
        })

        if (error) throw error

        // Supabase behaviour: if the user already exists, signUp can return a user
        // with an empty identities array and no error. In that case, no new
        // confirmation email is sent.
        const identities = (data as any)?.user?.identities
        if (Array.isArray(identities) && identities.length === 0) {
          setError('This email is already in use. Try signing in instead.')
          setCanResendConfirm(true)
          return
        }

        // Supabase often returns no session if email confirmations are enabled.
        // In that case we should NOT pretend the user is signed in.
        if (!data?.session) {
          setMessage(
            'Account created. Check your email to confirm your account, then sign in.'
          )
          setCanResendConfirm(true)
        } else {
          setMessage('Account created. Signing you in...')
          if (onSignedIn) onSignedIn()
          else window.location.href = redirectTo
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (!data.session?.user) {
          throw new Error('Sign-in succeeded, but no session was returned.')
        }

        if (!rememberEmail) {
          try {
            localStorage.removeItem(LAST_EMAIL_KEY)
          } catch {}
        }

        setMessage('Signed in successfully. Redirecting...')

        if (onSignedIn) {
          onSignedIn()
        } else {
          window.location.href = redirectTo
        }
      }
    } catch (err: any) {
      const normalised = normaliseAuthError(err, mode)
      setError(normalised)
      if (/isn’t confirmed yet/i.test(normalised)) {
        setCanResendConfirm(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo },
      })

      if (error) throw error

      setMessage('Confirmation email resent. Check your inbox (and spam) for the link.')
    } catch (err: any) {
      setError(normaliseAuthError(err, mode))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SupabaseConfigNotice />
      {supabaseConfigError ? null : (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="mb-4">
        <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          Account
        </div>

        <h2 className="text-xl font-bold text-white">
          {mode === 'sign-in' ? 'Sign in' : 'Create your account'}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Use a real account so your leads, audits, outreach, and call list belong to you.
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            placeholder="you@example.com"
            autoComplete="email"
            name="email"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              placeholder="Minimum 6 characters"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              name="password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="h-4 w-4 accent-blue-500"
            />
            Remember email on this device
          </label>

          <button
            type="button"
            onClick={() => {
              setPassword('')
              setError('')
              setMessage('')
            }}
            className="text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {canResendConfirm && (
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={loading || !email}
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resend confirmation email
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.24)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Please wait...
            </>
          ) : mode === 'sign-in' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>

        {mode === 'sign-in' ? (
          <div className="space-y-3 text-center text-sm text-slate-400">
            <p>
              Forgot your password?{' '}
              <Link
                href="/forgot-password"
                className="text-slate-200 transition hover:text-white"
              >
                Reset it
              </Link>
            </p>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-slate-200 transition hover:text-white">
                Create one
              </Link>
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-slate-200 transition hover:text-white">
              Sign in
            </Link>
          </p>
        )}
      </form>
    </section>
      )}
    </>
  )
}