'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import { AppHeader } from '../../components/app-header'
import PricingContent from '../../components/pricing/PricingContent'
import SiteFooter from '../../components/site-footer'

export default function PricingPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const router = useRouter()
  const { userId: sessionUserId, loading } = useSupabaseSession()

  useEffect(() => {
    if (!loading && sessionUserId) {
      const query = window.location.search
      router.replace(`/app/pricing${query}`)
    }
  }, [loading, router, sessionUserId])

  if (!loading && sessionUserId) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-[35%] right-[-200px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <AppHeader
        variant="marketing"
        title="Pricing"
        description="Choose a plan that fits your workflow"
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <PricingContent sessionUserId={sessionUserId} variant="marketing" />
      </main>

      <SiteFooter />
    </div>
  )
}
