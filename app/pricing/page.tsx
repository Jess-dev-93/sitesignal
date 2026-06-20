'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NextPageProps, useUnwrapNextPageProps } from '../../lib/nextPageProps'
import { useSupabaseSession } from '../../lib/useSupabaseSession'
import MarketingShell from '../../components/layout/MarketingShell'
import PricingContent from '../../components/pricing/PricingContent'

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
    <MarketingShell
      width="wide"
      headerTitle="Pricing"
      headerDescription="Choose a plan that fits your workflow"
    >
      <PricingContent sessionUserId={sessionUserId} variant="marketing" />
    </MarketingShell>
  )
}
