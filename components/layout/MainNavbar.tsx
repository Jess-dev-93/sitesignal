'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { UserProfile, hasCompletedProfile } from '../../lib/profileStorage'

// ─── Types ────────────────────────────────────────────────────────────────────

type MainNavbarProps = {
  sessionEmail: string | null
  isLoggedIn: boolean
  profile: UserProfile
  onOpenProfile?: () => void
  onSignOut?: () => void
  onScrollToLeads?: () => void
  onScrollToAudit?: () => void
  onScrollToHistory?: () => void
  appHref?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(profile: UserProfile, email: string | null): string {
  if (profile.yourName?.trim()) {
    const parts = profile.yourName.trim().split(' ')
    return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  }
  if (!email) return 'CF'
  return email.slice(0, 2).toUpperCase()
}

function getProfileHeading(profile: UserProfile, email: string | null): string {
  if (profile.yourName?.trim()) return profile.yourName.trim()
  return email || 'Your Profile'
}

function getProfileSubheading(profile: UserProfile): string {
  const pieces = [
    profile.yourTitle || profile.yourSpecialty,
    profile.yourLocation,
  ].filter(Boolean)
  if (pieces.length > 0) return pieces.join(' · ')
  return 'Complete your profile'
}

// ─── Nav link config ──────────────────────────────────────────────────────────
// ✅ Outreach flipped to comingSoon: false — page is live
// ✅ Pipeline still coming soon — page not built yet

const APP_NAV_LINKS = [
  { href: '/app',          label: 'Dashboard', icon: '🏠', comingSoon: false },
  { href: '/app/leads',    label: 'Leads',     icon: '🎯', comingSoon: false },
  { href: '/app/audit',    label: 'Audit',     icon: '📊', comingSoon: false },
  { href: '/app/outreach', label: 'Outreach',  icon: '✉️', comingSoon: false },
  { href: '/app/pipeline', label: 'Pipeline',  icon: '📞', comingSoon: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function MainNavbar({
  sessionEmail,
  isLoggedIn,
  profile,
  onOpenProfile,
  onSignOut,
  appHref = '/app',
}: MainNavbarProps) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileNavRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileNavOpen &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(e.target as Node)
      ) {
        setMobileNavOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileNavOpen])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  const profileComplete = hasCompletedProfile(profile)

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b border-white/[0.07] bg-slate-950/80 backdrop-blur-2xl"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between md:h-[72px]">

          {/* Logo */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="sitesignal home"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg shadow-[0_8px_24px_rgba(37,99,235,0.28)] md:h-11 md:w-11 md:text-xl">
              🎯
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-none tracking-tight text-white md:text-base">
                sitesignal
              </p>
              <p className="mt-1 truncate text-[11px] leading-none text-slate-400">
                Lead Generation + Website Audits
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            {isLoggedIn && (
              <>
                {APP_NAV_LINKS.map((link) =>
                  link.comingSoon ? (
                    <span
                      key={link.href}
                      title="Coming soon"
                      className="relative flex cursor-default items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 select-none"
                    >
                      {link.label}
                      <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        isActive(link.href)
                          ? 'bg-white/[0.09] text-white'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                )}
                <div className="mx-1 h-7 w-px bg-white/10" aria-hidden="true" />
              </>
            )}

            <Link
              href="/pricing"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                pathname === '/pricing'
                  ? 'bg-white/[0.09] text-white'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Pricing
            </Link>

            <div className="mx-2 h-7 w-px bg-white/10" aria-hidden="true" />

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {onOpenProfile && (
                  <button
                    onClick={onOpenProfile}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                      profileComplete
                        ? 'border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.07]'
                        : 'border-amber-500/30 bg-amber-500/[0.08] hover:bg-amber-500/[0.12]'
                    }`}
                    title="Edit profile"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-xs font-bold text-blue-200">
                      {getInitials(profile, sessionEmail)}
                    </div>
                    <div className="max-w-[160px]">
                      <p className="truncate text-[13px] font-medium leading-none text-white">
                        {getProfileHeading(profile, sessionEmail)}
                      </p>
                      <p className={`mt-1 truncate text-[11px] leading-none ${
                        profileComplete ? 'text-slate-400' : 'text-amber-300'
                      }`}>
                        {getProfileSubheading(profile)}
                      </p>
                    </div>
                    {!profileComplete && (
                      <div
                        className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400"
                        aria-label="Profile incomplete"
                      />
                    )}
                  </button>
                )}

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:-translate-y-px hover:bg-blue-500 active:translate-y-0"
                >
                  Start Free
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile toggle */}
          <div className="relative md:hidden" ref={mobileNavRef}>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <Link
                  href="/app"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.28)]"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.28)]"
                >
                  Start Free
                </Link>
              )}

              <button
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
                aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] transition hover:bg-white/[0.08]"
              >
                <span className="relative block h-4 w-5">
                  <span className={`absolute left-0 top-0 h-[1.5px] w-5 rounded-full bg-slate-300 transition-all duration-200 ${mobileNavOpen ? 'top-[7px] rotate-45' : ''}`} />
                  <span className={`absolute left-0 top-[7px] h-[1.5px] w-5 rounded-full bg-slate-300 transition-all duration-200 ${mobileNavOpen ? 'opacity-0' : ''}`} />
                  <span className={`absolute left-0 top-[14px] h-[1.5px] w-5 rounded-full bg-slate-300 transition-all duration-200 ${mobileNavOpen ? 'top-[7px] -rotate-45' : ''}`} />
                </span>
              </button>
            </div>

            {/* Mobile dropdown */}
            <div
              id="mobile-nav"
              className={`absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-200 ${
                mobileNavOpen
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-2 opacity-0'
              }`}
            >
              <nav className="flex flex-col p-3" aria-label="Mobile navigation">

                {isLoggedIn && (
                  <div className="mb-2">
                    <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      App
                    </p>
                    {APP_NAV_LINKS.map((link) =>
                      link.comingSoon ? (
                        <span
                          key={link.href}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 select-none"
                        >
                          <span aria-hidden="true" className="opacity-40">
                            {link.icon}
                          </span>
                          <span>{link.label}</span>
                          <span className="ml-auto rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                            soon
                          </span>
                        </span>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                            isActive(link.href)
                              ? 'bg-white/[0.08] text-white'
                              : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <span aria-hidden="true">{link.icon}</span>
                          {link.label}
                          {isActive(link.href) && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
                          )}
                        </Link>
                      )
                    )}
                  </div>
                )}

                <Link
                  href="/pricing"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    pathname === '/pricing'
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span aria-hidden="true">💳</span>
                  Pricing
                </Link>

                <div className="mt-2 border-t border-white/[0.07] px-1 pt-3">
                  {isLoggedIn ? (
                    <div className="space-y-2">
                      {onOpenProfile && (
                        <button
                          onClick={onOpenProfile}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                            profileComplete
                              ? 'border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08]'
                              : 'border-amber-500/30 bg-amber-500/[0.08] hover:bg-amber-500/[0.12]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-xs font-bold text-blue-200">
                              {getInitials(profile, sessionEmail)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium leading-none text-white">
                                {getProfileHeading(profile, sessionEmail)}
                              </p>
                              <p className={`mt-1 text-[11px] ${
                                profileComplete ? 'text-slate-400' : 'text-amber-300'
                              }`}>
                                {profileComplete
                                  ? getProfileSubheading(profile)
                                  : '⚠️ Complete your profile'}
                              </p>
                            </div>
                          </div>
                        </button>
                      )}

                      {onSignOut && (
                        <button
                          onClick={onSignOut}
                          className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                        >
                          Sign Out
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="px-1 pb-1 text-[12px] text-slate-400">
                        Sign in to save leads and audits
                      </p>
                      <Link
                        href="/signin"
                        className="block w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}

