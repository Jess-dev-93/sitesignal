'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { BRAND_NAME } from '../lib/brand'
import { useSupabaseSession } from '../lib/useSupabaseSession'

/** Logo lockup: squircle gradient + single-line heartbeat + wordmark only */
function SiteSignalLogoLink() {
  return (
    <Link
      href="/"
      className="group inline-flex max-w-full items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400 shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition group-hover:shadow-[0_10px_28px_rgba(192,38,211,0.35)]">
        <svg
          viewBox="0 0 24 24"
          className="h-[26px] w-[26px] text-white"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 12H9L10.5 7L12 17L13.5 12H19"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">{BRAND_NAME}</span>
    </Link>
  )
}

const APP_LINKS = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/leads', label: 'Leads' },
  { href: '/app/audit', label: 'Audit' },
  { href: '/app/outreach', label: 'Outreach' },
  { href: '/app/pipeline', label: 'Pipeline' },
] as const

const SITE_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
] as const

const PUBLIC_ACCOUNT_LINKS = [
  { href: '/signin', label: 'Sign in' },
  { href: '/signup', label: 'Start Free' },
] as const

const SIGNED_IN_ACCOUNT_LINKS = [
  { href: '/app', label: 'Dashboard' },
  { href: '/signin', label: 'Sign in' },
] as const

const SUPPORT_LINKS = [
  {
    href: 'mailto:hello@sitesignal.com.au?subject=SiteSignal%20Help',
    label: 'Help',
  },
  {
    href: 'mailto:hello@sitesignal.com.au?subject=SiteSignal%20—%20Contact',
    label: 'Contact',
  },
] as const

function FooterColumn({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`min-w-0 md:col-span-1 ${className}`.trim()}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

type SiteFooterProps = {
  className?: string
}

export default function SiteFooter({ className = '' }: SiteFooterProps) {
  const year = new Date().getFullYear()
  const { userId: sessionUserId } = useSupabaseSession()
  const isLoggedIn = Boolean(sessionUserId)

  return (
    <footer
      role="contentinfo"
      className={`border-t border-border bg-background ${className}`.trim()}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div
          className="grid grid-cols-1 gap-10 md:grid-cols-6 md:gap-x-8 md:gap-y-0 lg:gap-x-12"
          aria-label="Footer"
        >
          <div className="min-w-0 md:col-span-2 md:pr-4 lg:pr-8">
            <SiteSignalLogoLink />
            <p className="mt-5 max-w-sm text-base font-medium leading-snug text-foreground">
              Find weak websites. Turn them into paying clients.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Lead generation and website audits built for web developers who want to win better
              client work.
            </p>
          </div>

          {isLoggedIn ? (
            <FooterColumn title="App">
              {APP_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </FooterColumn>
          ) : null}

          <FooterColumn title="Site">
            {SITE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Account">
            {(isLoggedIn ? SIGNED_IN_ACCOUNT_LINKS : PUBLIC_ACCOUNT_LINKS).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Support">
            {SUPPORT_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-10 w-full border-t border-border pt-6 md:mt-12">
          <div className="flex w-full flex-col items-center justify-between gap-2 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:gap-0 sm:text-sm">
            <p className="w-full text-center sm:w-auto sm:text-left">
              © {year} {BRAND_NAME}. All rights reserved.
            </p>
            <p className="w-full text-center sm:w-auto sm:text-right">Made with ♥ in Australia</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
