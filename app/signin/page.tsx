'use client'

import { useEffect } from 'react'
import AuthForm from '../../components/AuthForm'
import MarketingShell from '../../components/layout/MarketingShell'
import { Card, CardContent } from '../../components/ui/card'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'

export default function SignInPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const { userId: sessionUserId, loading: checkingSession } = useSupabaseSession()

  useEffect(() => {
    if (!checkingSession && sessionUserId) {
      window.location.href = '/app'
    }
  }, [checkingSession, sessionUserId])

  if (checkingSession) {
    return (
      <MarketingShell headerDescription="Checking your session…">
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-sm text-muted-foreground">Checking session…</CardContent>
        </Card>
      </MarketingShell>
    )
  }

  return (
    <MarketingShell headerDescription="Access your leads, audits, and outreach">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Welcome back
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick up where you left off with your leads and audits.
        </p>
      </div>

      <AuthForm
        initialMode="sign-in"
        redirectTo="/app"
        onSignedIn={() => {
          window.location.href = '/app'
        }}
      />
    </MarketingShell>
  )
}
