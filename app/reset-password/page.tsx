'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import MarketingShell from '../../components/layout/MarketingShell'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { supabase, supabaseConfigError } from '../../lib/supabaseClient'
import { isPasswordRecoveryHash } from '../../lib/authRecovery'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const { userId: sessionUserId, loading: checkingSession } = useSupabaseSession()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [recoveryReady, setRecoveryReady] = useState(false)
  const ready = !checkingSession

  useEffect(() => {
    if (supabaseConfigError) return

    const hash = window.location.hash
    if (isPasswordRecoveryHash(hash)) {
      window.history.replaceState(null, '', `/reset-password${hash}`)
    }

    const code = searchParams.get('code')
    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError('This reset link is invalid or expired. Please request a new one.')
          return
        }
        setRecoveryReady(true)
        window.history.replaceState(null, '', '/reset-password')
      })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setRecoveryReady(Boolean(session))
      }
    })

    return () => subscription.unsubscribe()
  }, [searchParams])

  useEffect(() => {
    if (sessionUserId) {
      setRecoveryReady(true)
    }
  }, [sessionUserId])

  useEffect(() => {
    if (!errorParam) return
    if (errorParam === 'auth_callback_failed') {
      setError('This reset link is invalid or expired. Please request a new one.')
    } else if (errorParam === 'missing_code') {
      setError('This reset link is missing required details. Please request a new one.')
    } else if (errorParam === 'missing_env') {
      setError('Server auth is missing configuration. Please check env vars.')
    }
  }, [errorParam])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (password.length < 6) {
        setError('Your password must be at least 6 characters.')
        return
      }
      if (password !== confirm) {
        setError('Passwords do not match.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      setMessage('Password updated. Redirecting you to sign in…')
      setTimeout(() => router.replace('/signin'), 900)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingShell headerDescription="Choose a new password for your account">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Set new password
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For security, this page works only from a valid reset link.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-5">
          {!ready ? (
            <p className="text-sm text-muted-foreground">Checking reset session…</p>
          ) : !recoveryReady ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You&apos;re not signed into a reset session yet. Please open the reset link from
                your email again.
              </p>
              <p className="text-sm text-muted-foreground">
                Or request a new link from{' '}
                <Link href="/forgot-password" className="text-foreground transition hover:opacity-80">
                  Forgot password
                </Link>
                .
              </p>
              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-20 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-80"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  {message}
                </div>
              ) : null}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Updating…' : 'Update password'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Back to{' '}
                <Link href="/signin" className="text-foreground transition hover:opacity-80">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </MarketingShell>
  )
}

export default function ResetPasswordPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  return (
    <Suspense
      fallback={
        <MarketingShell headerDescription="Loading…">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
          </Card>
        </MarketingShell>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  )
}
