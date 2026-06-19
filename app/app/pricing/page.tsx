'use client'

import { NextPageProps, useUnwrapNextPageProps } from '../../../lib/nextPageProps'
import { useSupabaseSession } from '../../../lib/useSupabaseSession'
import { AppHeader } from '../../../components/app-header'
import PricingContent from '../../../components/pricing/PricingContent'

export default function AppPricingPage(props: NextPageProps) {
  useUnwrapNextPageProps(props)
  const { userId: sessionUserId } = useSupabaseSession()

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        variant="app"
        eyebrow="Workspace"
        title="Pricing"
        description="Upgrade your plan or compare features"
      />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <PricingContent sessionUserId={sessionUserId} variant="app" />
        </div>
      </main>
    </div>
  )
}
