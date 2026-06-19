'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MarketingShell from '../../components/layout/MarketingShell'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import SupabaseConfigNotice from '../../components/SupabaseConfigNotice'
import { supabase, supabaseConfigError } from '../../lib/supabaseClient'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'

const LAST_EMAIL_KEY = 'clientFinderLastAuthEmail'

export default function ForgotPasswordPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_EMAIL_KEY)
      if (stored) setEmail(stored)
    } catch {}
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (supabaseConfigError) {
      setError(supabaseConfigError)
      return
    }

    setLoading(true)
    setMessage('')
    setError('')
    try {
      const siteUrl = window.location.origin
      const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent('/reset-password')}`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (resetError) throw resetError

      setMessage('Password reset email sent. Check your inbox (and spam) for the link.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingShell headerDescription="We'll email you a secure reset link">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Password reset
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <SupabaseConfigNotice />
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="you@example.com"
                autoComplete="email"
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

            <Button type="submit" disabled={loading || Boolean(supabaseConfigError)} className="w-full">
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Back to{' '}
              <Link href="/signin" className="text-foreground transition hover:opacity-80">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </MarketingShell>
  )
}
