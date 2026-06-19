'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { BRAND_NAME } from '../lib/brand'
import { supabase } from '../lib/supabaseClient'
import { getInitials } from '../lib/displayName'
import { useSupabaseSession } from '../lib/useSupabaseSession'
import ProfileModal from './profile/ProfileModal'
import MobileSidebarDrawer from './layout/MobileSidebarDrawer'
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  type UserProfile,
} from '../lib/profileStorage'

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

const MARKETING_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
] as const

export function AppHeader({
  title,
  description,
  eyebrow = BRAND_NAME,
  variant = 'default',
}: {
  title: string
  description?: string
  eyebrow?: string
  variant?: 'default' | 'app' | 'marketing'
}) {
  const pathname = usePathname()
  const isAppShell = variant === 'app'
  const isMarketing = variant === 'marketing'
  const { email: sessionEmail, userId: sessionUserId } = useSupabaseSession()
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [showProfile, setShowProfile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setProfile(getStoredProfile())
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleSaveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    saveStoredProfile(nextProfile)
  }

  const initials = useMemo(
    () => getInitials(profile.yourName, sessionEmail),
    [profile.yourName, sessionEmail]
  )

  const showSignedInControls = Boolean(sessionUserId) && !isMarketing

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={cx(
                'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition hover:bg-secondary',
                isAppShell ? 'md:hidden' : 'lg:hidden'
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            </div>
          </div>
          {description ? (
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{description}</p>
          ) : null}
        </div>

        {isMarketing && !sessionUserId ? (
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Public navigation"
          >
            {MARKETING_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  pathname === link.href
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/signin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Start Free
            </Link>
          </nav>
        ) : null}

        <div
          className={cx(
            'flex items-center gap-2',
            isAppShell && 'md:hidden'
          )}
        >
          {showSignedInControls ? (
            <>
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm transition hover:bg-secondary"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
                  {initials}
                </span>
                <span className="hidden max-w-[180px] flex-1 text-left sm:block">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {profile.yourName?.trim() || 'Your profile'}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {sessionEmail}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="hidden rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary sm:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : isMarketing && !sessionUserId ? (
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/signin"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Start Free
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <ProfileModal
        open={showProfile}
        initialProfile={profile}
        sessionEmail={sessionEmail}
        onClose={() => setShowProfile(false)}
        onSave={handleSaveProfile}
      />

      <MobileSidebarDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        profile={profile}
        sessionEmail={sessionEmail}
        sessionUserId={sessionUserId}
        variant={isMarketing && !sessionUserId ? 'marketing' : 'app'}
        drawerBreakpoint={isMarketing ? 'lg' : 'md'}
        onOpenSettings={() => {
          setMobileMenuOpen(false)
          setShowProfile(true)
        }}
        onSignOut={handleSignOut}
      />
    </header>
  )
}
