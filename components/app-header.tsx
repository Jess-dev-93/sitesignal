'use client'

import { useEffect, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
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

export function AppHeader({
  title,
  description,
  eyebrow = 'sitesignal',
  variant = 'default',
}: {
  title: string
  description?: string
  eyebrow?: string
  variant?: 'default' | 'app'
}) {
  const isAppShell = variant === 'app'
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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
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

        <div
          className={cx(
            'flex items-center gap-2',
            isAppShell && 'md:hidden'
          )}
        >
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
                {sessionEmail || 'Signed out'}
              </span>
            </span>
          </button>

          {sessionUserId ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary sm:inline-flex"
            >
              Sign out
            </button>
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
        onOpenSettings={() => {
          setMobileMenuOpen(false)
          setShowProfile(true)
        }}
        onSignOut={handleSignOut}
      />
    </header>
  )
}
