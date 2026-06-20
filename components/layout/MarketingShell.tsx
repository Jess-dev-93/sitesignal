'use client'

import type { ReactNode } from 'react'
import { BRAND_NAME } from '../../lib/brand'
import { AppHeader } from '../app-header'
import SiteFooter from '../site-footer'
import PageBackground from './PageBackground'

type MarketingShellProps = {
  children: ReactNode
  headerTitle?: string
  headerDescription?: string
  /** Narrow for auth forms; wide matches the home page content width. */
  width?: 'narrow' | 'wide'
}

export default function MarketingShell({
  children,
  headerTitle = BRAND_NAME,
  headerDescription,
  width = 'narrow',
}: MarketingShellProps) {
  const mainClass =
    width === 'wide' ? 'ss-marketing-main-wide' : 'ss-marketing-main-narrow'

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground />
      <AppHeader variant="marketing" title={headerTitle} description={headerDescription} />
      <main className={mainClass}>{children}</main>
      <SiteFooter />
    </div>
  )
}
