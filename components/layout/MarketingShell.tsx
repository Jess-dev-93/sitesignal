'use client'

import type { ReactNode } from 'react'
import { AppHeader } from '../app-header'
import SiteFooter from '../site-footer'

export default function MarketingShell({
  children,
  headerTitle = 'sitesignal',
  headerDescription,
}: {
  children: ReactNode
  headerTitle?: string
  headerDescription?: string
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-[35%] right-[-200px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <AppHeader title={headerTitle} description={headerDescription} />
      <main className="relative mx-auto w-full max-w-xl px-4 py-10 sm:px-6 md:py-16">{children}</main>
      <SiteFooter />
    </div>
  )
}
