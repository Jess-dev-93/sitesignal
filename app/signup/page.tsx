'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthForm from '../../components/AuthForm'
import MarketingShell from '../../components/layout/MarketingShell'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'

export default function SignUpPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const router = useRouter()
  const { userId: sessionUserId } = useSupabaseSession()

  useEffect(() => {
    if (sessionUserId) {
      router.replace('/app')
    }
  }, [router, sessionUserId])

  return (
    <MarketingShell headerDescription="Start finding leads and running audits">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Get started
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save lead searches, audits, outreach, and pipeline activity in one place.
        </p>
      </div>

      <AuthForm initialMode="sign-up" redirectTo="/app" />
    </MarketingShell>
  )
}
