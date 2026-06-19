'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { getInitials } from '../../lib/displayName'
import { BRAND_NAME } from '../../lib/brand'
import type { UserProfile } from '../../lib/profileStorage'

type Props = {
  open: boolean
  onClose: () => void
  profile: UserProfile
  sessionEmail: string | null
  sessionUserId: string | null
  variant?: 'app' | 'marketing'
  /** Hide drawer above this breakpoint — must match header menu button visibility */
  drawerBreakpoint?: 'md' | 'lg'
  onOpenSettings: () => void
  onSignOut: () => void
}

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: 'grid' | 'users' | 'file' | 'send' | 'branch' | 'card' | 'help'
  className?: string
}) {
  const common = `${className} shrink-0`
  switch (name) {
    case 'grid':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'users':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 20c1.6-3.5 5-5 8-5s6.4 1.5 8 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'file':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h7l3 3v15H7V3Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'send':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22 2 11 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M22 2 15 22l-4-9-9-4L22 2Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'branch':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 3v6a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M6 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM18 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'card':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7h18v10H3V7Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'help':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M9.5 9a2.6 2.6 0 1 1 4.2 2.1c-.9.7-1.7 1.2-1.7 2.4v.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
  }
}

const MAIN_LINKS = [
  { href: '/app', label: 'Dashboard', icon: 'grid' as const },
  { href: '/app/leads', label: 'Leads', icon: 'users' as const },
  { href: '/app/audit', label: 'Audit', icon: 'file' as const },
  { href: '/app/outreach', label: 'Outreach', icon: 'send' as const },
  { href: '/app/pipeline', label: 'Pipeline', icon: 'branch' as const },
]

const PUBLIC_LINKS = [
  { href: '/', label: 'Home', icon: 'grid' as const },
  { href: '/pricing', label: 'Pricing', icon: 'card' as const },
  { href: '/signin', label: 'Sign in', icon: 'help' as const },
  { href: '/signup', label: 'Start Free', icon: 'send' as const },
]

export default function MobileSidebarDrawer({
  open,
  onClose,
  profile,
  sessionEmail,
  sessionUserId,
  variant = 'app',
  drawerBreakpoint = 'md',
  onOpenSettings,
  onSignOut,
}: Props) {
  const pathname = usePathname()
  const navLinks = variant === 'marketing' ? PUBLIC_LINKS : MAIN_LINKS
  const drawerVisibilityClass = drawerBreakpoint === 'lg' ? 'lg:hidden' : 'md:hidden'

  const initials = useMemo(
    () => getInitials(profile.yourName, sessionEmail),
    [profile.yourName, sessionEmail]
  )

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`fixed inset-0 z-[60] ${drawerVisibilityClass}`}>
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="absolute left-0 top-0 flex h-full w-[86%] max-w-[340px] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/90 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 shadow-[0_10px_30px_rgba(139,92,246,0.28)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden="true">
                <path
                  d="M4 13c2.2-6 4.6-6 6.8 0s4.6 6 6.8 0S22 7 20 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none text-white">{BRAND_NAME}</p>
              <p className="mt-1 truncate text-[11px] leading-none text-slate-500">
                Lead Generation + Website Audits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-4 h-px w-full bg-white/10" />
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Main menu
          </p>
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => {
              const active =
                l.href === '/app' || l.href === '/'
                  ? pathname === l.href
                  : pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onClose}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    <Icon name={l.icon} />
                  </span>
                  <span className="truncate">{l.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto px-4 pb-5">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Support
          </p>
          <nav className="flex flex-col gap-1">
            {variant !== 'marketing' ? (
              <Link
                href="/app/pricing"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                <span className="text-slate-200" aria-hidden="true">
                  <Icon name="card" />
                </span>
                Pricing
              </Link>
            ) : null}
            {sessionUserId ? (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenSettings()
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                <Settings className="h-5 w-5 text-slate-200" />
                Settings
              </button>
            ) : null}
            <a
              href="mailto:hello@sitesignal.com.au?subject=SiteSignal%20Help"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              <span className="text-slate-200" aria-hidden="true">
                <Icon name="help" />
              </span>
              Help
            </a>
          </nav>

          <div className="mt-6 h-px w-full bg-white/10" />
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenSettings()
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-white">
                    {profile.yourName?.trim() || sessionEmail || 'Signed out'}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">
                    {sessionEmail || 'Sign in to sync your work'}
                  </span>
                </span>
              </button>

              {sessionUserId ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  ↗
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
