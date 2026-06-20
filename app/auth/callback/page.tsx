'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MarketingShell from '../../../components/layout/MarketingShell'
import { Card, CardContent } from '../../../components/ui/card'
import { supabase, supabaseConfigError } from '../../../lib/supabaseClient'
import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Completing sign-in…')

  useEffect(() => {
    if (supabaseConfigError) {
      router.replace('/signin?error=missing_env')
      return
    }

    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/app'
    const isPasswordReset = next.startsWith('/reset-password')

    if (!code) {
      router.replace(
        isPasswordReset ? '/reset-password?error=missing_code' : '/signin?error=missing_code'
      )
      return
    }

    let cancelled = false
    setStatus(isPasswordReset ? 'Verifying your reset link…' : 'Completing sign-in…')

    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (cancelled) return

      if (error) {
        router.replace(
          isPasswordReset
            ? '/reset-password?error=auth_callback_failed'
            : '/signin?error=auth_callback_failed'
        )
        return
      }

      router.replace(next)
    })

    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <MarketingShell headerDescription={status}>
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">{status}</CardContent>
      </Card>
    </MarketingShell>
  )
}

export default function AuthCallbackPage(props: NextPageProps) {
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
      <AuthCallbackInner />
    </Suspense>
  )
}
