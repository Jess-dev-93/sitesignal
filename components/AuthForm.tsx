'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

type AuthMode = 'sign-in' | 'sign-up'

type AuthFormProps = {
  initialMode?: AuthMode
  redirectTo?: string
  onSignedIn?: () => void
}

export default function AuthForm({
  initialMode = 'sign-up',
  redirectTo = '/app',
  onSignedIn,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        setMessage('Account created. Check your email to confirm your account.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (!data.session?.user) {
          throw new Error('Sign-in succeeded, but no session was returned.')
        }

        setMessage('Signed in successfully. Redirecting...')

        if (onSignedIn) {
          onSignedIn()
        } else {
          window.location.href = redirectTo
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
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
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/[0.10] bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            placeholder="Minimum 6 characters"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            required
          />
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
          <p className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-slate-200 transition hover:text-white">
              Create one
            </Link>
          </p>
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
  )
}