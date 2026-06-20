'use client'

import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'
import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import AppPageShell from '../../../components/layout/AppPageShell'
import PageIntroCard from '../../../components/layout/PageIntroCard'
import PricingContent from '../../../components/pricing/PricingContent'

export default function AppPricingPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const { userId: sessionUserId } = useSupabaseSession()

  return (
    <AppPageShell title="Pricing" description="Upgrade your plan or compare features">
      <PageIntroCard
        title="Plans for every stage"
        description="Start free, then upgrade when you need unlimited audits, outreach, and pipeline tools."
      />
      <PricingContent sessionUserId={sessionUserId} variant="app" />
    </AppPageShell>
  )
}
